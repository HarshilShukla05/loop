package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"loop/internal/config"
	"loop/internal/connections"
	"loop/internal/crypto"
	"loop/internal/db"
	"loop/internal/httpx"
	"loop/internal/instagram"
	"loop/internal/webhook"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	ctx := context.Background()
	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer pool.Close()

	cipher, err := crypto.New(cfg.TokenEncKey)
	if err != nil {
		log.Fatalf("crypto: %v", err)
	}

	conns := connections.NewService(pool, cipher)
	igConnector := instagram.New(cfg.MetaAppID, cfg.MetaAppSecret, cfg.MetaRedirectURI, cfg.GraphAPIVersion)
	ingest := webhook.NewHandler(cfg.WebhookVerifyToken)
	api := httpx.New(ingest, igConnector, conns, cfg.SessionSecret, cfg.DashboardURL, cfg.SecureCookies, cfg.DevAuth)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           api.Handler(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	log.Println("shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("shutdown: %v", err)
	}
}
