package groups

import (
	"encoding/json"
	"net/http"
	"strings"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"

	"github.com/gofrs/uuid"
)

func EventResponse(w http.ResponseWriter, r *http.Request) {
	u, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauthorized", http.StatusUnauthorized, err)
		return
	}

	var req struct {
		EventID  string `json:"event_id"`
		Response string `json:"response"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		help.JsonError(w, "bad json", http.StatusBadRequest, err)
		return
	}
	resp := strings.ToLower(req.Response)
	if resp != "going" && resp != "not_going" {
		help.JsonError(w, "invalid response", http.StatusBadRequest, nil)
		return
	}

	tx, err := tp.DB.Begin()
	if err != nil {
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}

	// Upsert (ON CONFLICT)
	if _, err := tx.Exec(`
	    INSERT INTO event_responses (id,event_id,user_id,response)
	    VALUES (?,?,?,?)
	    ON CONFLICT(event_id,user_id)
	    DO UPDATE SET response = excluded.response`,
		uuid.Must(uuid.NewV4()).String(), req.EventID, u.ID, resp,
	); err != nil {
		tx.Rollback()
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}

	// Delete any event_created notification for this user/event
	if _, err := tx.Exec(`
	DELETE FROM notifications
	WHERE receiver_id = ?
	  AND related_event_id = ?`, u.ID, req.EventID,
	); err != nil {
		tx.Rollback()
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}

	// Return fresh counts so UI is always correct
	var going, notGoing int
	if err := tx.QueryRow(`
	    SELECT
	      SUM(CASE WHEN response='going'     THEN 1 ELSE 0 END),
	      SUM(CASE WHEN response='not_going' THEN 1 ELSE 0 END)
	    FROM event_responses
	    WHERE event_id = ?`, req.EventID,
	).Scan(&going, &notGoing); err != nil {
		tx.Rollback()
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}

	if err := tx.Commit(); err != nil {
		help.JsonError(w, "commit failed", http.StatusInternalServerError, err)
		return
	}
	json.NewEncoder(w).Encode(map[string]int{
		"going":     going,
		"not_going": notGoing,
	})
}
