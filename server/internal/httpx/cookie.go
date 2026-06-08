package httpx

import (
	"net/http"

	"github.com/google/uuid"

	"loop/internal/session"
)

func (a *API) setSession(w http.ResponseWriter, userID uuid.UUID) {
	// Cross-site (SPA origin != API origin) requires SameSite=None + Secure.
	sameSite := http.SameSiteLaxMode
	if a.secureCookies {
		sameSite = http.SameSiteNoneMode
	}
	http.SetCookie(w, &http.Cookie{
		Name:     cookieName,
		Value:    session.Issue(userID, sessionTTL, a.sessionSecret),
		Path:     "/",
		HttpOnly: true,
		Secure:   a.secureCookies,
		SameSite: sameSite,
		MaxAge:   int(sessionTTL.Seconds()),
	})
}

func (a *API) clearSession(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{Name: cookieName, Value: "", Path: "/", HttpOnly: true, MaxAge: -1})
}

func (a *API) sessionUser(r *http.Request) (uuid.UUID, error) {
	c, err := r.Cookie(cookieName)
	if err != nil {
		return uuid.Nil, err
	}
	return session.Parse(c.Value, a.sessionSecret)
}
