package httpx

import (
	"log"
	"net/http"

	"loop/internal/core/domain"
)

// devReplay (dev-gated) pulls real comments on a media via the API, runs each
// through the matcher, and sends a real private reply for every match. It lets
// us validate sending end-to-end with tester accounts before the live webhook
// auto-trigger (which needs the app published) exists.
func (a *API) devReplay(w http.ResponseWriter, r *http.Request) {
	accountID := r.PathValue("accountId")
	mediaID := r.PathValue("mediaId")

	account, err := a.accounts.AuthorizedByExternal(r.Context(), accountID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, errorBody("account not found"))
		return
	}

	comments, err := a.connector.Comments(r.Context(), account, mediaID)
	if err != nil {
		log.Printf("dev replay: comments fetch failed: %v", err)
		writeJSON(w, http.StatusBadGateway, errorBody("could not fetch comments: "+err.Error()))
		return
	}

	matched, sent := 0, 0
	var lastError string
	for _, cm := range comments {
		match, ok := a.cache.Match(domain.EngagementEvent{
			ExternalAccountID: account.ExternalID,
			SourceID:          mediaID,
			Text:              cm.Text,
			ExternalRef:       cm.ID,
		})
		if !ok {
			continue
		}
		matched++

		text := match.Body
		if match.Link != nil && *match.Link != "" {
			text += "\n" + *match.Link
		}
		msgID, err := a.connector.SendDirectMessage(r.Context(), account, cm.ID, text)
		if err != nil {
			log.Printf("dev replay: send failed for comment %s: %v", cm.ID, err)
			lastError = err.Error()
			continue
		}
		sent++
		log.Printf("dev replay: replied to comment %s → message %s", cm.ID, msgID)
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"fetched":   len(comments),
		"matched":   matched,
		"sent":      sent,
		"lastError": lastError,
	})
}
