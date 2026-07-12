-- name: InsertDMJob :execrows
INSERT INTO dm_outbox (
    connection_id, rule_id, external_account_id, comment_id,
    actor_id, media_id, body, link
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
)
ON CONFLICT (comment_id) DO NOTHING;

-- name: ClaimDMJob :one
SELECT *
FROM dm_outbox
WHERE status = 'pending'
  AND next_attempt_at <= now()
ORDER BY next_attempt_at
FOR UPDATE SKIP LOCKED
LIMIT 1;

-- name: MarkSent :exec
UPDATE dm_outbox
SET status = 'sent', sent_at = now()
WHERE id = $1;

-- name: DeferJob :exec
UPDATE dm_outbox
SET next_attempt_at = $2
WHERE id = $1;

-- name: RetryJob :exec
UPDATE dm_outbox
SET attempt_count = attempt_count + 1,
    next_attempt_at = $2,
    last_error = $3
WHERE id = $1;

-- name: FailJob :exec
UPDATE dm_outbox
SET status = 'failed',
    attempt_count = attempt_count + 1,
    last_error = $2
WHERE id = $1;

-- name: RulesForCache :many
SELECT r.id AS rule_id,
       r.connection_id,
       c.external_account_id,
       c.ig_id,
       r.media_id,
       r.keywords,
       r.response_message,
       r.response_link,
       r.require_follow
FROM rules r
JOIN connections c ON c.id = r.connection_id
WHERE r.status = 'active';
