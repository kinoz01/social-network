package groups

import (
	"encoding/json"
	"net/http"

	"github.com/gofrs/uuid"
	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// This is used when a user wants to join a group
// Inserts a row into group_requests (if it isn't there already)
func JoinRequest(w http.ResponseWriter, r *http.Request) {
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

	// Check if user is already in the group (handled in front but for safety)
	var exists bool
	err = tp.DB.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM group_users WHERE group_id = ? AND users_id = ?
		)`, body.GroupID, user.ID,
	).Scan(&exists)
	if err != nil {
		help.JsonError(w, "DB error", http.StatusInternalServerError, err)
		return
	}
	if exists {
		help.JsonError(w, "You are already a member of this group", http.StatusConflict, nil)
		return
	}

	// Clear rejected invitations before creating join request
	_, err = tp.DB.Exec(`
		DELETE FROM group_invitations
 		WHERE group_id = ? AND invitee_id = ? AND status = 'rejected'
`	, body.GroupID, user.ID)
	if err != nil {
		help.JsonError(w, "Failed to clear old rejected invitations", http.StatusInternalServerError, err)
		return
	}

	// Proceed with join request
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
