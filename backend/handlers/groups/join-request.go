package groups

import (
	"encoding/json"
	"net/http"

	"github.com/gofrs/uuid"
	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// inserts a *pending* row into group_requests (if it isn't there already)
func JoinRequestHandler(w http.ResponseWriter, r *http.Request) {
	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
		return
	}

	var body struct {
		GroupID string `json:"group_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.GroupID == "" {
		help.JsonError(w, "Bad request", http.StatusBadRequest, err)
		return
	}

	_, err = tp.DB.Exec(`
		INSERT OR IGNORE INTO group_requests (id, group_id, requester_id)
		VALUES (?, ?, ?)`,
		uuid.Must(uuid.NewV4()).String(), body.GroupID, user.ID,
	)
	if err != nil {
		help.JsonError(w, "DB error", http.StatusInternalServerError, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
}
