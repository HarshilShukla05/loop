package session

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

var (
	ErrInvalid = errors.New("session: invalid token")
	ErrExpired = errors.New("session: expired token")
)

type claims struct {
	UserID    uuid.UUID `json:"uid"`
	ExpiresAt int64     `json:"exp"`
}

// Issue returns a signed token "<payload>.<signature>" carrying the user id.
func Issue(userID uuid.UUID, ttl time.Duration, secret string) string {
	payload, _ := json.Marshal(claims{UserID: userID, ExpiresAt: time.Now().Add(ttl).Unix()})
	body := base64.RawURLEncoding.EncodeToString(payload)
	return body + "." + sign(body, secret)
}

// Parse verifies the signature and expiry, returning the user id.
func Parse(token, secret string) (uuid.UUID, error) {
	body, signature, found := strings.Cut(token, ".")
	if !found {
		return uuid.Nil, ErrInvalid
	}
	if !hmac.Equal([]byte(signature), []byte(sign(body, secret))) {
		return uuid.Nil, ErrInvalid
	}
	payload, err := base64.RawURLEncoding.DecodeString(body)
	if err != nil {
		return uuid.Nil, ErrInvalid
	}
	var c claims
	if err := json.Unmarshal(payload, &c); err != nil {
		return uuid.Nil, ErrInvalid
	}
	if time.Now().Unix() > c.ExpiresAt {
		return uuid.Nil, ErrExpired
	}
	return c.UserID, nil
}

func sign(body, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(body))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}
