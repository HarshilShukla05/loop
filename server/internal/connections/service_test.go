//go:build integration

package connections

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"io"
	"os"
	"testing"

	"github.com/google/uuid"

	"loop/internal/core/domain"
	"loop/internal/crypto"
	"loop/internal/db"
)

func testKey(t *testing.T) string {
	t.Helper()
	key := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		t.Fatal(err)
	}
	return base64.StdEncoding.EncodeToString(key)
}

func TestConnectOnboardsAndIsIdempotent(t *testing.T) {
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set TEST_DATABASE_URL to run integration tests")
	}

	ctx := context.Background()
	pool, err := db.Connect(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()

	if _, err := pool.Exec(ctx, "TRUNCATE users, connections, rules CASCADE"); err != nil {
		t.Fatal(err)
	}

	cipher, err := crypto.New(testKey(t))
	if err != nil {
		t.Fatal(err)
	}
	svc := NewService(pool, cipher)

	acc := domain.ConnectedAccount{
		Platform:    "instagram",
		ExternalID:  "ig_123",
		Username:    "first.handle",
		AccessToken: "token-one",
		Scopes:      []string{"instagram_business_basic"},
	}

	first, err := svc.Connect(ctx, acc)
	if err != nil {
		t.Fatal(err)
	}

	// Token is stored encrypted, not in plaintext, and decrypts back.
	if first.AccessTokenEnc == "token-one" {
		t.Fatal("token stored in plaintext")
	}
	if got, _ := cipher.Decrypt(first.AccessTokenEnc); got != "token-one" {
		t.Fatalf("decrypt = %q", got)
	}
	if first.SubscriptionStatus != "pending" {
		t.Fatalf("subscription = %q, want pending", first.SubscriptionStatus)
	}

	// Re-connecting the same external account updates it in place — no duplicate user/connection.
	acc.Username = "second.handle"
	acc.AccessToken = "token-two"
	second, err := svc.Connect(ctx, acc)
	if err != nil {
		t.Fatal(err)
	}
	if second.ID != first.ID {
		t.Fatal("created a new connection instead of updating")
	}
	if second.UserID != first.UserID {
		t.Fatal("created a new user instead of reusing")
	}
	if second.Username != "second.handle" {
		t.Fatalf("username = %q, want updated", second.Username)
	}

	count := func(table string) int {
		var n int
		if err := pool.QueryRow(ctx, "SELECT count(*) FROM "+table).Scan(&n); err != nil {
			t.Fatal(err)
		}
		return n
	}
	if count("users") != 1 || count("connections") != 1 {
		t.Fatalf("users=%d connections=%d, want 1 each", count("users"), count("connections"))
	}
}

func TestDeleteUserCascades(t *testing.T) {
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("set TEST_DATABASE_URL to run integration tests")
	}
	ctx := context.Background()
	pool, err := db.Connect(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	if _, err := pool.Exec(ctx, "TRUNCATE users, connections, rules, dm_outbox, rate_limits CASCADE"); err != nil {
		t.Fatal(err)
	}

	cipher, err := crypto.New(testKey(t))
	if err != nil {
		t.Fatal(err)
	}
	svc := NewService(pool, cipher)

	conn, err := svc.Connect(ctx, domain.ConnectedAccount{
		Platform: "instagram", ExternalID: "ig_del", Username: "h", AccessToken: "tok",
		Scopes: []string{"instagram_business_basic"},
	})
	if err != nil {
		t.Fatal(err)
	}
	// Seed every owned row: a rule, a dm_outbox job, and a rate-limit bucket.
	seed := []struct {
		sql  string
		args []any
	}{
		{"INSERT INTO rules (connection_id, response_message) VALUES ($1, 'hi')", []any{conn.ID}},
		{"INSERT INTO dm_outbox (connection_id, rule_id, external_account_id, comment_id, actor_id, body) VALUES ($1, $2, 'ig_del', 'c1', 'a1', 'b')", []any{conn.ID, uuid.New()}},
		{"INSERT INTO rate_limits (external_account_id, tokens) VALUES ('ig_del', 5)", nil},
	}
	for _, s := range seed {
		if _, err := pool.Exec(ctx, s.sql, s.args...); err != nil {
			t.Fatal(err)
		}
	}

	if err := svc.DeleteUser(ctx, conn.UserID, "ig_del"); err != nil {
		t.Fatal(err)
	}

	for _, table := range []string{"users", "connections", "rules", "dm_outbox", "rate_limits"} {
		var n int
		if err := pool.QueryRow(ctx, "SELECT count(*) FROM "+table).Scan(&n); err != nil {
			t.Fatal(err)
		}
		if n != 0 {
			t.Fatalf("%s still has %d row(s) after DeleteUser", table, n)
		}
	}
}
