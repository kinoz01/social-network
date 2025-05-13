package groups

import (
	"database/sql"
	"encoding/json"
	"net/http"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"

	"github.com/gofrs/uuid"
)

func AcceptJoinRequestHandler(w http.ResponseWriter, r *http.Request) {
	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "Unauthorized", 401, err)
		return
	}

	var body struct {
		RequestID string `json:"request_id"`
	}
	if json.NewDecoder(r.Body).Decode(&body) != nil || body.RequestID == "" {
		help.JsonError(w, "Bad request", 400, err)
		return
	}

	var groupID, requesterID string
	if err := tp.DB.QueryRow(`
		SELECT group_id, requester_id
		  FROM group_requests
		 WHERE id = ? AND status = 'pending'`, body.RequestID).
		Scan(&groupID, &requesterID); err != nil {
		if err == sql.ErrNoRows {
			help.JsonError(w, "Not found", 404, err)
			return
		}
		help.JsonError(w, "DB error", 500, err)
		return
	}

	// Verify ownership
	var owner string
	_ = tp.DB.QueryRow(`SELECT group_owner FROM groups WHERE id = ?`, groupID).Scan(&owner)
	if owner != user.ID {
		help.JsonError(w, "Forbidden", 403, err)
		return
	}

	tx, err := tp.DB.Begin()
	if err != nil {
		help.JsonError(w, "Transaction start failed", 500, err)
		return
	}

	// Delete join request
	_, err = tx.Exec(`DELETE FROM group_requests WHERE id = ?`, body.RequestID)
	if err != nil {
		tx.Rollback()
		help.JsonError(w, "Failed to delete request", 500, err)
		return
	}

	// Delete existing invitation
	_, err = tx.Exec(`DELETE FROM group_invitations WHERE group_id = ? AND invitee_id = ?`, groupID, requesterID)
	if err != nil {
		tx.Rollback()
		help.JsonError(w, "Failed to delete invitation", 500, err)
		return
	}

	// Add the user to the group
	_, err = tx.Exec(`INSERT OR IGNORE INTO group_users (id, group_id, users_id) VALUES (?, ?, ?)`,
		uuid.Must(uuid.NewV4()).String(), groupID, requesterID)
	if err != nil {
		tx.Rollback()
		help.JsonError(w, "Failed to add user to group", 500, err)
		return
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		help.JsonError(w, "Failed to commit", 500, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"ok": true})
}
