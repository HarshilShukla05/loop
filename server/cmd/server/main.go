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
	"loop/internal/outbox"
	"loop/internal/ratelimit"
	"loop/internal/rulecache"
	"loop/internal/rules"
	"loop/internal/store"
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
	ruleSvc := rules.NewService(pool)

	queries := store.New(pool)
	cache := rulecache.New(queries)
	if err := cache.Load(ctx); err != nil {
		log.Fatalf("rule cache load: %v", err)
	}
	log.Printf("rule cache loaded: %d rules", cache.Count())

	igConnector := instagram.New(cfg.MetaAppID, cfg.MetaAppSecret, cfg.MetaRedirectURI, cfg.GraphAPIVersion)
	// Enforce the X-Hub-Signature-256 except in local dev (DEV_AUTH=true), where
	// unsigned manual test posts are convenient.
	ingest := webhook.NewHandler(cfg.WebhookVerifyToken, igConnector, cache, queries, !cfg.DevAuth)
	api := httpx.New(ingest, igConnector, conns, ruleSvc, cache, cfg.SessionSecret, cfg.DashboardURL, cfg.MarketingURL, cfg.SecureCookies, cfg.DevAuth)

	limiter := ratelimit.New(pool, cfg.RateLimitPerHour)
	workers := outbox.NewPool(pool, conns, igConnector, limiter, outbox.Config{
		Workers: cfg.WorkerCount,
		DryRun:  cfg.SendDryRun,
	})
	workerCtx, cancelWorkers := context.WithCancel(context.Background())
	workers.Start(workerCtx)

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
	cancelWorkers() // stop claiming new jobs; in-flight sends finish or roll back
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("shutdown: %v", err)
	}
	workers.Wait()
	log.Println("outbox drained")
}
