package groups

import (
	"encoding/json"
	"net/http"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

func InvitationsHandler(w http.ResponseWriter, r *http.Request) {
	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
		return
	}

	rows, err := tp.DB.Query(`
    	SELECT g.id, g.group_name, g.group_pic, g.description,
           	gi.id AS invitation_id,
           	gi.status AS invitation_status,
           	(SELECT COUNT(*) FROM group_users gu WHERE gu.group_id = g.id) AS members
      	FROM group_invitations gi
      	JOIN groups g ON g.id = gi.group_id
    	WHERE gi.invitee_id = ?
       		AND gi.status = 'pending'
	`, user.ID)
	if err != nil {
		help.JsonError(w, "DB error", 500, err)
		return
	}
	defer rows.Close()

	type invite struct {
		ID               string `json:"id"`
		GroupName        string `json:"group_name"`
		GroupPic         string `json:"group_pic"`
		Description      string `json:"description"`
		InvitationID     string `json:"invitation_id"`
		InvitationStatus string `json:"invitation_status"`
		Members          int    `json:"members"`
	}
	var list []invite
	for rows.Next() {
		var iv invite
		if err := rows.Scan(&iv.ID, &iv.GroupName, &iv.GroupPic,
			&iv.Description, &iv.InvitationID, &iv.InvitationStatus, &iv.Members); err != nil {
			help.JsonError(w, "scan", 500, err)
			return
		}
		list = append(list, iv)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}
