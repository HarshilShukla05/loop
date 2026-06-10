package connections

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"loop/internal/core/domain"
	"loop/internal/crypto"
	"loop/internal/db"
	"loop/internal/store"
)

const (
	statusConnected     = "connected"
	subscriptionPending = "pending"
	subscriptionActive  = "active"
)

type Service struct {
	pool   *pgxpool.Pool
	q      *store.Queries
	cipher *crypto.Cipher
}

func NewService(pool *pgxpool.Pool, cipher *crypto.Cipher) *Service {
	return &Service{pool: pool, q: store.New(pool), cipher: cipher}
}

// Connect onboards a freshly authorized account: it finds or creates the user,
// upserts the connection, and stores the encrypted token — all in one transaction.
func (s *Service) Connect(ctx context.Context, acc domain.ConnectedAccount) (store.Connection, error) {
	encrypted, err := s.cipher.Encrypt(acc.AccessToken)
	if err != nil {
		return store.Connection{}, err
	}

	var conn store.Connection
	err = db.WithTx(ctx, s.pool, func(tx pgx.Tx) error {
		q := s.q.WithTx(tx)

		existing, err := q.ConnectionByExternal(ctx, store.ConnectionByExternalParams{
			Platform:          acc.Platform,
			ExternalAccountID: acc.ExternalID,
		})
		switch {
		case err == nil:
			if err := q.TouchUserLogin(ctx, existing.UserID); err != nil {
				return err
			}
			conn, err = q.UpdateConnectionTokens(ctx, store.UpdateConnectionTokensParams{
				ID:             existing.ID,
				Username:       acc.Username,
				AccessTokenEnc: encrypted,
				TokenExpiresAt: acc.TokenExpiresAt,
				Scopes:         acc.Scopes,
				Status:         statusConnected,
			})
			return err

		case errors.Is(err, pgx.ErrNoRows):
			user, err := q.CreateUser(ctx)
			if err != nil {
				return err
			}
			conn, err = q.CreateConnection(ctx, store.CreateConnectionParams{
				UserID:             user.ID,
				Platform:           acc.Platform,
				ExternalAccountID:  acc.ExternalID,
				Username:           acc.Username,
				AccessTokenEnc:     encrypted,
				TokenExpiresAt:     acc.TokenExpiresAt,
				Scopes:             acc.Scopes,
				Status:             statusConnected,
				SubscriptionStatus: subscriptionPending,
				SubscribedFields:   []string{},
			})
			return err

		default:
			return err
		}
	})
	return conn, err
}

// MarkSubscribed records that the account's webhook subscription is active.
func (s *Service) MarkSubscribed(ctx context.Context, connectionID uuid.UUID, fields []string) error {
	return s.q.SetSubscription(ctx, store.SetSubscriptionParams{
		ID:                 connectionID,
		SubscriptionStatus: subscriptionActive,
		SubscribedFields:   fields,
	})
}

// Account returns the connection owned by a user, if any.
func (s *Service) Account(ctx context.Context, userID uuid.UUID) (store.Connection, error) {
	return s.q.ConnectionByUser(ctx, userID)
}

// AuthorizedByExternal returns an account (token decrypted) by its Instagram id.
// Used by dev tooling that runs outside a user session.
func (s *Service) AuthorizedByExternal(ctx context.Context, externalAccountID string) (domain.ConnectedAccount, error) {
	conn, err := s.q.ConnectionByExternal(ctx, store.ConnectionByExternalParams{
		Platform:          domain.PlatformInstagram,
		ExternalAccountID: externalAccountID,
	})
	if err != nil {
		return domain.ConnectedAccount{}, err
	}
	token, err := s.cipher.Decrypt(conn.AccessTokenEnc)
	if err != nil {
		return domain.ConnectedAccount{}, err
	}
	return domain.ConnectedAccount{
		Platform:       conn.Platform,
		ExternalID:     conn.ExternalAccountID,
		Username:       conn.Username,
		AccessToken:    token,
		TokenExpiresAt: conn.TokenExpiresAt,
		Scopes:         conn.Scopes,
	}, nil
}

// Authorized returns the user's account with its access token decrypted, ready
// for Meta calls. The plaintext token never leaves this boundary in stored form.
func (s *Service) Authorized(ctx context.Context, userID uuid.UUID) (domain.ConnectedAccount, error) {
	conn, err := s.q.ConnectionByUser(ctx, userID)
	if err != nil {
		return domain.ConnectedAccount{}, err
	}
	token, err := s.cipher.Decrypt(conn.AccessTokenEnc)
	if err != nil {
		return domain.ConnectedAccount{}, err
	}
	return domain.ConnectedAccount{
		Platform:       conn.Platform,
		ExternalID:     conn.ExternalAccountID,
		Username:       conn.Username,
		AccessToken:    token,
		TokenExpiresAt: conn.TokenExpiresAt,
		Scopes:         conn.Scopes,
	}, nil
}
