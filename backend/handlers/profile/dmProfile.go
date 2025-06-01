package profile

import (
	"database/sql"
	"encoding/json"
	"net/http"

	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)


func GetDMProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		help.JsonError(w, "method not allowed", http.StatusMethodNotAllowed, nil)
		return
	}

	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		help.JsonError(w, "missing user_id", http.StatusBadRequest, nil)
		return
	}

	var fn, ln, pic sql.NullString
	err := tp.DB.QueryRow(`
        SELECT first_name, last_name, profile_pic
        FROM users
        WHERE id = ?
    `, userID).Scan(&fn, &ln, &pic)
	if err == sql.ErrNoRows {
		help.JsonError(w, "user not found", http.StatusNotFound, nil)
		return
	}
	if err != nil {
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}

	resp := map[string]string{
		"first_name":  fn.String,
		"last_name":   ln.String,
		"profile_pic": pic.String,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
