//go:build integration

package connections

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"io"
	"os"
	"testing"

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
