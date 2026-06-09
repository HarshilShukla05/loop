package webhook

import (
	"context"
	"io"
	"log"
	"net/http"

	"loop/internal/core/domain"
	"loop/internal/rulecache"
	"loop/internal/store"
)

// parser is the platform connector's verify/parse capability.
type parser interface {
	VerifySignature(body []byte, signature string) bool
	ParseWebhook(body []byte) ([]domain.EngagementEvent, error)
}

// matcher resolves a comment to a rule (the in-memory rule cache).
type matcher interface {
	Match(e domain.EngagementEvent) (rulecache.Match, bool)
}

// enqueuer persists a matched comment as a pending DM (idempotent on comment_id).
type enqueuer interface {
	InsertDMJob(ctx context.Context, arg store.InsertDMJobParams) (int64, error)
}

type Handler struct {
	verifyToken string
	parser      parser
	matcher     matcher
	enqueuer    enqueuer
}

func NewHandler(verifyToken string, p parser, m matcher, e enqueuer) *Handler {
	return &Handler{verifyToken: verifyToken, parser: p, matcher: m, enqueuer: e}
}

// Verify answers Meta's GET subscription handshake.
func (h *Handler) Verify(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	if q.Get("hub.mode") == "subscribe" && q.Get("hub.verify_token") == h.verifyToken {
		log.Println("webhook: verification handshake ok")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(q.Get("hub.challenge")))
		return
	}
	log.Println("webhook: verification handshake REJECTED (token mismatch)")
	http.Error(w, "verification failed", http.StatusForbidden)
}

// Receive ingests comment webhooks: verify → match (in-memory) → enqueue matches
// → ack fast. Noise is dropped without touching the DB. A failed insert returns
// 500 so Meta retries (the insert is idempotent on comment_id).
func (h *Handler) Receive(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "read error", http.StatusBadRequest)
		return
	}
	log.Printf("webhook: received %d bytes", len(body))
	if !h.parser.VerifySignature(body, r.Header.Get("X-Hub-Signature-256")) {
		// Dev: still process so events are observable. Production must reject here.
		log.Println("webhook: WARNING signature mismatch (processing anyway for dev visibility)")
	}

	events, err := h.parser.ParseWebhook(body)
	if err != nil {
		log.Printf("webhook: parse error: %v", err)
		w.WriteHeader(http.StatusOK) // ack a bad body so Meta does not retry it
		return
	}

	for _, e := range events {
		match, ok := h.matcher.Match(e)
		if !ok {
			// Dev visibility into drops; quiet/sample this before production.
			log.Printf("webhook: no rule for account %s media %s → dropped", e.ExternalAccountID, e.SourceID)
			continue
		}
		if err := h.enqueue(r.Context(), e, match); err != nil {
			log.Printf("webhook: enqueue failed for comment %s: %v", e.ExternalRef, err)
			http.Error(w, "enqueue failed", http.StatusInternalServerError) // → Meta retries
			return
		}
		log.Printf("webhook: matched comment %s on media %s (rule %s) → queued", e.ExternalRef, e.SourceID, match.RuleID)
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) enqueue(ctx context.Context, e domain.EngagementEvent, m rulecache.Match) error {
	mediaID := e.SourceID
	_, err := h.enqueuer.InsertDMJob(ctx, store.InsertDMJobParams{
		ConnectionID:      m.ConnectionID,
		RuleID:            m.RuleID,
		ExternalAccountID: e.ExternalAccountID,
		CommentID:         e.ExternalRef,
		ActorID:           e.ActorID,
		MediaID:           &mediaID,
		Body:              m.Body,
		Link:              m.Link,
	})
	return err
}
