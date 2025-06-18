package notifications

import (
	"encoding/json"
	"net/http"

	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
	auth "social-network/handlers/authentication"
)

func NotificationsCount(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserId(r)
	if err != nil {
		help.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
		return
	}

	const q = `
		SELECT COUNT(*)
		FROM   notifications
		WHERE  receiver_id = ?
		  AND  is_read = 0;`
	var n int
	if err := tp.DB.QueryRow(q, userID).Scan(&n); err != nil {
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return 
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(struct {
		Count int `json:"count"`
	}{Count: n})
}
