-- name: CreateUser :one
INSERT INTO users (last_login_at)
VALUES (now())
RETURNING *;

-- name: TouchUserLogin :exec
UPDATE users
SET last_login_at = now(),
    updated_at = now()
WHERE id = $1;
