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

// Comment is a comment on a media, read via the API (for the dev replay path).
type Comment struct {
	ID        string
	Text      string
	Timestamp string
}

// Media is a post/reel on a connected account (used by the rule picker).
type Media struct {
	ID           string
	Caption      string
	MediaType    string
	MediaURL     string
	ThumbnailURL string
	Permalink    string
	Timestamp    string
}
