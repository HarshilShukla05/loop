package webhook

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"loop/internal/core/domain"
	"loop/internal/rulecache"
	"loop/internal/store"
)

type fakeParser struct {
	ok     bool
	events []domain.EngagementEvent
}

func (f fakeParser) VerifySignature(_ []byte, _ string) bool { return f.ok }
func (f fakeParser) ParseWebhook(_ []byte) ([]domain.EngagementEvent, error) {
	return f.events, nil
}

type fakeMatcher struct{}

func (fakeMatcher) Match(domain.EngagementEvent) (rulecache.Match, bool) {
	return rulecache.Match{}, false
}

type countingEnqueuer struct{ calls int }

func (c *countingEnqueuer) InsertDMJob(context.Context, store.InsertDMJobParams) (int64, error) {
	c.calls++
	return 1, nil
}

func post() *http.Request {
	return httptest.NewRequest(http.MethodPost, "/webhooks/instagram", strings.NewReader("{}"))
}

func TestStrictRejectsBadSignature(t *testing.T) {
	enq := &countingEnqueuer{}
	h := NewHandler("tok", fakeParser{ok: false}, fakeMatcher{}, enq, true)
	rec := httptest.NewRecorder()
	h.Receive(rec, post())
	if rec.Code != http.StatusForbidden {
		t.Fatalf("code = %d, want 403", rec.Code)
	}
	if enq.calls != 0 {
		t.Fatal("a forged webhook must not reach the enqueuer")
	}
}

func TestLenientProcessesBadSignature(t *testing.T) {
	h := NewHandler("tok", fakeParser{ok: false}, fakeMatcher{}, &countingEnqueuer{}, false)
	rec := httptest.NewRecorder()
	h.Receive(rec, post())
	if rec.Code != http.StatusOK {
		t.Fatalf("dev-lenient code = %d, want 200", rec.Code)
	}
}

func TestStrictAcceptsGoodSignature(t *testing.T) {
	h := NewHandler("tok", fakeParser{ok: true}, fakeMatcher{}, &countingEnqueuer{}, true)
	rec := httptest.NewRecorder()
	h.Receive(rec, post())
	if rec.Code != http.StatusOK {
		t.Fatalf("code = %d, want 200", rec.Code)
	}
}
