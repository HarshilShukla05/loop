-- SeedRateBucket ensures a full bucket exists for the account. ON CONFLICT DO
-- NOTHING means no write (and no dead tuple) after the first sighting.
-- name: SeedRateBucket :exec
INSERT INTO rate_limits (external_account_id, tokens, updated_at)
VALUES (@account, @capacity, now())
ON CONFLICT (external_account_id) DO NOTHING;

-- TryConsumeToken atomically refills then consumes one token, but only if at
-- least one token is available after the refill (the WHERE guard). It returns
-- the remaining tokens on success; zero rows (pgx.ErrNoRows) means denied. The
-- single UPDATE takes the row lock, so concurrent callers can never double-spend.
-- name: TryConsumeToken :one
UPDATE rate_limits
SET tokens = LEAST(@capacity::float8, tokens + EXTRACT(EPOCH FROM (now() - updated_at)) * @refill_per_sec::float8) - 1,
    updated_at = now()
WHERE external_account_id = @account
  AND LEAST(@capacity::float8, tokens + EXTRACT(EPOCH FROM (now() - updated_at)) * @refill_per_sec::float8) >= 1
RETURNING tokens;
