package httpx

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"loop/internal/core/domain"
	"loop/internal/session"
	"loop/internal/store"
)

type fakeAccounts struct {
	conn store.Connection
	err  error
}

func (f fakeAccounts) Account(context.Context, uuid.UUID) (store.Connection, error) {
	return f.conn, f.err
}
func (f fakeAccounts) Connect(context.Context, domain.ConnectedAccount) (store.Connection, error) {
	return f.conn, nil
}
func (f fakeAccounts) MarkSubscribed(context.Context, uuid.UUID, []string) error { return nil }

func requestWithSession(userID uuid.UUID) *http.Request {
	req := httptest.NewRequest(http.MethodGet, "/me", nil)
	req.AddCookie(&http.Cookie{Name: cookieName, Value: session.Issue(userID, time.Hour, "secret")})
	return req
}

func TestMeReturnsAccount(t *testing.T) {
	userID := uuid.New()
	conn := store.Connection{
		ID: uuid.New(), UserID: userID, Platform: "instagram",
		Username: "creator.handle", Status: "connected", SubscriptionStatus: "active",
	}
	a := New(nil, nil, fakeAccounts{conn: conn}, "secret", "", false, false)

	rec := httptest.NewRecorder()
	a.me(rec, requestWithSession(userID))

	if rec.Code != http.StatusOK {
		t.Fatalf("code = %d", rec.Code)
	}
	var got sessionView
	if err := json.NewDecoder(rec.Body).Decode(&got); err != nil {
		t.Fatal(err)
	}
	if got.User.ID != userID.String() {
		t.Fatalf("user id = %q", got.User.ID)
	}
	if got.Connection == nil || got.Connection.Username != "creator.handle" {
		t.Fatalf("connection = %+v", got.Connection)
	}
}

func TestMeUnauthorizedWithoutCookie(t *testing.T) {
	a := New(nil, nil, fakeAccounts{}, "secret", "", false, false)
	rec := httptest.NewRecorder()
	a.me(rec, httptest.NewRequest(http.MethodGet, "/me", nil))
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("code = %d", rec.Code)
	}
}

func TestMeNullConnection(t *testing.T) {
	a := New(nil, nil, fakeAccounts{err: pgx.ErrNoRows}, "secret", "", false, false)
	rec := httptest.NewRecorder()
	a.me(rec, requestWithSession(uuid.New()))

	if rec.Code != http.StatusOK {
		t.Fatalf("code = %d", rec.Code)
	}
	var got sessionView
	if err := json.NewDecoder(rec.Body).Decode(&got); err != nil {
		t.Fatal(err)
	}
	if got.Connection != nil {
		t.Fatalf("expected null connection, got %+v", got.Connection)
	}
}
