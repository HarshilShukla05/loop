-include .env
export

GOOSE := go run github.com/pressly/goose/v3/cmd/goose@latest -dir db/migrations

.PHONY: db migrate migrate-down run tidy sqlc test test-db test-integration

db:
	docker compose up -d

sqlc:
	go run github.com/sqlc-dev/sqlc/cmd/sqlc@latest generate

migrate:
	$(GOOSE) postgres "$(DATABASE_URL)" up

migrate-down:
	$(GOOSE) postgres "$(DATABASE_URL)" down

run:
	go run ./cmd/server

tidy:
	go mod tidy

test:
	go test ./...

test-db:
	docker compose exec -T postgres psql -U loop -d loop -tc "SELECT 1 FROM pg_database WHERE datname='loop_test'" | grep -q 1 || docker compose exec -T postgres psql -U loop -d loop -c "CREATE DATABASE loop_test"
	$(GOOSE) postgres "$(TEST_DATABASE_URL)" up

test-integration: test-db
	go test -tags integration ./...
