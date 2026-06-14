-- +goose Up
-- Durable per-account token bucket for the send rate limit (Meta: 750/hr per
-- account for private replies on posts/reels). State lives here, not in memory,
-- so it survives restart/redeploy and is correct across concurrent workers.
CREATE TABLE rate_limits (
    external_account_id text PRIMARY KEY,
    tokens              double precision NOT NULL,
    updated_at          timestamptz NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE rate_limits;
