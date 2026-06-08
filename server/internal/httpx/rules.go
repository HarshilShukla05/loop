package httpx

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/google/uuid"

	"loop/internal/rules"
	"loop/internal/store"
)

type ruleInput struct {
	MediaID         *string  `json:"mediaId"`
	Keywords        []string `json:"keywords"`
	ResponseMessage string   `json:"responseMessage"`
	ResponseLink    *string  `json:"responseLink"`
	RequireFollow   bool     `json:"requireFollow"`
	CaptureEmail    bool     `json:"captureEmail"`
}

type ruleView struct {
	ID              string   `json:"id"`
	MediaID         *string  `json:"mediaId"`
	Keywords        []string `json:"keywords"`
	MatchMode       string   `json:"matchMode"`
	ResponseMessage string   `json:"responseMessage"`
	ResponseLink    *string  `json:"responseLink"`
	RequireFollow   bool     `json:"requireFollow"`
	CaptureEmail    bool     `json:"captureEmail"`
	Status          string   `json:"status"`
}

func toRuleView(r store.Rule) ruleView {
	return ruleView{
		ID:              r.ID.String(),
		MediaID:         r.MediaID,
		Keywords:        r.Keywords,
		MatchMode:       r.MatchMode,
		ResponseMessage: r.ResponseMessage,
		ResponseLink:    r.ResponseLink,
		RequireFollow:   r.RequireFollow,
		CaptureEmail:    r.CaptureEmail,
		Status:          r.Status,
	}
}

func (a *API) listRules(w http.ResponseWriter, r *http.Request) {
	conn, ok := a.sessionConnection(w, r)
	if !ok {
		return
	}
	rows, err := a.rules.List(r.Context(), conn.ID)
	if err != nil {
		log.Printf("rules: list failed: %v", err)
		writeJSON(w, http.StatusInternalServerError, errorBody("could not load rules"))
		return
	}
	views := make([]ruleView, len(rows))
	for i, row := range rows {
		views[i] = toRuleView(row)
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": views})
}

func (a *API) createRule(w http.ResponseWriter, r *http.Request) {
	conn, ok := a.sessionConnection(w, r)
	if !ok {
		return
	}
	var body ruleInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, errorBody("invalid request body"))
		return
	}
	rule, err := a.rules.Create(r.Context(), conn.ID, rules.Input{
		MediaID:         body.MediaID,
		Keywords:        body.Keywords,
		ResponseMessage: body.ResponseMessage,
		ResponseLink:    body.ResponseLink,
		RequireFollow:   body.RequireFollow,
		CaptureEmail:    body.CaptureEmail,
	})
	if err != nil {
		if rules.IsValidation(err) {
			writeJSON(w, http.StatusBadRequest, errorBody(err.Error()))
			return
		}
		log.Printf("rules: create failed: %v", err)
		writeJSON(w, http.StatusInternalServerError, errorBody("could not create rule"))
		return
	}
	log.Printf("rule created: id=%s media=%v keywords=%v", rule.ID, derefOr(rule.MediaID, "all"), rule.Keywords)
	writeJSON(w, http.StatusCreated, toRuleView(rule))
}

func (a *API) deleteRule(w http.ResponseWriter, r *http.Request) {
	conn, ok := a.sessionConnection(w, r)
	if !ok {
		return
	}
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, errorBody("invalid rule id"))
		return
	}
	deleted, err := a.rules.Delete(r.Context(), conn.ID, id)
	if err != nil {
		log.Printf("rules: delete failed: %v", err)
		writeJSON(w, http.StatusInternalServerError, errorBody("could not delete rule"))
		return
	}
	if !deleted {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	log.Printf("rule deleted: id=%s", id)
	w.WriteHeader(http.StatusNoContent)
}

func derefOr(s *string, fallback string) string {
	if s == nil {
		return fallback
	}
	return *s
}
