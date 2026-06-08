package instagram

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
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
	endpoint := fmt.Sprintf("%s/%s/%s/subscribed_apps", graphHost, c.graphVer, account.ExternalID)
	form := url.Values{
		"subscribed_fields": {strings.Join(fields, ",")},
		"access_token":      {account.AccessToken},
	}
	return c.postForm(ctx, endpoint, form, nil)
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
		return fmt.Errorf("instagram %s: %d: %s", req.URL.Path, resp.StatusCode, string(body))
	}
	if out == nil {
		return nil
	}
	return json.Unmarshal(body, out)
}
