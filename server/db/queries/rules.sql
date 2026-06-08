-- name: CreateRule :one
INSERT INTO rules (
    connection_id, media_id, keywords, match_mode,
    response_message, response_link, require_follow, capture_email, status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
)
RETURNING *;

-- name: RulesByConnection :many
SELECT *
FROM rules
WHERE connection_id = $1
ORDER BY created_at DESC;

-- name: DeleteRule :execrows
DELETE FROM rules
WHERE id = $1
  AND connection_id = $2;
