-- +goose Up
-- ig_id is the Instagram professional-account id (/me?fields=user_id, the "1784…"
-- form). It is what comment webhooks carry in entry.id — distinct from
-- external_account_id, which holds the OAuth token-exchange user_id. We store and
-- match on both so real webhooks resolve to the right connection. Default '' for
-- pre-existing rows (re-connect to populate); never queried with an empty value.
ALTER TABLE connections ADD COLUMN ig_id text NOT NULL DEFAULT '';
CREATE INDEX connections_ig_id_idx ON connections (ig_id) WHERE ig_id <> '';

-- +goose Down
DROP INDEX connections_ig_id_idx;
ALTER TABLE connections DROP COLUMN ig_id;
