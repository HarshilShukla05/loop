package rulecache

import (
	"context"
	"slices"
	"strings"
	"sync"

	"github.com/google/uuid"

	"loop/internal/core/domain"
	"loop/internal/store"
)

// Rule is the minimal, matchable form of a rule held in memory.
type Rule struct {
	ID            uuid.UUID
	ConnectionID  uuid.UUID
	Keywords      []string // already lowercased; empty = any comment
	Body          string
	Link          *string
	RequireFollow bool
}

// Match is the resolved decision for a comment.
type Match struct {
	RuleID       uuid.UUID
	ConnectionID uuid.UUID
	Body         string
	Link         *string
}

// accountRules indexes one account's rules by the post they target, so a comment
// on media M only scans rules for M plus the all-posts rules.
type accountRules struct {
	byMedia  map[string][]Rule
	allPosts []Rule
}

func newAccountRules() *accountRules {
	return &accountRules{byMedia: make(map[string][]Rule)}
}

type loader interface {
	RulesForCache(ctx context.Context) ([]store.RulesForCacheRow, error)
}

type Cache struct {
	mu        sync.RWMutex
	byAccount map[string]*accountRules
	q         loader
}

func New(q loader) *Cache {
	return &Cache{byAccount: make(map[string]*accountRules), q: q}
}

func (c *Cache) Load(ctx context.Context) error {
	rows, err := c.q.RulesForCache(ctx)
	if err != nil {
		return err
	}
	index := make(map[string]*accountRules)
	for _, row := range rows {
		ar := index[row.ExternalAccountID]
		if ar == nil {
			ar = newAccountRules()
			index[row.ExternalAccountID] = ar
		}
		ar.add(row.MediaID, ruleFromRow(row))
	}
	c.mu.Lock()
	c.byAccount = index
	c.mu.Unlock()
	return nil
}

// AddRule registers a freshly created rule. Call AFTER the DB insert commits.
func (c *Cache) AddRule(externalAccountID string, mediaID *string, r Rule) {
	r.Keywords = lowerAll(r.Keywords) // Match compares against lowercased text
	c.mu.Lock()
	defer c.mu.Unlock()
	ar := c.byAccount[externalAccountID]
	if ar == nil {
		ar = newAccountRules()
		c.byAccount[externalAccountID] = ar
	}
	ar.add(mediaID, r)
}

// RemoveRule drops a deleted rule by id. Call AFTER the DB delete commits.
func (c *Cache) RemoveRule(externalAccountID string, ruleID uuid.UUID) {
	c.mu.Lock()
	defer c.mu.Unlock()
	ar := c.byAccount[externalAccountID]
	if ar == nil {
		return
	}
	hasID := func(r Rule) bool { return r.ID == ruleID }
	ar.allPosts = slices.DeleteFunc(ar.allPosts, hasID)
	for media, rules := range ar.byMedia {
		if kept := slices.DeleteFunc(rules, hasID); len(kept) == 0 {
			delete(ar.byMedia, media)
		} else {
			ar.byMedia[media] = kept
		}
	}
	if len(ar.allPosts) == 0 && len(ar.byMedia) == 0 {
		delete(c.byAccount, externalAccountID)
	}
}

func (c *Cache) Match(e domain.EngagementEvent) (Match, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	ar := c.byAccount[e.ExternalAccountID]
	if ar == nil {
		return Match{}, false
	}
	text := strings.ToLower(e.Text)
	//HEAVY:
	for _, r := range ar.byMedia[e.SourceID] {
		if keywordHit(r.Keywords, text) {
			return matchOf(r), true
		}
	}
	for _, r := range ar.allPosts {
		if keywordHit(r.Keywords, text) {
			return matchOf(r), true
		}
	}
	return Match{}, false
}

// Count returns the total number of cached rules (for boot logging).
func (c *Cache) Count() int {
	c.mu.RLock()
	defer c.mu.RUnlock()
	n := 0
	for _, ar := range c.byAccount {
		n += len(ar.allPosts)
		for _, rules := range ar.byMedia {
			n += len(rules)
		}
	}
	return n
}

func (ar *accountRules) add(mediaID *string, r Rule) {
	if mediaID == nil {
		ar.allPosts = append(ar.allPosts, r)
		return
	}
	ar.byMedia[*mediaID] = append(ar.byMedia[*mediaID], r)
}

func keywordHit(keywords []string, lowerText string) bool {
	if len(keywords) == 0 {
		return true // any comment
	} //HEAVY:
	for _, k := range keywords {
		if strings.Contains(lowerText, k) {
			return true
		}
	}
	return false
}

func matchOf(r Rule) Match {
	return Match{RuleID: r.ID, ConnectionID: r.ConnectionID, Body: r.Body, Link: r.Link}
}

func ruleFromRow(row store.RulesForCacheRow) Rule {
	return Rule{
		ID:            row.RuleID,
		ConnectionID:  row.ConnectionID,
		Keywords:      lowerAll(row.Keywords),
		Body:          row.ResponseMessage,
		Link:          row.ResponseLink,
		RequireFollow: row.RequireFollow,
	}
}

// lowerAll lowercases every keyword so matching is case-insensitive regardless
// of how the keyword was typed when the rule was created.
func lowerAll(ks []string) []string {
	if ks == nil {
		return nil
	}
	out := make([]string, len(ks))
	for i, k := range ks {
		out[i] = strings.ToLower(k)
	}
	return out
}
