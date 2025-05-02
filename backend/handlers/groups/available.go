package groups

import (
	"encoding/json"
	"net/http"

	auth "social-network/handlers/authentication"
	tp "social-network/handlers/types"
)

func GetAvailableGroups(w http.ResponseWriter, r *http.Request) {
	user, err := auth.GetUser(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	query := `
        SELECT g.id, g.groups_name, g.group_pic, g.description,
            COALESCE(gr.status, '') as request
        FROM groups g
        LEFT JOIN group_requests gr ON g.id = gr.group_id AND gr.user_id = ?
        WHERE g.group_owner != ?
          AND g.id NOT IN (
              SELECT group_id FROM group_users WHERE users_id = ?
              UNION
              SELECT group_id FROM group_invitations WHERE user_id = ?
          )
    `

	rows, err := tp.DB.Query(query, user.ID, user.ID, user.ID, user.ID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var groups []tp.Group
	for rows.Next() {
		var g tp.Group
		if err := rows.Scan(&g.ID, &g.GroupName, &g.GroupPic, &g.Description, &g.Request); err != nil {
			http.Error(w, "Scan error", http.StatusInternalServerError)
			return
		}
		groups = append(groups, g)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(groups)
}
