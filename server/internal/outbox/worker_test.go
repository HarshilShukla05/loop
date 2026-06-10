package outbox

import (
	"errors"
	"fmt"
	"testing"
	"time"
)

// statusErr is a stand-in for instagram.APIError (anything with StatusCode()).
type statusErr struct{ code int }

func (e statusErr) Error() string   { return fmt.Sprintf("status %d", e.code) }
func (e statusErr) StatusCode() int { return e.code }

func TestPermanent(t *testing.T) {
	cases := []struct {
		name string
		err  error
		want bool
	}{
		{"400 bad request", statusErr{400}, true},
		{"404 not found", statusErr{404}, true},
		{"422 unprocessable", statusErr{422}, true},
		{"429 rate limited", statusErr{429}, false}, // retry — it's a throttle
		{"500 server error", statusErr{500}, false},
		{"503 unavailable", statusErr{503}, false},
		{"network error", errors.New("dial tcp: i/o timeout"), false},
		{"wrapped 4xx", fmt.Errorf("send: %w", statusErr{403}), true},
	}
	for _, c := range cases {
		if got := permanent(c.err); got != c.want {
			t.Errorf("%s: permanent=%v want %v", c.name, got, c.want)
		}
	}
}

func TestComposeText(t *testing.T) {
	link := "https://example.com"
	empty := ""
	if got := composeText("hi", nil); got != "hi" {
		t.Errorf("no link: %q", got)
	}
	if got := composeText("hi", &empty); got != "hi" {
		t.Errorf("empty link: %q", got)
	}
	if got := composeText("hi", &link); got != "hi\nhttps://example.com" {
		t.Errorf("with link: %q", got)
	}
}

func TestNextPoll(t *testing.T) {
	max := 2 * time.Second
	if got := nextPoll(250*time.Millisecond, max); got != 500*time.Millisecond {
		t.Errorf("double below max: %v", got)
	}
	if got := nextPoll(1500*time.Millisecond, max); got != max {
		t.Errorf("cap at max: %v", got)
	}
	if got := nextPoll(max, max); got != max {
		t.Errorf("stay at max: %v", got)
	}
}
