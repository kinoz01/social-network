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

// Handles the acceptance of an invitation to join a group.
// If the invitation is valid, it adds the user to the group and deletes the invitation.
func AcceptInvitation(w http.ResponseWriter, r *http.Request) {
	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
		return
	}
	var body struct {
		InvitationID string `json:"invitation_id"`
	}
	if json.NewDecoder(r.Body).Decode(&body) != nil || body.InvitationID == "" {
		help.JsonError(w, "Bad request", http.StatusBadRequest, nil)
		return
	}

	tx, err := tp.DB.Begin()
	if err != nil {
		help.JsonError(w, "tx begin", 500, err)
		return
	}

	// Get group_id and inviteee_id from the invitations table
	var groupID string
	err = tx.QueryRow(`
		SELECT group_id FROM group_invitations
		WHERE id = ? AND invitee_id = ?`,
		body.InvitationID, user.ID).Scan(&groupID)
	if err == sql.ErrNoRows {
		tx.Rollback()
		help.JsonError(w, "Not found", 404, err)
		return
	} else if err != nil {
		tx.Rollback()
		help.JsonError(w, "DB error", 500, err)
		return
	}

	_, err = tx.Exec(`
		INSERT OR IGNORE INTO group_users (id, group_id, users_id)
		VALUES (?, ?, ?)`,
		uuid.Must(uuid.NewV4()).String(), groupID, user.ID)
	if err != nil {
		tx.Rollback()
		help.JsonError(w, "insert failed", 500, err)
		return
	}

	// Cleanup any join request
	_, err = tx.Exec(`
		DELETE FROM group_requests
		WHERE group_id = ? AND requester_id = ?`,
		groupID, user.ID)
	if err != nil {
		tx.Rollback()
		help.JsonError(w, "delete join request failed", 500, err)
		return
	}

	_, err = tx.Exec(`DELETE FROM group_invitations WHERE id = ?`, body.InvitationID)
	if err != nil {
		tx.Rollback()
		help.JsonError(w, "delete failed", 500, err)
		return
	}

	if err := tx.Commit(); err != nil {
		help.JsonError(w, "commit failed", 500, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
