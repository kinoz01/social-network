package notifications

import (
	"net/http"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// delete a notification 
func DeleteNotification(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		help.JsonError(w, "method not allowed", http.StatusMethodNotAllowed, nil)
		return
	}

	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauthorized", http.StatusUnauthorized, err)
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		help.JsonError(w, "missing id", http.StatusBadRequest, nil)
		return
	}

	_, err = tp.DB.Exec(
		`DELETE FROM notifications
		  WHERE id = ? AND receiver_id = ?`, id, user.ID, // receiver check for safety
	)
	if err != nil {
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// delete all notifications
func ClearAllNotifications(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		help.JsonError(w, "method not allowed", http.StatusMethodNotAllowed, nil)
		return
	}

	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauthorized", http.StatusUnauthorized, err)
		return
	}

	if _, err := tp.DB.Exec(
		`DELETE FROM notifications WHERE receiver_id = ?`, user.ID,
	); err != nil {
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
