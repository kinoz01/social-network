package groups

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// get all group members to show in menu
func GetMembers(w http.ResponseWriter, r *http.Request) {
	
	gid := r.URL.Query().Get("group_id")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	q := strings.TrimSpace(r.URL.Query().Get("q"))
	like := q + "%"

	rows, err := tp.DB.Query(`
	  SELECT u.id, u.first_name, u.last_name, u.profile_pic,
	         CASE WHEN g.group_owner = u.id THEN 1 ELSE 0 END AS is_owner -- assign owner when found
	  FROM   group_users gu
	  JOIN   users  u ON u.id = gu.users_id
	  JOIN   groups g ON g.id = gu.group_id
	  WHERE  gu.group_id = ?
	    AND  ( ? = '' OR      -- if q is empty skip the filtering
	           u.first_name LIKE ? COLLATE NOCASE OR
	           u.last_name  LIKE ? COLLATE NOCASE OR
	           u.username   LIKE ? COLLATE NOCASE OR
			   (u.first_name || ' ' || u.last_name) LIKE ? COLLATE NOCASE)
	  ORDER  BY is_owner DESC, u.first_name  -- owner at top
	  LIMIT  ? OFFSET ?`, gid, q, like, like, like, like, limit, offset)
	if err != nil {
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	type member struct {
		ID         string `json:"id"`
		FirstName  string `json:"first_name"`
		LastName   string `json:"last_name"`
		ProfilePic string `json:"profile_pic"`
		IsOwner    bool   `json:"isOwner"`
	}

	list := make([]member, 0, limit)
	var img sql.NullString
	for rows.Next() {
		var m member
		if err := rows.Scan(&m.ID, &m.FirstName, &m.LastName,
			&img, &m.IsOwner); err != nil {
			help.JsonError(w, "scan error", http.StatusInternalServerError, err)
			return
		}
		if img.Valid {
			m.ProfilePic = img.String
		}
		list = append(list, m)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}
