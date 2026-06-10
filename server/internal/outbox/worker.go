// Package outbox drains the dm_outbox queue: a pool of workers claims pending
// jobs (FOR UPDATE SKIP LOCKED), respects the per-account send limit, sends the
// private-reply DM plus a best-effort public comment reply, and retries or
// dead-letters durably. dm_outbox is the single source of truth — workers pull
// from it, so a crash or restart simply resumes from the table.
package outbox

import (
	"context"
	"errors"
	"log"
	"math/rand"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"loop/internal/core/domain"
	"loop/internal/store"
)

const (
	iterationTimeout   = 30 * time.Second // whole claim→send→commit budget
	sendTimeout        = 10 * time.Second // the DM private-reply call
	publicReplyTimeout = 8 * time.Second  // the best-effort public reply call
	publicReplyText    = "Sent you a DM 📩"
)

// accounts resolves an account's decrypted token by its Instagram id.
type accounts interface {
	AuthorizedByExternal(ctx context.Context, externalAccountID string) (domain.ConnectedAccount, error)
}

// sender performs the two Meta calls a matched comment needs.
type sender interface {
	SendDirectMessage(ctx context.Context, account domain.ConnectedAccount, commentID, text string) (string, error)
	ReplyToComment(ctx context.Context, account domain.ConnectedAccount, commentID, text string) (string, error)
}

// limiter is the durable per-account token bucket.
type limiter interface {
	Allow(ctx context.Context, account string) (bool, time.Duration, error)
}

type Config struct {
	Workers     int
	MinPoll     time.Duration
	MaxPoll     time.Duration
	MaxAttempts int
	DryRun      bool
}

type Pool struct {
	pool     *pgxpool.Pool
	q        *store.Queries
	accounts accounts
	sender   sender
	limiter  limiter
	cfg      Config
	wg       sync.WaitGroup
}

func NewPool(pool *pgxpool.Pool, acc accounts, snd sender, lim limiter, cfg Config) *Pool {
	if cfg.Workers <= 0 {
		cfg.Workers = 10
	}
	if cfg.MinPoll <= 0 {
		cfg.MinPoll = 250 * time.Millisecond
	}
	if cfg.MaxPoll <= 0 {
		cfg.MaxPoll = 2 * time.Second
	}
	if cfg.MaxAttempts <= 0 {
		cfg.MaxAttempts = 5
	}
	// A worker holds its claimed-row connection through the send, and briefly
	// grabs a 2nd connection when the limiter runs its own tx — so the pool must
	// fit 2×Workers plus HTTP headroom or sends can starve the connection pool.
	if mc := int(pool.Config().MaxConns); mc < 2*cfg.Workers {
		log.Printf("outbox: WARNING pool MaxConns=%d < 2*workers=%d; workers hold a connection through each Meta send — raise MaxConns to >= 2*workers + HTTP headroom to avoid pool starvation", mc, 2*cfg.Workers)
	}
	return &Pool{pool: pool, q: store.New(pool), accounts: acc, sender: snd, limiter: lim, cfg: cfg}
}

// Start launches the worker goroutines on ctx. Cancel ctx to drain, then Wait.
func (p *Pool) Start(ctx context.Context) {
	log.Printf("outbox pool started: %d workers (dry_run=%v)", p.cfg.Workers, p.cfg.DryRun)
	for i := 0; i < p.cfg.Workers; i++ {
		p.wg.Add(1)
		go p.worker(ctx)
	}
}

// Wait blocks until every worker has drained and exited.
func (p *Pool) Wait() { p.wg.Wait() }

// worker is work-conserving: it keeps claiming while jobs exist, and backs off
// with jitter (up to MaxPoll) when the queue is empty.
func (p *Pool) worker(ctx context.Context) {
	defer p.wg.Done()
	poll := p.cfg.MinPoll
	for {
		if ctx.Err() != nil {
			return
		}
		did, err := p.processOne(ctx)
		if err != nil && ctx.Err() == nil {
			log.Printf("outbox: %v", err)
		}
		if did {
			poll = p.cfg.MinPoll
			continue
		}
		poll = nextPoll(poll, p.cfg.MaxPoll)
		select {
		case <-ctx.Done():
			return
		case <-time.After(jitter(poll)):
		}
	}
}

// pendingReply carries what the post-commit public reply needs.
type pendingReply struct {
	account   domain.ConnectedAccount
	commentID string
}

// processOne claims and handles a single job inside one transaction. The claimed
// row stays locked through the send, so a crash rolls the whole thing back and
// the job stays pending — there is no half-done "sending" state to reap. The
// best-effort public reply runs only AFTER commit, so it neither holds the DB
// connection nor competes with the DM for a shared time budget.
func (p *Pool) processOne(parent context.Context) (bool, error) {
	ctx, cancel := context.WithTimeout(parent, iterationTimeout)
	defer cancel()

	tx, err := p.pool.Begin(ctx)
	if err != nil {
		return false, err
	}
	defer tx.Rollback(ctx) // no-op once committed

	q := p.q.WithTx(tx)
	job, err := q.ClaimDMJob(ctx)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}

	ack, err := p.handle(ctx, q, job)
	if err != nil {
		return false, err // infra error → rollback, job remains pending
	}
	if err := tx.Commit(ctx); err != nil {
		return false, err
	}

	// Connection released. Best-effort public ack with its own fresh budget.
	if ack != nil {
		p.publicReply(parent, ack)
	}
	return true, nil
}

// handle decides and records the outcome for one job. It returns a pendingReply
// only when a DM was actually sent (so the caller posts the public ack); for
// deferred / dry-run / retried / failed jobs it returns nil.
func (p *Pool) handle(ctx context.Context, q *store.Queries, job store.DmOutbox) (*pendingReply, error) {
	// Rate limit runs in its own short tx (inside Allow), released before the send.
	ok, wait, err := p.limiter.Allow(ctx, job.ExternalAccountID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, q.DeferJob(ctx, store.DeferJobParams{ID: job.ID, NextAttemptAt: time.Now().Add(wait)})
	}

	text := composeText(job.Body, job.Link)

	if p.cfg.DryRun {
		log.Printf("outbox: [dry-run] would DM comment %s (account %s): %q", job.CommentID, job.ExternalAccountID, text)
		return nil, q.MarkSent(ctx, job.ID)
	}

	account, err := p.accounts.AuthorizedByExternal(ctx, job.ExternalAccountID)
	if err != nil {
		return nil, p.retryOrFail(ctx, q, job, err) // e.g. account mid-reconnect → retry
	}

	sendCtx, cancel := context.WithTimeout(ctx, sendTimeout)
	defer cancel()

	msgID, err := p.sender.SendDirectMessage(sendCtx, account, job.CommentID, text)
	if err != nil {
		return nil, p.retryOrFail(ctx, q, job, err)
	}
	log.Printf("outbox: sent DM to comment %s → message %s", job.CommentID, msgID)

	// The DM is the deliverable; mark sent now so a public-reply failure can
	// never cause a re-send of the DM.
	if err := q.MarkSent(ctx, job.ID); err != nil {
		return nil, err
	}
	return &pendingReply{account: account, commentID: job.CommentID}, nil
}

// publicReply posts the "check your DMs" acknowledgment. It is best-effort: it
// runs after commit (no DB connection held) with its own fresh timeout, and a
// failure is logged but never retried and never affects the already-sent DM.
func (p *Pool) publicReply(parent context.Context, r *pendingReply) {
	ctx, cancel := context.WithTimeout(parent, publicReplyTimeout)
	defer cancel()
	if _, err := p.sender.ReplyToComment(ctx, r.account, r.commentID, publicReplyText); err != nil {
		log.Printf("outbox: public reply failed for comment %s (non-fatal): %v", r.commentID, err)
	}
}

// retryOrFail backs off transient errors and dead-letters permanent ones (or
// once MaxAttempts is reached). Backoff stays far inside Meta's 7-day window.
func (p *Pool) retryOrFail(ctx context.Context, q *store.Queries, job store.DmOutbox, cause error) error {
	msg := cause.Error()
	attempts := int(job.AttemptCount) + 1
	if permanent(cause) || attempts >= p.cfg.MaxAttempts {
		log.Printf("outbox: dead-letter comment %s after %d attempt(s): %v", job.CommentID, attempts, cause)
		return q.FailJob(ctx, store.FailJobParams{ID: job.ID, LastError: &msg})
	}
	backoff := time.Duration(1<<uint(job.AttemptCount)) * time.Minute // 1,2,4,8,...
	log.Printf("outbox: retry comment %s in %s (attempt %d): %v", job.CommentID, backoff, attempts, cause)
	return q.RetryJob(ctx, store.RetryJobParams{
		ID:            job.ID,
		NextAttemptAt: time.Now().Add(backoff),
		LastError:     &msg,
	})
}

// permanent reports whether an error should not be retried: a 4xx from Meta
// (except 429 rate-limit). Unknown errors (network, timeout) are transient.
func permanent(err error) bool {
	var api interface{ StatusCode() int }
	if errors.As(err, &api) {
		code := api.StatusCode()
		return code >= 400 && code < 500 && code != 429
	}
	return false
}

func composeText(body string, link *string) string {
	if link != nil && *link != "" {
		return body + "\n" + *link
	}
	return body
}

func nextPoll(cur, max time.Duration) time.Duration {
	next := cur * 2
	if next > max {
		return max
	}
	return next
}

// jitter spreads polls by ±20% so the workers don't stampede in lockstep.
func jitter(d time.Duration) time.Duration {
	span := int64(d) / 5
	if span <= 0 {
		return d
	}
	return d + time.Duration(rand.Int63n(2*span)-span)
}
