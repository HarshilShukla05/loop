-- +goose Up
CREATE TABLE users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    last_login_at timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE connections (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    platform            text NOT NULL,
    external_account_id text NOT NULL,
    username            text NOT NULL,
    access_token_enc    text NOT NULL,
    token_expires_at    timestamptz,
    scopes              text[] NOT NULL DEFAULT '{}',
    status              text NOT NULL DEFAULT 'connected',
    subscription_status text NOT NULL DEFAULT 'pending',
    subscribed_fields   text[] NOT NULL DEFAULT '{}',
    last_refreshed_at   timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    UNIQUE (platform, external_account_id)
);

CREATE TABLE rules (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id    uuid NOT NULL REFERENCES connections (id) ON DELETE CASCADE,
    media_id         text,
    keywords         text[] NOT NULL DEFAULT '{}',
    match_mode       text NOT NULL DEFAULT 'contains',
    response_message text NOT NULL,
    response_link    text,
    require_follow   boolean NOT NULL DEFAULT false,
    capture_email    boolean NOT NULL DEFAULT false,
    status           text NOT NULL DEFAULT 'active',
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rules_connection_media ON rules (connection_id, media_id);

-- +goose Down
DROP TABLE rules;
DROP TABLE connections;
DROP TABLE users;
