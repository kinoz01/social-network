package groups

import (
	"encoding/json"
	"net/http"

	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// GET /api/groups/info?id=<group-id>
func GetGroupInfoHandler(w http.ResponseWriter, r *http.Request) {
	gid := r.URL.Query().Get("id")
	if gid == "" {
		http.Error(w, "Missing id", http.StatusBadRequest)
		return
	}

	row := tp.DB.QueryRow(`
		SELECT g.id, g.group_name, g.description, g.group_pic,
		       (SELECT COUNT(*) FROM group_users WHERE group_id = g.id) AS members
		  FROM groups g
		 WHERE g.id = ?`, gid)

	var out tp.Group
	if err := row.Scan(&out.ID, &out.GroupName, &out.Description, &out.GroupPic, &out.Members); err != nil {
		help.JsonError(w, "Not found", http.StatusNotFound, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(out)
}
