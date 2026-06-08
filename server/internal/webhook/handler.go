package webhook

import "net/http"

type Handler struct {
	verifyToken string
}

func NewHandler(verifyToken string) *Handler {
	return &Handler{verifyToken: verifyToken}
}

// Verify answers Meta's GET subscription handshake.
func (h *Handler) Verify(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	if q.Get("hub.mode") == "subscribe" && q.Get("hub.verify_token") == h.verifyToken {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(q.Get("hub.challenge")))
		return
	}
	http.Error(w, "verification failed", http.StatusForbidden)
}

// Receive ingests comment webhooks and returns 200 immediately.
// Signature verification, parsing, and enqueue land in Flow B.
func (h *Handler) Receive(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}
