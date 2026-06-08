package httpx

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"

	"loop/internal/core/domain"
	"loop/internal/store"
	"loop/internal/webhook"
)

const (
	cookieName = "loop_session"
	sessionTTL = 30 * 24 * time.Hour
)

// accounts is the slice of the connections service this layer depends on.
type accounts interface {
	Account(ctx context.Context, userID uuid.UUID) (store.Connection, error)
	Connect(ctx context.Context, acc domain.ConnectedAccount) (store.Connection, error)
	MarkSubscribed(ctx context.Context, connectionID uuid.UUID, fields []string) error
}

// connector is the slice of the social connector this layer drives.
type connector interface {
	AuthorizeURL(state string) string
	ExchangeCode(ctx context.Context, code string) (domain.ConnectedAccount, error)
	Subscribe(ctx context.Context, account domain.ConnectedAccount, fields []string) error
}

type API struct {
	webhook       *webhook.Handler
	connector     connector
	accounts      accounts
	sessionSecret string
	dashboardURL  string
	secureCookies bool
	devAuth       bool
}

func New(wh *webhook.Handler, conn connector, acc accounts, sessionSecret, dashboardURL string, secureCookies, devAuth bool) *API {
	return &API{
		webhook:       wh,
		connector:     conn,
		accounts:      acc,
		sessionSecret: sessionSecret,
		dashboardURL:  dashboardURL,
		secureCookies: secureCookies,
		devAuth:       devAuth,
	}
}

func (a *API) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", health)
	mux.HandleFunc("GET /webhooks/instagram", a.webhook.Verify)
	mux.HandleFunc("POST /webhooks/instagram", a.webhook.Receive)
	mux.HandleFunc("GET /auth/instagram", a.startInstagram)
	mux.HandleFunc("GET /auth/instagram/callback", a.instagramCallback)
	mux.HandleFunc("GET /me", a.me)
	mux.HandleFunc("POST /auth/logout", a.logout)
	if a.devAuth {
		mux.HandleFunc("POST /auth/dev-login", a.devLogin)
	}
	return cors(a.dashboardURL, mux)
}

func health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
