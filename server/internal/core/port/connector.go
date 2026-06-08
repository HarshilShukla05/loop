package port

import (
	"context"

	"loop/internal/core/domain"
)

// SocialConnector is the seam every platform (Instagram now; Reddit/X later)
// implements. The core depends on this, never on a platform's HTTP details.
type SocialConnector interface {
	AuthorizeURL(state string) string
	ExchangeCode(ctx context.Context, code string) (domain.ConnectedAccount, error)
	Subscribe(ctx context.Context, account domain.ConnectedAccount, fields []string) error
	VerifySignature(body []byte, signature string) bool
	ParseWebhook(body []byte) ([]domain.EngagementEvent, error)
}
