package users

import (
	"encoding/json"
	"net/http"

	usersDB "social-network/database/repositories/db_users"
	"social-network/handlers/helpers"
)

func GetUsersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		helpers.JsonError(w, "methos not allowed", http.StatusMethodNotAllowed, nil)
		return
	}

	users, err := usersDB.GetAllUsers()
	if err != nil {
		helpers.JsonError(w, err.Error(), http.StatusInternalServerError, nil)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(users); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
	}
	// fmt.Println("USERSList⭐", users)
}
