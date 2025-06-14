package profile

import (
	"encoding/json"
	"net/http"

	auth "social-network/handlers/authentication"
	Error "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

type Resp struct {
	AccountType string `json:"account_type"`
}

func ChangeStatu(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserId(r)
	if err != nil {
		Error.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
		return
	}

	var curr string
	if err := tp.DB.QueryRow(`SELECT account_type FROM users WHERE id = ?`, userID).
		Scan(&curr); err != nil {
		Error.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}

	newStatus := "private"
	if curr == "private" {
		newStatus = "public"
	}

	if _, err := tp.DB.Exec(`
		UPDATE users
		   SET account_type = ?
		 WHERE id = ?`, newStatus, userID); err != nil {
		Error.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}

	/* JSON reply for the React code */
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(Resp{AccountType: newStatus})
}
