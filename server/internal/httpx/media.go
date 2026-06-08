package httpx

import (
	"log"
	"net/http"
)

type mediaView struct {
	ID           string `json:"id"`
	Caption      string `json:"caption"`
	MediaType    string `json:"mediaType"`
	MediaURL     string `json:"mediaUrl"`
	ThumbnailURL string `json:"thumbnailUrl"`
	Permalink    string `json:"permalink"`
	Timestamp    string `json:"timestamp"`
}

func (a *API) media(w http.ResponseWriter, r *http.Request) {
	conn, ok := a.sessionConnection(w, r)
	if !ok {
		return
	}
	account, err := a.accounts.Authorized(r.Context(), conn.UserID)
	if err != nil {
		log.Printf("media: load account failed: %v", err)
		writeJSON(w, http.StatusBadGateway, errorBody("could not load account"))
		return
	}
	items, err := a.connector.Media(r.Context(), account)
	if err != nil {
		log.Printf("media: fetch failed: %v", err)
		writeJSON(w, http.StatusBadGateway, errorBody("could not fetch media"))
		return
	}
	views := make([]mediaView, len(items))
	for i, m := range items {
		views[i] = mediaView{
			ID:           m.ID,
			Caption:      m.Caption,
			MediaType:    m.MediaType,
			MediaURL:     m.MediaURL,
			ThumbnailURL: m.ThumbnailURL,
			Permalink:    m.Permalink,
			Timestamp:    m.Timestamp,
		}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": views})
}
