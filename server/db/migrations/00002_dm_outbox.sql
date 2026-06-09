-- +goose Up
CREATE TABLE dm_outbox (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id       uuid NOT NULL REFERENCES connections (id) ON DELETE CASCADE,
    rule_id             uuid NOT NULL,
    external_account_id text NOT NULL,
    comment_id          text NOT NULL UNIQUE,
    actor_id            text NOT NULL,
    media_id            text,
    body                text NOT NULL,
    link                text,
    status              text NOT NULL DEFAULT 'pending',
    attempt_count       int  NOT NULL DEFAULT 0,
    next_attempt_at     timestamptz NOT NULL DEFAULT now(),
    last_error          text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    sent_at             timestamptz
);

CREATE INDEX dm_outbox_claim ON dm_outbox (next_attempt_at) WHERE status = 'pending';

-- +goose Down
DROP TABLE dm_outbox;
