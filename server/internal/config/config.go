package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	Port               string
	DatabaseURL        string
	DashboardURL       string
	MarketingURL       string
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
	SendDryRun         bool // log instead of calling Meta (no real DMs)
	WorkerCount        int  // outbox send-worker concurrency ceiling
	RateLimitPerHour   int  // per-account send cap (Meta: 750/hr posts+reels)
}

func Load() (Config, error) {
	c := Config{
		Port:               fallback("PORT", "8080"),
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		DashboardURL:       fallback("DASHBOARD_URL", "http://localhost:5173"),
		MarketingURL:       fallback("MARKETING_URL", "http://localhost:3000"),
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
		SendDryRun:         os.Getenv("SEND_DRY_RUN") == "true",
		WorkerCount:        fallbackInt("WORKER_COUNT", 10),
		RateLimitPerHour:   fallbackInt("RATE_LIMIT_PER_HOUR", 750),
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

func fallbackInt(key string, value int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return value
}
