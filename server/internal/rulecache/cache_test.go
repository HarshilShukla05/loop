package rulecache

import (
	"testing"

	"github.com/google/uuid"

	"loop/internal/core/domain"
)

func ev(account, media, text string) domain.EngagementEvent {
	return domain.EngagementEvent{ExternalAccountID: account, SourceID: media, Text: text}
}

func newTestCache() *Cache {
	return &Cache{byAccount: make(map[string]*accountRules)}
}

func TestMatchAnyComment(t *testing.T) {
	c := newTestCache()
	c.AddRule("acct", nil, Rule{ID: uuid.New(), Keywords: nil, Body: "hi"})
	if _, ok := c.Match(ev("acct", "m1", "literally anything")); !ok {
		t.Fatal("empty keywords (any comment) should match")
	}
}

func TestMatchKeywordCaseInsensitive(t *testing.T) {
	c := newTestCache()
	c.AddRule("acct", nil, Rule{ID: uuid.New(), Keywords: []string{"link"}, Body: "x"})
	if _, ok := c.Match(ev("acct", "m1", "send the LINK plz")); !ok {
		t.Fatal("should match case-insensitively")
	}
	if _, ok := c.Match(ev("acct", "m1", "nothing here")); ok {
		t.Fatal("should not match")
	}
}

func TestMatchUppercaseKeyword(t *testing.T) {
	c := newTestCache()
	// keyword typed in uppercase must still match lowercase comment text
	c.AddRule("acct", nil, Rule{ID: uuid.New(), Keywords: []string{"LINK"}, Body: "x"})
	if _, ok := c.Match(ev("acct", "m1", "drop the link")); !ok {
		t.Fatal("uppercase keyword should match lowercased comment text")
	}
}

func TestMediaSpecificBeatsAllPosts(t *testing.T) {
	c := newTestCache()
	mid := "m1"
	c.AddRule("acct", nil, Rule{ID: uuid.New(), Keywords: []string{"link"}, Body: "all"})
	specific := uuid.New()
	c.AddRule("acct", &mid, Rule{ID: specific, Keywords: []string{"link"}, Body: "one"})

	m, ok := c.Match(ev("acct", "m1", "link"))
	if !ok || m.RuleID != specific {
		t.Fatalf("specific-post rule should win: %+v ok=%v", m, ok)
	}
}

func TestFallbackToAllPosts(t *testing.T) {
	c := newTestCache()
	other := "other"
	c.AddRule("acct", &other, Rule{ID: uuid.New(), Keywords: []string{"link"}, Body: "one"})
	all := uuid.New()
	c.AddRule("acct", nil, Rule{ID: all, Keywords: []string{"link"}, Body: "all"})

	m, ok := c.Match(ev("acct", "m1", "link")) // m1 != other
	if !ok || m.RuleID != all {
		t.Fatalf("should fall back to all-posts rule: %+v ok=%v", m, ok)
	}
}

func TestRemoveRuleNoStale(t *testing.T) {
	c := newTestCache()
	id := uuid.New()
	mid := "m1"
	c.AddRule("acct", &mid, Rule{ID: id, Keywords: []string{"link"}, Body: "x"})
	if _, ok := c.Match(ev("acct", "m1", "link")); !ok {
		t.Fatal("precondition: should match")
	}
	c.RemoveRule("acct", id)
	if _, ok := c.Match(ev("acct", "m1", "link")); ok {
		t.Fatal("after remove the rule must not match (no stale)")
	}
}

func TestNoMatchUnknownAccount(t *testing.T) {
	c := newTestCache()
	if _, ok := c.Match(ev("nope", "m1", "link")); ok {
		t.Fatal("unknown account should not match")
	}
}
