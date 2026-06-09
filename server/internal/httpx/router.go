package httpx

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"

	"loop/internal/core/domain"
	"loop/internal/rulecache"
	"loop/internal/rules"
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
	Authorized(ctx context.Context, userID uuid.UUID) (domain.ConnectedAccount, error)
	Connect(ctx context.Context, acc domain.ConnectedAccount) (store.Connection, error)
	MarkSubscribed(ctx context.Context, connectionID uuid.UUID, fields []string) error
}

// connector is the slice of the social connector this layer drives.
type connector interface {
	AuthorizeURL(state string) string
	ExchangeCode(ctx context.Context, code string) (domain.ConnectedAccount, error)
	Subscribe(ctx context.Context, account domain.ConnectedAccount, fields []string) error
	Media(ctx context.Context, account domain.ConnectedAccount) ([]domain.Media, error)
}

// ruleService is the slice of the rules service this layer drives.
type ruleService interface {
	Create(ctx context.Context, connectionID uuid.UUID, in rules.Input) (store.Rule, error)
	List(ctx context.Context, connectionID uuid.UUID) ([]store.Rule, error)
	Delete(ctx context.Context, connectionID, ruleID uuid.UUID) (bool, error)
}

// ruleCache keeps the in-memory matcher in sync with rule changes.
type ruleCache interface {
	AddRule(externalAccountID string, mediaID *string, r rulecache.Rule)
	RemoveRule(externalAccountID string, ruleID uuid.UUID)
}

type API struct {
	webhook       *webhook.Handler
	connector     connector
	accounts      accounts
	rules         ruleService
	cache         ruleCache
	sessionSecret string
	dashboardURL  string
	secureCookies bool
	devAuth       bool
}

func New(wh *webhook.Handler, conn connector, acc accounts, rs ruleService, cache ruleCache, sessionSecret, dashboardURL string, secureCookies, devAuth bool) *API {
	return &API{
		webhook:       wh,
		connector:     conn,
		accounts:      acc,
		rules:         rs,
		cache:         cache,
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
	mux.HandleFunc("GET /media", a.media)
	mux.HandleFunc("GET /rules", a.listRules)
	mux.HandleFunc("POST /rules", a.createRule)
	mux.HandleFunc("DELETE /rules/{id}", a.deleteRule)
	if a.devAuth {
		mux.HandleFunc("POST /auth/dev-login", a.devLogin)
	}
	return cors(a.dashboardURL, mux)
}

// sessionConnection resolves the logged-in user's connected account, or writes a 401.
func (a *API) sessionConnection(w http.ResponseWriter, r *http.Request) (store.Connection, bool) {
	userID, err := a.sessionUser(r)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, errorBody("unauthorized"))
		return store.Connection{}, false
	}
	conn, err := a.accounts.Account(r.Context(), userID)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, errorBody("no connected account"))
		return store.Connection{}, false
	}
	return conn, true
}

func health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func errorBody(message string) map[string]string {
	return map[string]string{"error": message}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
