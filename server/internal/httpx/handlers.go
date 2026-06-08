package httpx

import (
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"

	"loop/internal/core/domain"
	"loop/internal/store"
)

type userView struct {
	ID string `json:"id"`
}

type connectionView struct {
	Platform           string `json:"platform"`
	Username           string `json:"username"`
	Status             string `json:"status"`
	SubscriptionStatus string `json:"subscriptionStatus"`
}

type sessionView struct {
	User       userView        `json:"user"`
	Connection *connectionView `json:"connection"`
}

func (a *API) me(w http.ResponseWriter, r *http.Request) {
	userID, err := a.sessionUser(r)
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	view := sessionView{User: userView{ID: userID.String()}}
	conn, err := a.accounts.Account(r.Context(), userID)
	switch {
	case err == nil:
		view.Connection = connView(conn)
	case errors.Is(err, pgx.ErrNoRows):
		// no connection yet — Connection stays null
	default:
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal"})
		return
	}
	writeJSON(w, http.StatusOK, view)
}

func connView(c store.Connection) *connectionView {
	return &connectionView{
		Platform:           c.Platform,
		Username:           c.Username,
		Status:             c.Status,
		SubscriptionStatus: c.SubscriptionStatus,
	}
}

func (a *API) logout(w http.ResponseWriter, r *http.Request) {
	a.clearSession(w)
	w.WriteHeader(http.StatusNoContent)
}

// devLogin seeds/reuses a demo account and starts a session. Gated by DEV_AUTH;
// it exercises the real onboarding path so the seam is dogfooded, not faked.
func (a *API) devLogin(w http.ResponseWriter, r *http.Request) {
	conn, err := a.accounts.Connect(r.Context(), domain.ConnectedAccount{
		Platform:    domain.PlatformInstagram,
		ExternalID:  "dev_creator",
		Username:    "dev.creator",
		AccessToken: "dev-access-token",
		Scopes:      []string{"instagram_business_basic"},
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "connect failed"})
		return
	}
	if err := a.accounts.MarkSubscribed(r.Context(), conn.ID, []string{"comments"}); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "subscribe failed"})
		return
	}
	a.setSession(w, conn.UserID)
	http.Redirect(w, r, "/dashboard", http.StatusFound)
}
