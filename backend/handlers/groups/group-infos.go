package groups

import (
	"encoding/json"
	"net/http"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// GET /api/groups/info?id=<group-id>
func GetGroupInfo(w http.ResponseWriter, r *http.Request) {
	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
		return
	}

	gid := r.URL.Query().Get("id")
	if gid == "" {
		http.Error(w, "Missing id", http.StatusBadRequest)
		return
	}

	row := tp.DB.QueryRow(`
		SELECT g.id, g.group_name, g.description, g.group_pic, g.group_owner,
		       (SELECT COUNT(*) FROM group_users WHERE group_id = g.id) AS members
		  FROM groups g
		 WHERE g.id = ?`, gid)

	var out tp.Group
	var ownerID string

	if err := row.Scan(&out.ID, &out.GroupName, &out.Description, &out.GroupPic, &ownerID, &out.Members); err != nil {
		help.JsonError(w, "Not found", http.StatusNotFound, err)
		return
	}

	// Add isOwner field to response
	response := struct {
		tp.Group
		IsOwner bool `json:"isOwner"`
	}{
		Group:   out,
		IsOwner: user.ID == ownerID,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
