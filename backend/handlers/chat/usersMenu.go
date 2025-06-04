// handlers/chat/get_chat_list.go
package chat

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

/*
Route:  GET /api/chat/list
Query parameters:

	q       (optional search string)
	limit   (default 50)
	offset  (default 0)

Returns 200 + []Person or 204 when no rows.
A “person” is shown when:
  - their account is PUBLIC   OR
  - viewer follows them       OR
  - they follow the viewer
*/
func GetChatList(w http.ResponseWriter, r *http.Request) {
	// ── 1) Authenticate viewer ──────────────────────────────────────────────────────
	u, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauthorized", http.StatusUnauthorized, err)
		return
	}

	// ── 2) Parse query params ─────────────────────────────────────────────────────
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	q := strings.TrimSpace(r.URL.Query().Get("q"))

	// ── 3) Build base SQL & args slice ────────────────────────────────────────────
	//
	// We always filter out "self" (u.ID) and only show users who are either:
	//   • public account, OR
	//   • viewer follows them, OR
	//   • they follow the viewer
	//
	base := `
	  SELECT u.id,
	         u.first_name,
	         u.last_name,
	         u.profile_pic,
	         EXISTS(
	           SELECT 1
	             FROM follow_requests fr
	            WHERE fr.follower_id = ? AND fr.followed_id = u.id
	              AND fr.status = 'accepted'
	         ) AS i_follow,
	         EXISTS(
	           SELECT 1
	             FROM follow_requests fr
	            WHERE fr.follower_id = u.id AND fr.followed_id = ?
	              AND fr.status = 'accepted'
	         ) AS follows_me
	    FROM users u
	   WHERE u.id <> ?  -- exclude self
	     AND (
	       u.account_type = 'public'
	       OR EXISTS(
	         SELECT 1
	           FROM follow_requests fr
	          WHERE fr.follower_id = ? AND fr.followed_id = u.id
	            AND fr.status = 'accepted'
	       )
	       OR EXISTS(
	         SELECT 1
	           FROM follow_requests fr
	          WHERE fr.follower_id = u.id AND fr.followed_id = ?
	            AND fr.status = 'accepted'
	       )
	     )
	`
	// args for the four “?” above:
	//   1) check if viewer follows this user
	//   2) check if this user follows viewer
	//   3) exclude self
	//   4) (duplicate of 1) for the second EXISTS
	args := []any{u.ID, u.ID, u.ID, u.ID, u.ID}

	// ── 4) If q != "", append search clause ────────────────────────────────────────
	if q != "" {
		base += `
	     AND (
	       u.first_name   LIKE ? COLLATE NOCASE OR
	       u.last_name    LIKE ? COLLATE NOCASE OR
	       u.username     LIKE ? COLLATE NOCASE OR
	       (u.first_name || ' ' || u.last_name) LIKE ? COLLATE NOCASE
	     )
		`
		pattern := q + "%"
		args = append(args, pattern, pattern, pattern, pattern)
	}

	// ── 5) Append ORDER BY + LIMIT/OFFSET ────────────────────────────────────────
	base += `
	   ORDER BY u.first_name
	   LIMIT ? OFFSET ?
	`
	args = append(args, limit, offset)

	// ── 6) Execute query ───────────────────────────────────────────────────────────
	rows, err := tp.DB.Query(base, args...)
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
	for rows.Next() {
		var p person
		if err := rows.Scan(
			&p.ID,
			&p.FirstName,
			&p.LastName,
			&p.ProfilePic,
			&p.IFollow,
			&p.FollowsMe,
		); err != nil {
			help.JsonError(w, "scan error", http.StatusInternalServerError, err)
			return
		}
		list = append(list, p)
	}
	if err := rows.Err(); err != nil {
		help.JsonError(w, "rows iteration error", http.StatusInternalServerError, err)
		return
	}

	// ── 7) Return results ──────────────────────────────────────────────────────────
	if len(list) == 0 {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}
