package webhook

import (
	"io"
	"log"
	"net/http"

	"loop/internal/core/domain"
)

// parser is the slice of the platform connector this handler needs.
type parser interface {
	VerifySignature(body []byte, signature string) bool
	ParseWebhook(body []byte) ([]domain.EngagementEvent, error)
}

type Handler struct {
	verifyToken string
	parser      parser
}

func NewHandler(verifyToken string, p parser) *Handler {
	return &Handler{verifyToken: verifyToken, parser: p}
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

// Receive ingests comment webhooks: read, verify signature, parse, log, ack fast.
// Rule-matching + DM sending (Flow B) consume these events later via a queue.
func (h *Handler) Receive(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "read error", http.StatusBadRequest)
		return
	}
	log.Printf("webhook: received %d bytes", len(body))

	if !h.parser.VerifySignature(body, r.Header.Get("X-Hub-Signature-256")) {
		// Dev: still parse so the event is observable. Production must reject here.
		log.Println("webhook: WARNING signature mismatch (processing anyway for dev visibility)")
	}

	events, err := h.parser.ParseWebhook(body)
	if err != nil {
		log.Printf("webhook: parse error: %v", err)
		w.WriteHeader(http.StatusOK) // ack anyway so Meta does not retry a bad body
		return
	}
	for _, e := range events {
		log.Printf("webhook: comment event account=%s media=%s from=%s text=%q ref=%s",
			e.ExternalAccountID, e.SourceID, e.ActorID, e.Text, e.ExternalRef)
	}

	w.WriteHeader(http.StatusOK)
}
