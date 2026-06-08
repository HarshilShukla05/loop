package rules

import (
	"context"
	"errors"
	"net/url"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"loop/internal/store"
)

const (
	matchContains = "contains"
	statusActive  = "active"
	maxMessageLen = 1000
)

var (
	ErrMessageRequired = errors.New("response message is required")
	ErrMessageTooLong  = errors.New("response message is too long")
	ErrInvalidLink     = errors.New("response link must be a valid http(s) URL")
)

// IsValidation reports whether err is a user-correctable input error (HTTP 400).
func IsValidation(err error) bool {
	return errors.Is(err, ErrMessageRequired) ||
		errors.Is(err, ErrMessageTooLong) ||
		errors.Is(err, ErrInvalidLink)
}

// Input is the platform-agnostic shape for creating a rule.
type Input struct {
	MediaID         *string
	Keywords        []string
	ResponseMessage string
	ResponseLink    *string
	RequireFollow   bool
	CaptureEmail    bool
}

type Service struct {
	q *store.Queries
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{q: store.New(pool)}
}

// Create validates the input and inserts the rule (a single atomic row).
func (s *Service) Create(ctx context.Context, connectionID uuid.UUID, in Input) (store.Rule, error) {
	params, err := validate(connectionID, in)
	if err != nil {
		return store.Rule{}, err
	}
	return s.q.CreateRule(ctx, params)
}

func (s *Service) List(ctx context.Context, connectionID uuid.UUID) ([]store.Rule, error) {
	return s.q.RulesByConnection(ctx, connectionID)
}

// Delete removes a rule only if it belongs to the connection; returns false if absent.
func (s *Service) Delete(ctx context.Context, connectionID, ruleID uuid.UUID) (bool, error) {
	n, err := s.q.DeleteRule(ctx, store.DeleteRuleParams{ID: ruleID, ConnectionID: connectionID})
	return n > 0, err
}

// validate normalizes and checks input, returning ready-to-insert params.
func validate(connectionID uuid.UUID, in Input) (store.CreateRuleParams, error) {
	message := strings.TrimSpace(in.ResponseMessage)
	if message == "" {
		return store.CreateRuleParams{}, ErrMessageRequired
	}
	if len(message) > maxMessageLen {
		return store.CreateRuleParams{}, ErrMessageTooLong
	}
	link, err := normalizeLink(in.ResponseLink)
	if err != nil {
		return store.CreateRuleParams{}, err
	}
	return store.CreateRuleParams{
		ConnectionID:    connectionID,
		MediaID:         normalizeMediaID(in.MediaID),
		Keywords:        normalizeKeywords(in.Keywords),
		MatchMode:       matchContains,
		ResponseMessage: message,
		ResponseLink:    link,
		RequireFollow:   in.RequireFollow,
		CaptureEmail:    in.CaptureEmail,
		Status:          statusActive,
	}, nil
}

// normalizeKeywords trims, lowercases, drops blanks, and dedupes. Empty = any comment.
func normalizeKeywords(in []string) []string {
	seen := make(map[string]struct{})
	out := []string{}
	for _, k := range in {
		k = strings.ToLower(strings.TrimSpace(k))
		if k == "" {
			continue
		}
		if _, dup := seen[k]; dup {
			continue
		}
		seen[k] = struct{}{}
		out = append(out, k)
	}
	return out
}

// normalizeMediaID treats empty/whitespace as nil (= all posts).
func normalizeMediaID(id *string) *string {
	if id == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*id)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func normalizeLink(link *string) (*string, error) {
	if link == nil {
		return nil, nil
	}
	trimmed := strings.TrimSpace(*link)
	if trimmed == "" {
		return nil, nil
	}
	u, err := url.Parse(trimmed)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" {
		return nil, ErrInvalidLink
	}
	return &trimmed, nil
}
