package follows

import (
	"encoding/json"
	"net/http"
	"strings"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// GET /api/followers get followers of the current user by a search query.
func GetFollowersHandler(w http.ResponseWriter, r *http.Request) {
	/* ---------- current user ---------- */
	user, err := auth.GetUser(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	/* ---------- query params ---------- */
	status := r.URL.Query().Get("status")
	switch status {
	case "pending", "rejected", "accepted":
		// keep as‑is
	default:
		status = "accepted"
	}

	q := strings.TrimSpace(r.URL.Query().Get("query")) // search text

	/* ---------- build SQL Query ---------- */
	base := `
		SELECT u.id, u.first_name, u.last_name, u.profile_pic
		FROM follow_requests f
		JOIN users u ON u.id = f.follower_id
		WHERE f.followed_id = ? AND f.status = ?`

	args := []any{user.ID, status}

	if q != "" {
		base += ` AND (
			   u.first_name LIKE ? COLLATE NOCASE OR
			   u.last_name  LIKE ? COLLATE NOCASE OR
			   u.username   LIKE ? COLLATE NOCASE
			)`
		pattern := "%" + q + "%"
		args = append(args, pattern, pattern, pattern)
	}

	base += ` ORDER BY u.first_name, u.last_name`

	rows, err := tp.DB.Query(base, args...)
	if err != nil {
		help.JsonError(w, "Database error", http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	type follower struct {
		ID         string `json:"id"`
		FirstName  string `json:"first_name"`
		LastName   string `json:"last_name"`
		ProfilePic string `json:"profile_pic"`
	}

	var list []follower
	for rows.Next() {
		var f follower
		if err := rows.Scan(&f.ID, &f.FirstName, &f.LastName, &f.ProfilePic); err != nil {
			help.JsonError(w, "Scan error", http.StatusInternalServerError, err)
			return
		}
		list = append(list, f)
	}

	/* ---- no follower matched the query ---- */
	if len(list) == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound) // 404
		json.NewEncoder(w).Encode(map[string]string{
			"msg": "User not found",
		})
		return
	}

	/* ---- success ---- */
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}
