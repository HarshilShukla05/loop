-- name: ConnectionByExternal :one
-- Resolves by either id: external_account_id (OAuth user_id) or ig_id (the
-- professional-account id the webhook carries). $2 is always a real non-empty id.
SELECT *
FROM connections
WHERE platform = $1
  AND (external_account_id = $2 OR ig_id = $2);

-- name: ConnectionByUser :one
SELECT *
FROM connections
WHERE user_id = $1
ORDER BY created_at
LIMIT 1;

-- name: CreateConnection :one
INSERT INTO connections (
    user_id, platform, external_account_id, ig_id, username,
    access_token_enc, token_expires_at, scopes,
    status, subscription_status, subscribed_fields
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
)
RETURNING *;

-- name: UpdateConnectionTokens :one
UPDATE connections
SET username         = $2,
    access_token_enc = $3,
    token_expires_at = $4,
    scopes           = $5,
    status           = $6,
    ig_id            = $7,
    last_refreshed_at = now(),
    updated_at       = now()
WHERE id = $1
RETURNING *;

-- name: SetSubscription :exec
UPDATE connections
SET subscription_status = $2,
    subscribed_fields   = $3,
    updated_at          = now()
WHERE id = $1;
