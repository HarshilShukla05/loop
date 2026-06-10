//go:build integration

package outbox

import (
	"context"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"loop/internal/core/domain"
	"loop/internal/db"
	"loop/internal/store"
)

type fakeAccounts struct{ err error }

func (f fakeAccounts) AuthorizedByExternal(ctx context.Context, id string) (domain.ConnectedAccount, error) {
	return domain.ConnectedAccount{ExternalID: id, AccessToken: "tok"}, f.err
}

type fakeSender struct {
	mu         sync.Mutex
	dmErr      error
	dmCalls    int
	replyCalls int
}

func (f *fakeSender) SendDirectMessage(ctx context.Context, a domain.ConnectedAccount, commentID, text string) (string, error) {
	f.mu.Lock()
	f.dmCalls++
	f.mu.Unlock()
	return "msg-1", f.dmErr
}

func (f *fakeSender) ReplyToComment(ctx context.Context, a domain.ConnectedAccount, commentID, text string) (string, error) {
	f.mu.Lock()
	f.replyCalls++
	f.mu.Unlock()
	return "reply-1", nil
}

type fakeLimiter struct {
	ok   bool
	wait time.Duration
}

func (f fakeLimiter) Allow(ctx context.Context, account string) (bool, time.Duration, error) {
	return f.ok, f.wait, nil
}

func testPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set TEST_DATABASE_URL to run integration tests")
	}
	pool, err := db.Connect(context.Background(), url)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(context.Background(), "TRUNCATE users, connections, dm_outbox, rate_limits CASCADE"); err != nil {
		t.Fatal(err)
	}
	return pool
}

func seedConnection(t *testing.T, pool *pgxpool.Pool, extID string) uuid.UUID {
	t.Helper()
	var id uuid.UUID
	err := pool.QueryRow(context.Background(), `
		WITH u AS (INSERT INTO users DEFAULT VALUES RETURNING id)
		INSERT INTO connections (user_id, platform, external_account_id, username, access_token_enc)
		SELECT u.id, 'instagram', $1, 'handle', 'enc' FROM u
		RETURNING id`, extID).Scan(&id)
	if err != nil {
		t.Fatal(err)
	}
	return id
}

func insertJob(t *testing.T, pool *pgxpool.Pool, connID uuid.UUID, extID, commentID string) {
	t.Helper()
	mediaID := "m1"
	if _, err := store.New(pool).InsertDMJob(context.Background(), store.InsertDMJobParams{
		ConnectionID:      connID,
		RuleID:            uuid.New(),
		ExternalAccountID: extID,
		CommentID:         commentID,
		ActorID:           "actor",
		MediaID:           &mediaID,
		Body:              "hello",
	}); err != nil {
		t.Fatal(err)
	}
}

func jobState(t *testing.T, pool *pgxpool.Pool, commentID string) (status string, attempts int, nextAt time.Time) {
	t.Helper()
	if err := pool.QueryRow(context.Background(),
		"SELECT status, attempt_count, next_attempt_at FROM dm_outbox WHERE comment_id=$1", commentID).
		Scan(&status, &attempts, &nextAt); err != nil {
		t.Fatal(err)
	}
	return
}

func newPool(pool *pgxpool.Pool, snd sender, lim limiter, cfg Config) *Pool {
	if cfg.Workers == 0 {
		cfg.Workers = 1
	}
	if cfg.MaxAttempts == 0 {
		cfg.MaxAttempts = 5
	}
	return NewPool(pool, fakeAccounts{}, snd, lim, cfg)
}

func TestProcessSuccessMarksSentAndReplies(t *testing.T) {
	pool := testPool(t)
	defer pool.Close()
	conn := seedConnection(t, pool, "acct1")
	insertJob(t, pool, conn, "acct1", "c1")

	snd := &fakeSender{}
	p := newPool(pool, snd, fakeLimiter{ok: true}, Config{})

	did, err := p.processOne(context.Background())
	if err != nil || !did {
		t.Fatalf("processOne did=%v err=%v", did, err)
	}
	if status, _, _ := jobState(t, pool, "c1"); status != "sent" {
		t.Fatalf("status=%s want sent", status)
	}
	if snd.dmCalls != 1 || snd.replyCalls != 1 {
		t.Fatalf("dmCalls=%d replyCalls=%d want 1/1", snd.dmCalls, snd.replyCalls)
	}
}

func TestProcessDryRunSendsNothing(t *testing.T) {
	pool := testPool(t)
	defer pool.Close()
	conn := seedConnection(t, pool, "acct1")
	insertJob(t, pool, conn, "acct1", "c1")

	snd := &fakeSender{}
	p := newPool(pool, snd, fakeLimiter{ok: true}, Config{DryRun: true})

	if _, err := p.processOne(context.Background()); err != nil {
		t.Fatal(err)
	}
	if status, _, _ := jobState(t, pool, "c1"); status != "sent" {
		t.Fatalf("status=%s want sent", status)
	}
	if snd.dmCalls != 0 || snd.replyCalls != 0 {
		t.Fatalf("dry-run made %d DM + %d reply calls, want 0", snd.dmCalls, snd.replyCalls)
	}
}

func TestProcessDefersWhenRateLimited(t *testing.T) {
	pool := testPool(t)
	defer pool.Close()
	conn := seedConnection(t, pool, "acct1")
	insertJob(t, pool, conn, "acct1", "c1")

	snd := &fakeSender{}
	p := newPool(pool, snd, fakeLimiter{ok: false, wait: 5 * time.Minute}, Config{})

	before := time.Now()
	if _, err := p.processOne(context.Background()); err != nil {
		t.Fatal(err)
	}
	status, _, nextAt := jobState(t, pool, "c1")
	if status != "pending" {
		t.Fatalf("status=%s want pending (deferred)", status)
	}
	if !nextAt.After(before.Add(4 * time.Minute)) {
		t.Fatalf("next_attempt_at=%v not deferred ~5m", nextAt)
	}
	if snd.dmCalls != 0 {
		t.Fatalf("rate-limited job should not send, dmCalls=%d", snd.dmCalls)
	}
}

func TestProcessRetriesTransientError(t *testing.T) {
	pool := testPool(t)
	defer pool.Close()
	conn := seedConnection(t, pool, "acct1")
	insertJob(t, pool, conn, "acct1", "c1")

	snd := &fakeSender{dmErr: statusErr{500}}
	p := newPool(pool, snd, fakeLimiter{ok: true}, Config{})

	before := time.Now()
	if _, err := p.processOne(context.Background()); err != nil {
		t.Fatal(err)
	}
	status, attempts, nextAt := jobState(t, pool, "c1")
	if status != "pending" || attempts != 1 {
		t.Fatalf("status=%s attempts=%d want pending/1", status, attempts)
	}
	if !nextAt.After(before) {
		t.Fatalf("next_attempt_at=%v should be backed off into the future", nextAt)
	}
}

func TestProcessFailsPermanentError(t *testing.T) {
	pool := testPool(t)
	defer pool.Close()
	conn := seedConnection(t, pool, "acct1")
	insertJob(t, pool, conn, "acct1", "c1")

	snd := &fakeSender{dmErr: statusErr{400}}
	p := newPool(pool, snd, fakeLimiter{ok: true}, Config{})

	if _, err := p.processOne(context.Background()); err != nil {
		t.Fatal(err)
	}
	if status, attempts, _ := jobState(t, pool, "c1"); status != "failed" || attempts != 1 {
		t.Fatalf("status=%s attempts=%d want failed/1", status, attempts)
	}
}

func TestProcessDeadLettersAtMaxAttempts(t *testing.T) {
	pool := testPool(t)
	defer pool.Close()
	conn := seedConnection(t, pool, "acct1")
	insertJob(t, pool, conn, "acct1", "c1")
	// already retried 4 times; a 5th transient failure (MaxAttempts=5) dead-letters.
	if _, err := pool.Exec(context.Background(),
		"UPDATE dm_outbox SET attempt_count=4 WHERE comment_id='c1'"); err != nil {
		t.Fatal(err)
	}

	snd := &fakeSender{dmErr: statusErr{503}} // transient, but at the cap
	p := newPool(pool, snd, fakeLimiter{ok: true}, Config{MaxAttempts: 5})

	if _, err := p.processOne(context.Background()); err != nil {
		t.Fatal(err)
	}
	if status, attempts, _ := jobState(t, pool, "c1"); status != "failed" || attempts != 5 {
		t.Fatalf("status=%s attempts=%d want failed/5", status, attempts)
	}
}

func TestClaimSkipLocked(t *testing.T) {
	pool := testPool(t)
	defer pool.Close()
	conn := seedConnection(t, pool, "acct1")
	insertJob(t, pool, conn, "acct1", "c1")
	insertJob(t, pool, conn, "acct1", "c2")
	ctx := context.Background()

	// tx1 claims and holds one job (uncommitted, row locked).
	tx1, err := pool.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer tx1.Rollback(ctx)
	j1, err := store.New(pool).WithTx(tx1).ClaimDMJob(ctx)
	if err != nil {
		t.Fatal(err)
	}

	// tx2 must skip the locked row and claim the other — not block, not duplicate.
	tx2, err := pool.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer tx2.Rollback(ctx)
	j2, err := store.New(pool).WithTx(tx2).ClaimDMJob(ctx)
	if err != nil {
		t.Fatalf("second claim should not block/error under SKIP LOCKED: %v", err)
	}

	if j1.ID == j2.ID || j1.CommentID == j2.CommentID {
		t.Fatalf("SKIP LOCKED failed: both claims got %s", j1.CommentID)
	}
}
