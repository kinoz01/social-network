package users

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

func SearchUsers(w http.ResponseWriter, r *http.Request) {
	// 1) auth
	me, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauthorized", http.StatusUnauthorized, err)
		return
	}

	// 2) params
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit == 0 {
		limit = 50
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	q := strings.TrimSpace(r.URL.Query().Get("q"))

	if q == "" {
		// no query → nothing to return
		w.WriteHeader(http.StatusNoContent)
		return
	}

	// 3) base SQL (no privacy filter, only exclude self)
	base := `
	  SELECT u.id,
	         u.first_name,
	         u.last_name,
	         u.profile_pic,
	         EXISTS (
	           SELECT 1 FROM follow_requests fr
	           WHERE fr.follower_id = ? AND fr.followed_id = u.id
	             AND fr.status = 'accepted'
	         ) AS i_follow,
	         EXISTS (
	           SELECT 1 FROM follow_requests fr
	           WHERE fr.follower_id = u.id AND fr.followed_id = ?
	             AND fr.status = 'accepted'
	         ) AS follows_me
	    FROM users u
	   WHERE u.id <> ?            -- exclude self
	     AND (
	       u.first_name   LIKE ? COLLATE NOCASE OR
	       u.last_name    LIKE ? COLLATE NOCASE OR
	       u.username     LIKE ? COLLATE NOCASE OR
	       (u.first_name || ' ' || u.last_name) LIKE ? COLLATE NOCASE
	     )
	   ORDER BY u.first_name
	   LIMIT ? OFFSET ?
	`
	pattern := q + "%"
	args := []any{
		me.ID, me.ID, me.ID, // three ? before the LIKEs
		pattern, pattern, pattern, pattern,
		limit, offset,
	}

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

	list := make([]person, 0)
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
	if len(list) == 0 {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}
