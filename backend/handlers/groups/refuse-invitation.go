package groups

import (
	"encoding/json"
	"net/http"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

func RefuseInvitationHandler(w http.ResponseWriter, r *http.Request) {
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

	_, err = tp.DB.Exec(`
		UPDATE group_invitations
		   SET status = 'rejected'
		 WHERE id = ? AND invitee_id = ?`,
		body.InvitationID, user.ID)
	if err != nil {
		help.JsonError(w, "DB error", http.StatusInternalServerError, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
