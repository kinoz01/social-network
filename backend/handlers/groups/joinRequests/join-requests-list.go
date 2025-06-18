package groups

import (
	"encoding/json"
	"net/http"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

type joinReq struct {
	ID         string `json:"id"`
	UserID     string `json:"user_id"`
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	ProfilePic string `json:"profile_pic"`
}

/* -------------------------------------------------------------------- */
/* GET /api/groups/requests?group_id=…  → only owner can call           */
/* -------------------------------------------------------------------- */
func ListJoinRequests(w http.ResponseWriter, r *http.Request) {
	userId, _ := auth.GetUserId(r)
	gid := r.URL.Query().Get("group_id")

	/* ensure caller is the owner */
	var ownerID string
	if err := tp.DB.QueryRow(`SELECT group_owner FROM groups WHERE id = ?`, gid).Scan(&ownerID); err != nil {
		help.JsonError(w, "Group not found", 404, err)
		return
	}
	if ownerID != userId {
		help.JsonError(w, "unauthorized", http.StatusNoContent, nil)
		return
	}

	rows, err := tp.DB.Query(`
	SELECT gr.id, u.id, u.first_name, u.last_name, u.profile_pic
	 	FROM group_requests gr
	  	JOIN users u ON u.id = gr.requester_id
		 	WHERE gr.group_id = ?
	   		AND gr.status = 'pending'`, gid)
	if err != nil {
		help.JsonError(w, "DB error", 500, err)
		return
	}
	defer rows.Close()

	var list []joinReq
	for rows.Next() {
		var jr joinReq
		if err := rows.Scan(&jr.ID, &jr.UserID, &jr.FirstName, &jr.LastName, &jr.ProfilePic); err != nil {
			help.JsonError(w, "scan", 500, err)
			return
		}
		list = append(list, jr)
	}
	json.NewEncoder(w).Encode(list)
}
