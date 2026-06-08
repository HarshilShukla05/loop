package httpx

import (
	"crypto/rand"
	"encoding/base64"
	"log"
	"net/http"
)

const stateCookie = "loop_oauth_state"

func (a *API) startInstagram(w http.ResponseWriter, r *http.Request) {
	state := randomState()
	http.SetCookie(w, &http.Cookie{
		Name:     stateCookie,
		Value:    state,
		Path:     "/",
		HttpOnly: true,
		Secure:   a.secureCookies,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   600,
	})
	http.Redirect(w, r, a.connector.AuthorizeURL(state), http.StatusFound)
}

func (a *API) instagramCallback(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	if reason := q.Get("error"); reason != "" {
		http.Redirect(w, r, "/?error="+reason, http.StatusFound)
		return
	}

	cookie, err := r.Cookie(stateCookie)
	if err != nil || cookie.Value == "" || cookie.Value != q.Get("state") {
		http.Error(w, "invalid state", http.StatusBadRequest)
		return
	}
	code := q.Get("code")
	if code == "" {
		http.Error(w, "missing code", http.StatusBadRequest)
		return
	}

	acc, err := a.connector.ExchangeCode(r.Context(), code)
	if err != nil {
		log.Printf("instagram exchange: %v", err)
		http.Error(w, "exchange failed", http.StatusBadGateway)
		return
	}

	conn, err := a.accounts.Connect(r.Context(), acc)
	if err != nil {
		log.Printf("connect: %v", err)
		http.Error(w, "connect failed", http.StatusInternalServerError)
		return
	}

	// Subscription is best-effort and must never block login.
	if err := a.connector.Subscribe(r.Context(), acc, []string{"comments"}); err != nil {
		log.Printf("subscribe (left pending): %v", err)
	} else if err := a.accounts.MarkSubscribed(r.Context(), conn.ID, []string{"comments"}); err != nil {
		log.Printf("mark subscribed: %v", err)
	}

	a.setSession(w, conn.UserID)
	http.Redirect(w, r, "/dashboard", http.StatusFound)
}

func randomState() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return base64.RawURLEncoding.EncodeToString(b)
}
