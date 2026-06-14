-- name: CreateUser :one
INSERT INTO users (last_login_at)
VALUES (now())
RETURNING *;

-- name: TouchUserLogin :exec
UPDATE users
SET last_login_at = now(),
    updated_at = now()
WHERE id = $1;

-- DeleteUser removes the user; connections, rules, and dm_outbox rows cascade
-- via their ON DELETE CASCADE foreign keys.
-- name: DeleteUser :exec
DELETE FROM users WHERE id = $1;
