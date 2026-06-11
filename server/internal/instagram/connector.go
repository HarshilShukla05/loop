package instagram

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"loop/internal/core/domain"
	"loop/internal/core/port"
)

const (
	authorizeEndpoint = "https://api.instagram.com/oauth/authorize"
	tokenEndpoint     = "https://api.instagram.com/oauth/access_token"
	graphHost         = "https://graph.instagram.com"
)

// scopes must match the permissions configured on the Meta app.
var scopes = []string{
	"instagram_business_basic",
	"instagram_business_manage_comments",
	"instagram_business_manage_messages",
}

var _ port.SocialConnector = (*Connector)(nil)

// APIError carries a non-2xx Graph API response so callers can classify
// transient (retry) vs permanent (drop) failures by status code.
type APIError struct {
	Status int
	Path   string
	Body   string
}

func (e *APIError) Error() string {
	return fmt.Sprintf("instagram %s: %d: %s", e.Path, e.Status, e.Body)
}

func (e *APIError) StatusCode() int { return e.Status }

type Connector struct {
	appID       string
	appSecret   string
	redirectURI string
	graphVer    string
	http        *http.Client
}

func New(appID, appSecret, redirectURI, graphVer string) *Connector {
	return &Connector{
		appID:       appID,
		appSecret:   appSecret,
		redirectURI: redirectURI,
		graphVer:    graphVer,
		http:        &http.Client{Timeout: 15 * time.Second},
	}
}

func (c *Connector) AuthorizeURL(state string) string {
	q := url.Values{
		"client_id":     {c.appID},
		"redirect_uri":  {c.redirectURI},
		"response_type": {"code"},
		"scope":         {strings.Join(scopes, ",")},
		"state":         {state},
	}
	return authorizeEndpoint + "?" + q.Encode()
}

func (c *Connector) ExchangeCode(ctx context.Context, code string) (domain.ConnectedAccount, error) {
	log.Println("instagram: exchanging authorization code for token")
	var short struct {
		AccessToken string `json:"access_token"`
		UserID      int64  `json:"user_id"`
	}
	form := url.Values{
		"client_id":     {c.appID},
		"client_secret": {c.appSecret},
		"grant_type":    {"authorization_code"},
		"redirect_uri":  {c.redirectURI},
		"code":          {code},
	}
	if err := c.postForm(ctx, tokenEndpoint, form, &short); err != nil {
		return domain.ConnectedAccount{}, err
	}

	var long struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int64  `json:"expires_in"`
	}
	longURL := graphHost + "/access_token?" + url.Values{
		"grant_type":    {"ig_exchange_token"},
		"client_secret": {c.appSecret},
		"access_token":  {short.AccessToken},
	}.Encode()
	if err := c.getJSON(ctx, longURL, &long); err != nil {
		return domain.ConnectedAccount{}, err
	}

	var me struct {
		Username string `json:"username"`
	}
	meURL := graphHost + "/me?" + url.Values{
		"fields":       {"username"},
		"access_token": {long.AccessToken},
	}.Encode()
	if err := c.getJSON(ctx, meURL, &me); err != nil {
		return domain.ConnectedAccount{}, err
	}

	externalID := strconv.FormatInt(short.UserID, 10)
	expiresAt := time.Now().Add(time.Duration(long.ExpiresIn) * time.Second)
	log.Printf("instagram: connected @%s (id %s), token expires %s", me.Username, externalID, expiresAt.Format(time.RFC3339))

	return domain.ConnectedAccount{
		Platform:       domain.PlatformInstagram,
		ExternalID:     externalID,
		Username:       me.Username,
		AccessToken:    long.AccessToken,
		TokenExpiresAt: &expiresAt,
		Scopes:         scopes,
	}, nil
}

func (c *Connector) Subscribe(ctx context.Context, account domain.ConnectedAccount, fields []string) error {
	log.Printf("instagram: subscribing account %s to fields %v", account.ExternalID, fields)
	endpoint := fmt.Sprintf("%s/%s/%s/subscribed_apps", graphHost, c.graphVer, account.ExternalID)
	form := url.Values{
		"subscribed_fields": {strings.Join(fields, ",")},
		"access_token":      {account.AccessToken},
	}
	return c.postForm(ctx, endpoint, form, nil)
}

// Unsubscribe removes the app's webhook subscription for the account
// (DELETE /<ig-id>/subscribed_apps). Best-effort during account deletion.
func (c *Connector) Unsubscribe(ctx context.Context, account domain.ConnectedAccount) error {
	log.Printf("instagram: unsubscribing account %s", account.ExternalID)
	endpoint := fmt.Sprintf("%s/%s/%s/subscribed_apps?access_token=%s",
		graphHost, c.graphVer, account.ExternalID, url.QueryEscape(account.AccessToken))
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, endpoint, nil)
	if err != nil {
		return err
	}
	return c.do(req, nil)
}

func (c *Connector) Media(ctx context.Context, account domain.ConnectedAccount) ([]domain.Media, error) {
	log.Printf("instagram: fetching media for account %s", account.ExternalID)
	endpoint := graphHost + "/me/media?" + url.Values{
		"fields":       {"id,caption,media_type,media_url,thumbnail_url,permalink,timestamp"},
		"access_token": {account.AccessToken},
		"limit":        {"50"},
	}.Encode()

	var resp struct {
		Data []struct {
			ID           string `json:"id"`
			Caption      string `json:"caption"`
			MediaType    string `json:"media_type"`
			MediaURL     string `json:"media_url"`
			ThumbnailURL string `json:"thumbnail_url"`
			Permalink    string `json:"permalink"`
			Timestamp    string `json:"timestamp"`
		} `json:"data"`
	}
	if err := c.getJSON(ctx, endpoint, &resp); err != nil {
		return nil, err
	}

	media := make([]domain.Media, len(resp.Data))
	for i, m := range resp.Data {
		media[i] = domain.Media{
			ID:           m.ID,
			Caption:      m.Caption,
			MediaType:    m.MediaType,
			MediaURL:     m.MediaURL,
			ThumbnailURL: m.ThumbnailURL,
			Permalink:    m.Permalink,
			Timestamp:    m.Timestamp,
		}
	}
	return media, nil
}

// Comments lists the top-level comments on a media (GET /<media-id>/comments).
// Used by the dev replay path to obtain real comment ids without webhooks.
func (c *Connector) Comments(ctx context.Context, account domain.ConnectedAccount, mediaID string) ([]domain.Comment, error) {
	log.Printf("instagram: fetching comments for media %s", mediaID)
	endpoint := graphHost + "/" + mediaID + "/comments?" + url.Values{
		"fields":       {"id,text,timestamp"},
		"access_token": {account.AccessToken},
	}.Encode()

	var resp struct {
		Data []struct {
			ID        string `json:"id"`
			Text      string `json:"text"`
			Timestamp string `json:"timestamp"`
		} `json:"data"`
	}
	if err := c.getJSON(ctx, endpoint, &resp); err != nil {
		return nil, err
	}

	comments := make([]domain.Comment, len(resp.Data))
	for i, cm := range resp.Data {
		comments[i] = domain.Comment{ID: cm.ID, Text: cm.Text, Timestamp: cm.Timestamp}
	}
	return comments, nil
}

// SendDirectMessage sends a private reply to a comment and returns the message id.
// POST /<ig-user-id>/messages with {recipient:{comment_id}, message:{text}}.
func (c *Connector) SendDirectMessage(ctx context.Context, account domain.ConnectedAccount, commentID, text string) (string, error) {
	log.Printf("instagram: sending private reply to comment %s (account %s)", commentID, account.ExternalID)
	endpoint := fmt.Sprintf("%s/%s/%s/messages?access_token=%s",
		graphHost, c.graphVer, account.ExternalID, url.QueryEscape(account.AccessToken))

	payload := map[string]any{
		"recipient": map[string]string{"comment_id": commentID},
		"message":   map[string]string{"text": text},
	}
	var resp struct {
		RecipientID string `json:"recipient_id"`
		MessageID   string `json:"message_id"`
	}
	if err := c.postJSON(ctx, endpoint, payload, &resp); err != nil {
		return "", err
	}
	return resp.MessageID, nil
}

// ReplyToComment posts a public reply under a comment and returns the new
// comment id. Per Meta's IG Comment → Replies docs: POST /<comment-id>/replies
// with `message` as a form param (NOT JSON, unlike the private reply), permission
// instagram_business_manage_comments. Used to acknowledge the commenter publicly.
func (c *Connector) ReplyToComment(ctx context.Context, account domain.ConnectedAccount, commentID, text string) (string, error) {
	log.Printf("instagram: public reply to comment %s (account %s)", commentID, account.ExternalID)
	endpoint := fmt.Sprintf("%s/%s/%s/replies", graphHost, c.graphVer, commentID)
	form := url.Values{
		"message":      {text},
		"access_token": {account.AccessToken},
	}
	var resp struct {
		ID string `json:"id"`
	}
	if err := c.postForm(ctx, endpoint, form, &resp); err != nil {
		return "", err
	}
	return resp.ID, nil
}

func (c *Connector) VerifySignature(body []byte, signature string) bool {
	mac := hmac.New(sha256.New, []byte(c.appSecret))
	mac.Write(body)
	expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(signature), []byte(expected))
}

func (c *Connector) ParseWebhook(body []byte) ([]domain.EngagementEvent, error) {
	var payload struct {
		Entry []struct {
			ID      string `json:"id"`
			Changes []struct {
				Field string `json:"field"`
				Value struct {
					ID   string `json:"id"`
					Text string `json:"text"`
					From struct {
						ID string `json:"id"`
					} `json:"from"`
					Media struct {
						ID string `json:"id"`
					} `json:"media"`
				} `json:"value"`
			} `json:"changes"`
		} `json:"entry"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		return nil, err
	}

	var events []domain.EngagementEvent
	for _, entry := range payload.Entry {
		for _, change := range entry.Changes {
			if change.Field != "comments" {
				continue
			}
			events = append(events, domain.EngagementEvent{
				Platform:          domain.PlatformInstagram,
				ExternalAccountID: entry.ID,
				SourceID:          change.Value.Media.ID,
				ActorID:           change.Value.From.ID,
				Text:              change.Value.Text,
				ExternalRef:       change.Value.ID,
			})
		}
	}
	return events, nil
}

func (c *Connector) postForm(ctx context.Context, endpoint string, form url.Values, out any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	return c.do(req, out)
}

func (c *Connector) postJSON(ctx context.Context, endpoint string, payload, out any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	return c.do(req, out)
}

func (c *Connector) getJSON(ctx context.Context, endpoint string, out any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}
	return c.do(req, out)
}

func (c *Connector) do(req *http.Request, out any) error {
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		return &APIError{Status: resp.StatusCode, Path: req.URL.Path, Body: string(body)}
	}
	if out == nil {
		return nil
	}
	return json.Unmarshal(body, out)
}
