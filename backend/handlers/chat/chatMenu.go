package chat

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

/*
Route:  GET /api/people/explore
Query:

	q         (optional search string)
	limit     (default 50)
	offset    (default 0)

Returns 200 + []Person or 204 when no rows.
A “person” is shown when:
  - their account is PUBLIC   OR
  - viewer follows them       OR
  - they follow the viewer
*/
func GetChatList(w http.ResponseWriter, r *http.Request) {
	// ── viewer ──────────────────────────────────────────────────────────────
	u, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauthorized", http.StatusUnauthorized, err)
		return
	}

	// ── query params ────────────────────────────────────────────────────────
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit == 0 {
		limit = 50
	}
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	like := q + "%"

	// ── query ───────────────────────────────────────────────────────────────
	rows, err := tp.DB.Query(`
	  SELECT u.id, u.first_name, u.last_name, u.profile_pic,
	         EXISTS(SELECT 1 FROM follow_requests fr
	                  WHERE fr.follower_id = ? AND fr.followed_id = u.id
	                  AND   fr.status = 'accepted')      AS i_follow,
	         EXISTS(SELECT 1 FROM follow_requests fr
	                  WHERE fr.follower_id = u.id AND fr.followed_id = ?
	                  AND   fr.status = 'accepted')      AS follows_me
	  FROM   users u
	  WHERE  u.id <> ? -- exclude self
	    AND (
	          u.account_type = 'public'           OR
	          EXISTS(SELECT 1 FROM follow_requests fr
	                   WHERE fr.follower_id = ? AND fr.followed_id = u.id
	                   AND   fr.status = 'accepted')    OR
	          EXISTS(SELECT 1 FROM follow_requests fr
	                   WHERE fr.follower_id = u.id AND fr.followed_id = ?
	                   AND   fr.status = 'accepted')
	        )
	    AND (? = '' OR
	         u.first_name LIKE ? OR u.last_name LIKE ? OR u.username LIKE ?)
	  ORDER BY u.first_name
	  LIMIT  ? OFFSET ?`,
		u.ID, u.ID, u.ID, u.ID, u.ID,
		q, like, like, like,
		limit, offset)
	if err != nil {
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	type person struct {
		ID         string `json:"id"`
		FirstName  string `json:"first_name"`
		LastName   string `json:"last_name"`
		ProfilePic string `json:"profile_pic"`
		IFollow    bool   `json:"iFollow"`
		FollowsMe  bool   `json:"followsMe"`
	}

	var list []person
	var img sql.NullString
	for rows.Next() {
		var p person
		if err := rows.Scan(&p.ID, &p.FirstName, &p.LastName,
			&img, &p.IFollow, &p.FollowsMe); err != nil {
			help.JsonError(w, "scan error", 500, err)
			return
		}
		if img.Valid {
			p.ProfilePic = img.String
		}
		list = append(list, p)
	}

	if len(list) == 0 {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}
