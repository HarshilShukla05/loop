// Package ratelimit enforces Meta's per-account send cap with a durable token
// bucket. The bucket state lives in Postgres (the rate_limits table), not in
// memory, so it survives restart/redeploy and stays correct across concurrent
// workers — the refill-and-consume is a single atomic UPDATE under the row lock.
package ratelimit

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"loop/internal/db"
	"loop/internal/store"
)

type Limiter struct {
	pool         *pgxpool.Pool
	q            *store.Queries
	capacity     float64
	refillPerSec float64
}

// New builds a limiter that allows perHour sends per account, refilling smoothly
// (a viral burst drips out at perHour rather than firing all at once).
func New(pool *pgxpool.Pool, perHour int) *Limiter {
	return &Limiter{
		pool:         pool,
		q:            store.New(pool),
		capacity:     float64(perHour),
		refillPerSec: float64(perHour) / 3600.0,
	}
}

// Allow consumes one token for the account. It returns (true, 0) when the send
// may proceed, or (false, wait) with how long until the next token frees up.
// Seed+consume run in one short transaction so the row lock is released before
// the caller makes its (slow) network send to Meta.
func (l *Limiter) Allow(ctx context.Context, account string) (bool, time.Duration, error) {
	allowed := false
	err := db.WithTx(ctx, l.pool, func(tx pgx.Tx) error {
		q := l.q.WithTx(tx)
		if err := q.SeedRateBucket(ctx, store.SeedRateBucketParams{
			Account:  account,
			Capacity: l.capacity,
		}); err != nil {
			return err
		}
		_, err := q.TryConsumeToken(ctx, store.TryConsumeTokenParams{
			Capacity:     l.capacity,
			RefillPerSec: l.refillPerSec,
			Account:      account,
		})
		if errors.Is(err, pgx.ErrNoRows) {
			return nil // denied: no whole token left after refill
		}
		if err != nil {
			return err
		}
		allowed = true
		return nil
	})
	if err != nil {
		return false, 0, err
	}
	if allowed {
		return true, 0, nil
	}
	return false, l.tokenInterval(), nil
}

// tokenInterval is how long it takes to accrue one token.
func (l *Limiter) tokenInterval() time.Duration {
	return time.Duration(1.0 / l.refillPerSec * float64(time.Second))
}
