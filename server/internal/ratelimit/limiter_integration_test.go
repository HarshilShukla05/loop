//go:build integration

package ratelimit

import (
	"context"
	"os"
	"sync"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"loop/internal/db"
)

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
	if _, err := pool.Exec(context.Background(), "TRUNCATE rate_limits"); err != nil {
		t.Fatal(err)
	}
	return pool
}

// backdate moves the bucket's updated_at into the past to simulate elapsed time
// without sleeping, so refill can be tested deterministically.
func backdate(t *testing.T, pool *pgxpool.Pool, account, interval string) {
	t.Helper()
	_, err := pool.Exec(context.Background(),
		"UPDATE rate_limits SET updated_at = now() - $1::interval WHERE external_account_id = $2",
		interval, account)
	if err != nil {
		t.Fatal(err)
	}
}

func TestConsumeToEmptyThenDeny(t *testing.T) {
	pool := testPool(t)
	defer pool.Close()
	ctx := context.Background()
	l := New(pool, 5) // capacity 5, negligible refill over the test

	for i := 0; i < 5; i++ {
		ok, _, err := l.Allow(ctx, "acct")
		if err != nil {
			t.Fatal(err)
		}
		if !ok {
			t.Fatalf("send %d should be allowed (bucket starts full)", i+1)
		}
	}
	ok, wait, err := l.Allow(ctx, "acct")
	if err != nil {
		t.Fatal(err)
	}
	if ok {
		t.Fatal("6th send should be denied (bucket empty)")
	}
	if wait <= 0 {
		t.Fatal("denied call should report a positive wait")
	}
}

func TestRefillOverTime(t *testing.T) {
	pool := testPool(t)
	defer pool.Close()
	ctx := context.Background()
	l := New(pool, 5)

	for i := 0; i < 5; i++ {
		if ok, _, _ := l.Allow(ctx, "acct"); !ok {
			t.Fatalf("precondition: send %d should be allowed", i+1)
		}
	}
	if ok, _, _ := l.Allow(ctx, "acct"); ok {
		t.Fatal("precondition: bucket should be empty")
	}
	// 1 hour elapsed refills well past one token at 5/hr.
	backdate(t, pool, "acct", "1 hour")
	if ok, _, err := l.Allow(ctx, "acct"); err != nil || !ok {
		t.Fatalf("after refill a token should be available: ok=%v err=%v", ok, err)
	}
}

func TestSeparateAccounts(t *testing.T) {
	pool := testPool(t)
	defer pool.Close()
	ctx := context.Background()
	l := New(pool, 2)

	// drain account A
	for i := 0; i < 2; i++ {
		if ok, _, _ := l.Allow(ctx, "A"); !ok {
			t.Fatalf("precondition: A send %d should be allowed", i+1)
		}
	}
	if ok, _, _ := l.Allow(ctx, "A"); ok {
		t.Fatal("A should be drained")
	}
	// B is untouched → still allowed
	if ok, _, err := l.Allow(ctx, "B"); err != nil || !ok {
		t.Fatalf("B should be independent of A: ok=%v err=%v", ok, err)
	}
}

func TestConcurrentNoDoubleSpend(t *testing.T) {
	pool := testPool(t)
	defer pool.Close()
	ctx := context.Background()
	const capacity = 50
	l := New(pool, capacity)

	var wg sync.WaitGroup
	var mu sync.Mutex
	allowed := 0
	for i := 0; i < 200; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			ok, _, err := l.Allow(ctx, "hot")
			if err != nil {
				t.Errorf("allow: %v", err)
				return
			}
			if ok {
				mu.Lock()
				allowed++
				mu.Unlock()
			}
		}()
	}
	wg.Wait()

	if allowed != capacity {
		t.Fatalf("expected exactly %d allowed under concurrency (no double-spend), got %d", capacity, allowed)
	}
}
