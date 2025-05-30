package groups

import (
	"net/http"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

func IsGroupMember(w http.ResponseWriter, r *http.Request) {
	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauth", 401, err)
		return
	}

	gid := r.URL.Query().Get("id")
	if gid == "" {
		help.JsonError(w, "bad request", 400, nil)
		return
	}

	var exists int
	err = tp.DB.QueryRow(`
		SELECT 1 FROM group_users
		WHERE group_id = ? AND users_id = ? LIMIT 1`, gid, user.ID).Scan(&exists)
	if err != nil {
		help.JsonError(w, "forbidden", 403, err) // not a member
		return
	}

	w.WriteHeader(http.StatusOK)
}
