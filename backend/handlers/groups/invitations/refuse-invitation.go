package groups

import (
	"encoding/json"
	"net/http"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// Handles the refusal of a group invitation.
func RefuseInvitation(w http.ResponseWriter, r *http.Request) {
	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
		return
	}

	var body struct {
		InvitationID string `json:"invitation_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.InvitationID == "" {
		help.JsonError(w, "Bad request", http.StatusBadRequest, err)
		return
	}

	res, err := tp.DB.Exec(`
		DELETE FROM group_invitations
		      WHERE id = ? AND invitee_id = ?`,
		body.InvitationID, user.ID)
	if err != nil {
		help.JsonError(w, "DB error", http.StatusInternalServerError, err)
		return
	}
	// For feedback
	if n, _ := res.RowsAffected(); n == 0 {
		help.JsonError(w, "Forbidden", http.StatusForbidden, nil)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
