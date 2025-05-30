package groups

import (
	"encoding/json"
	"net/http"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// Select groups that the user is a member of.
func GetJoinedGroups(w http.ResponseWriter, r *http.Request) {
	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
		return
	}

	rows, err := tp.DB.Query(`
    	SELECT g.id, g.group_name, g.group_pic, g.description
    	FROM groups g
    	INNER JOIN group_users gu ON g.id = gu.group_id
    	WHERE gu.users_id = ? AND g.group_owner != ?
	`, user.ID, user.ID)
	if err != nil {
		help.JsonError(w, "Database error", http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	var groups []tp.Group
	for rows.Next() {
		var g tp.Group
		if err := rows.Scan(&g.ID, &g.GroupName, &g.GroupPic, &g.Description); err != nil {
			continue
		}
		g.Members = CountGroupMembers(g.ID)
		groups = append(groups, g)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(groups)
}
