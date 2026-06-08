package session

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

const secret = "test-secret"

func TestIssueParseRoundTrip(t *testing.T) {
	id := uuid.New()
	token := Issue(id, time.Hour, secret)

	got, err := Parse(token, secret)
	if err != nil {
		t.Fatal(err)
	}
	if got != id {
		t.Fatalf("got %v, want %v", got, id)
	}
}

func TestParseExpired(t *testing.T) {
	token := Issue(uuid.New(), -time.Minute, secret)
	if _, err := Parse(token, secret); err != ErrExpired {
		t.Fatalf("got %v, want ErrExpired", err)
	}
}

func TestParseWrongSecret(t *testing.T) {
	token := Issue(uuid.New(), time.Hour, secret)
	if _, err := Parse(token, "other-secret"); err != ErrInvalid {
		t.Fatalf("got %v, want ErrInvalid", err)
	}
}

func TestParseTampered(t *testing.T) {
	token := Issue(uuid.New(), time.Hour, secret)
	if _, err := Parse(token+"x", secret); err != ErrInvalid {
		t.Fatalf("got %v, want ErrInvalid", err)
	}
}

func TestParseMalformed(t *testing.T) {
	if _, err := Parse("no-dot-here", secret); err != ErrInvalid {
		t.Fatalf("got %v, want ErrInvalid", err)
	}
}
