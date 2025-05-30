package mw

import (
	"net/http"

	auth "social-network/handlers/authentication"
	"social-network/handlers/helpers"
	tp "social-network/handlers/types"

)

func Gm(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, err := auth.GetUser(r)
		if err != nil {
			helpers.JsonError(w, "unauthorized", http.StatusUnauthorized, err)
			return
		}

		groupID := r.URL.Query().Get("group_id")
		if groupID == "" {
			helpers.JsonError(w, "missing group id", http.StatusBadRequest, nil)
			return
		}

		var ok bool
		if err := tp.DB.QueryRow(`
	    SELECT EXISTS(SELECT 1 FROM group_users
	                  WHERE group_id=? AND users_id=?)`,
			groupID, user.ID).Scan(&ok); err != nil || !ok {
			helpers.JsonError(w, "forbidden", http.StatusForbidden, nil)
			return
		}

		next(w, r)
	}
}
