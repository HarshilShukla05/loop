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
	Media(ctx context.Context, account domain.ConnectedAccount) ([]domain.Media, error)
	Comments(ctx context.Context, account domain.ConnectedAccount, mediaID string) ([]domain.Comment, error)
	SendDirectMessage(ctx context.Context, account domain.ConnectedAccount, commentID, text string) (string, error)
	ReplyToComment(ctx context.Context, account domain.ConnectedAccount, commentID, text string) (string, error)
	VerifySignature(body []byte, signature string) bool
	ParseWebhook(body []byte) ([]domain.EngagementEvent, error)
}
