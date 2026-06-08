package rules

import (
	"strings"
	"testing"

	"github.com/google/uuid"
)

func TestValidateRequiresMessage(t *testing.T) {
	if _, err := validate(uuid.New(), Input{ResponseMessage: "   "}); err != ErrMessageRequired {
		t.Fatalf("got %v, want ErrMessageRequired", err)
	}
}

func TestValidateMessageTooLong(t *testing.T) {
	in := Input{ResponseMessage: strings.Repeat("a", maxMessageLen+1)}
	if _, err := validate(uuid.New(), in); err != ErrMessageTooLong {
		t.Fatalf("got %v, want ErrMessageTooLong", err)
	}
}

func TestValidateRejectsBadLink(t *testing.T) {
	bad := "not a url"
	if _, err := validate(uuid.New(), Input{ResponseMessage: "hi", ResponseLink: &bad}); err != ErrInvalidLink {
		t.Fatalf("got %v, want ErrInvalidLink", err)
	}
}

func TestValidateNormalizes(t *testing.T) {
	link := "  https://example.com/x  "
	params, err := validate(uuid.New(), Input{
		ResponseMessage: "  here you go  ",
		ResponseLink:    &link,
		Keywords:        []string{"LINK", " link ", "", "Send"},
	})
	if err != nil {
		t.Fatal(err)
	}
	if params.ResponseMessage != "here you go" {
		t.Fatalf("message = %q", params.ResponseMessage)
	}
	if params.ResponseLink == nil || *params.ResponseLink != "https://example.com/x" {
		t.Fatalf("link = %v", params.ResponseLink)
	}
	if len(params.Keywords) != 2 || params.Keywords[0] != "link" || params.Keywords[1] != "send" {
		t.Fatalf("keywords = %v (want [link send])", params.Keywords)
	}
	if params.MatchMode != matchContains || params.Status != statusActive {
		t.Fatalf("defaults: matchMode=%s status=%s", params.MatchMode, params.Status)
	}
}

func TestValidateAnyCommentEmptyKeywords(t *testing.T) {
	params, err := validate(uuid.New(), Input{ResponseMessage: "hi", Keywords: nil})
	if err != nil {
		t.Fatal(err)
	}
	if len(params.Keywords) != 0 {
		t.Fatalf("expected empty keywords, got %v", params.Keywords)
	}
}

func TestValidateAllPostsNilMedia(t *testing.T) {
	blank := "   "
	params, err := validate(uuid.New(), Input{ResponseMessage: "hi", MediaID: &blank})
	if err != nil {
		t.Fatal(err)
	}
	if params.MediaID != nil {
		t.Fatalf("expected nil media id, got %v", *params.MediaID)
	}
}
