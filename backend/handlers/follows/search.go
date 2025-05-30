package follows

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// GET /api/followers get followers of the current user by a search query.
func SearchFollowersHandler(w http.ResponseWriter, r *http.Request) {
	/* ---------- current user ---------- */
	user, err := auth.GetUser(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	q := strings.TrimSpace(r.URL.Query().Get("query")) // search text
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	/* ---------- build SQL Query ---------- */
	base := `
    SELECT u.id, u.first_name, u.last_name, u.profile_pic
      FROM follow_requests f
      JOIN users u ON u.id = f.follower_id
     WHERE f.followed_id = ? AND f.status = 'accepted'`

	args := []any{user.ID}

	if q != "" {
		/* match columns that START with the query */
		base += ` AND (
            u.first_name LIKE ? COLLATE NOCASE OR
            u.last_name  LIKE ? COLLATE NOCASE OR
            u.username   LIKE ? COLLATE NOCASE OR
			(u.first_name || ' ' || u.last_name) LIKE ? COLLATE NOCASE
        )`
		pattern := q + "%" //  ← prefix-only match
		args = append(args, pattern, pattern, pattern, pattern)
	}

	base += ` ORDER BY u.first_name, u.last_name LIMIT ? OFFSET ?`
	args = append(args, limit, offset)

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
		w.WriteHeader(http.StatusNoContent)
		json.NewEncoder(w).Encode(map[string]string{
			"msg": "User not found",
		})
		return
	}

	/* ---- success ---- */
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}
