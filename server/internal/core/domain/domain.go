package domain

import "time"

const PlatformInstagram = "instagram"

// ConnectedAccount is what an OAuth flow yields for any platform.
type ConnectedAccount struct {
	Platform       string
	ExternalID     string
	Username       string
	AccessToken    string
	TokenExpiresAt *time.Time
	Scopes         []string
}

// EngagementEvent is the platform-agnostic shape every webhook is parsed into.
type EngagementEvent struct {
	Platform          string
	ExternalAccountID string
	SourceID          string // post / media / thread id — the join key for rules
	ActorID           string // commenter
	Text              string
	ExternalRef       string // e.g. comment id — needed to send the reply
}

// OutboundMessage is a platform-agnostic message to deliver.
type OutboundMessage struct {
	Platform     string
	RecipientRef string
	Body         string
}
