package groups

import (
	"encoding/json"
	"net/http"

	auth "social-network/handlers/authentication"
	tp "social-network/handlers/types"
)

// Retrieves the groups owned by the current user.
func GetOwnedGroups(w http.ResponseWriter, r *http.Request) {
	user, err := auth.GetUser(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := tp.DB.Query(`
        SELECT id, group_name, group_pic, description
        FROM groups
        WHERE group_owner = ?
        ORDER BY created_at DESC
    `, user.ID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
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

// Retrieves the number of members in a group.
func CountGroupMembers(groupID string) int {
	var count int
	tp.DB.QueryRow(`SELECT COUNT(*) FROM group_users WHERE group_id = ?`, groupID).Scan(&count)
	return count
}
