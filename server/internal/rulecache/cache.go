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
		keys := keysOf(row.ExternalAccountID, row.IgID)
		var ar *accountRules
		for _, k := range keys {
			if ar = index[k]; ar != nil {
				break
			}
		}
		if ar == nil {
			ar = newAccountRules()
		}
		ar.add(row.MediaID, ruleFromRow(row))
		for _, k := range keys {
			index[k] = ar
		}
	}
	c.mu.Lock()
	c.byAccount = index
	c.mu.Unlock()
	return nil
}

// AddRule registers a freshly created rule. Call AFTER the DB insert commits.
// It is indexed under both the account's external id and ig id (the webhook
// entry.id), which point at the same rule set.
func (c *Cache) AddRule(externalAccountID, igID string, mediaID *string, r Rule) {
	r.Keywords = lowerAll(r.Keywords) // Match compares against lowercased text
	c.mu.Lock()
	defer c.mu.Unlock()
	keys := keysOf(externalAccountID, igID)
	ar := c.get(keys)
	if ar == nil {
		ar = newAccountRules()
	}
	ar.add(mediaID, r)
	c.bind(ar, keys)
}

// RemoveRule drops a deleted rule by id. Call AFTER the DB delete commits.
func (c *Cache) RemoveRule(externalAccountID, igID string, ruleID uuid.UUID) {
	c.mu.Lock()
	defer c.mu.Unlock()
	keys := keysOf(externalAccountID, igID)
	ar := c.get(keys)
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
		for _, k := range keys {
			delete(c.byAccount, k)
		}
	}
}

// RemoveAccount evicts every rule for an account — used when the account is
// deleted, so its rules stop matching webhooks immediately rather than at the
// next restart.
func (c *Cache) RemoveAccount(externalAccountID, igID string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	for _, k := range keysOf(externalAccountID, igID) {
		delete(c.byAccount, k)
	}
}

// keysOf is the set of cache keys an account is indexed under: its external id
// plus its ig id (the webhook entry.id) when present and distinct. Both keys map
// to the same *accountRules, so a Match by either id hits.
func keysOf(externalAccountID, igID string) []string {
	if igID == "" || igID == externalAccountID {
		return []string{externalAccountID}
	}
	return []string{externalAccountID, igID}
}

// get returns the account's rules via any of its keys; bind points all keys at ar.
func (c *Cache) get(keys []string) *accountRules {
	for _, k := range keys {
		if ar := c.byAccount[k]; ar != nil {
			return ar
		}
	}
	return nil
}

func (c *Cache) bind(ar *accountRules, keys []string) {
	for _, k := range keys {
		c.byAccount[k] = ar
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

// Count returns the total number of cached rules (for boot logging). Each
// account is indexed under two keys pointing at the same rules, so dedupe by
// pointer to avoid double-counting.
func (c *Cache) Count() int {
	c.mu.RLock()
	defer c.mu.RUnlock()
	seen := make(map[*accountRules]bool)
	n := 0
	for _, ar := range c.byAccount {
		if seen[ar] {
			continue
		}
		seen[ar] = true
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
