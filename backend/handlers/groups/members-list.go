package groups

import (
	"encoding/json"
	"net/http"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

func MembersListHandler(w http.ResponseWriter, r *http.Request) {
	gid := r.URL.Query().Get("id")
	if gid == "" {
		help.JsonError(w, "missing id", http.StatusBadRequest, nil)
		return
	}

	/* guard: requester must be a member of this group */
	if usr, err := auth.GetUser(r); err == nil {
		var ok bool
		if err := tp.DB.QueryRow(`
		  SELECT EXISTS(
		      SELECT 1 FROM group_users
		       WHERE group_id = ? AND users_id = ?)`,
			gid, usr.ID).Scan(&ok); err != nil || !ok {
			help.JsonError(w, "forbidden", http.StatusForbidden, nil)
			return
		}
	}

	rows, err := tp.DB.Query(`
	  SELECT u.id, u.first_name, u.last_name, u.profile_pic
	    FROM group_users gu
	    JOIN users u ON u.id = gu.users_id
	   WHERE gu.group_id = ?
	   ORDER BY u.first_name, u.last_name`, gid)
	if err != nil {
		help.JsonError(w, "DB error", http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	type mem struct {
		ID         string `json:"id"`
		FirstName  string `json:"first_name"`
		LastName   string `json:"last_name"`
		ProfilePic string `json:"profile_pic"`
	}
	var list []mem
	for rows.Next() {
		var m mem
		if err := rows.Scan(&m.ID, &m.FirstName, &m.LastName, &m.ProfilePic); err != nil {
			help.JsonError(w, "scan", http.StatusInternalServerError, err)
			return
		}
		list = append(list, m)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}
