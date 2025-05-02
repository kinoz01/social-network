package follows

import (
	"encoding/json"
	"net/http"
	"strconv"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// GET /api/followers get followers of the current user.
func GetFollowersHandler(w http.ResponseWriter, r *http.Request) {
	/* ---------- current user ---------- */
	user, err := auth.GetUser(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	/* ---------- query params ---------- */
	status := r.URL.Query().Get("status")
	if status != "pending" && status != "rejected" {
		status = "accepted" // fallback
	}
	offset := parseIntDefault(r.URL.Query().Get("offset"), 0)
	limit := parseIntDefault(r.URL.Query().Get("limit"), 100)

	/* ---------- DB query ---------- */
	rows, err := tp.DB.Query(`
		SELECT u.id, u.first_name, u.last_name, u.profile_pic
		FROM follow_requests f
		JOIN users u ON u.id = f.follower_id
		WHERE f.followed_id = ? AND f.status = ?
		LIMIT ? OFFSET ?`,
		user.ID, status, limit, offset)
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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

// correcting query params
func parseIntDefault(s string, def int) int {
	n, err := strconv.Atoi(s)
	if err != nil || n < 0 {
		return def
	}
	return n
}
