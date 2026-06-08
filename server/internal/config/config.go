package config

import (
	"fmt"
	"os"
)

type Config struct {
	Port               string
	DatabaseURL        string
	DashboardURL       string
	MetaAppID          string
	MetaAppSecret      string
	MetaConfigID       string
	MetaRedirectURI    string
	WebhookVerifyToken string
	GraphAPIVersion    string
	TokenEncKey        string
	SessionSecret      string
	SecureCookies      bool
	DevAuth            bool
}

func Load() (Config, error) {
	c := Config{
		Port:               fallback("PORT", "8080"),
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		DashboardURL:       fallback("DASHBOARD_URL", "http://localhost:5173"),
		MetaAppID:          os.Getenv("META_APP_ID"),
		MetaAppSecret:      os.Getenv("META_APP_SECRET"),
		MetaConfigID:       os.Getenv("META_CONFIG_ID"),
		MetaRedirectURI:    os.Getenv("META_REDIRECT_URI"),
		WebhookVerifyToken: os.Getenv("META_WEBHOOK_VERIFY_TOKEN"),
		GraphAPIVersion:    fallback("GRAPH_API_VERSION", "v23.0"),
		TokenEncKey:        os.Getenv("TOKEN_ENC_KEY"),
		SessionSecret:      os.Getenv("SESSION_SECRET"),
		SecureCookies:      os.Getenv("COOKIE_SECURE") == "true",
		DevAuth:            os.Getenv("DEV_AUTH") == "true",
	}
	if c.DatabaseURL == "" {
		return c, fmt.Errorf("DATABASE_URL is required")
	}
	if c.TokenEncKey == "" {
		return c, fmt.Errorf("TOKEN_ENC_KEY is required")
	}
	if c.SessionSecret == "" {
		return c, fmt.Errorf("SESSION_SECRET is required")
	}
	return c, nil
}

func fallback(key, value string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return value
}
