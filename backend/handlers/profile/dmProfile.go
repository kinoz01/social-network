package profile

import (
	"database/sql"
	"encoding/json"
	"net/http"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

func GetDMProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		help.JsonError(w, "method not allowed", http.StatusMethodNotAllowed, nil)
		return
	}

	u, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "user not found", http.StatusUnauthorized, nil)
		return
	}

	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		help.JsonError(w, "missing user_id", http.StatusBadRequest, nil)
		return
	}

	var fn, ln, pic, accType sql.NullString
	err = tp.DB.QueryRow(`
        SELECT first_name, last_name, profile_pic, account_type
        FROM users
        WHERE id = ?
    `, userID).Scan(&fn, &ln, &pic, &accType)
	if err == sql.ErrNoRows {
		help.JsonError(w, "user not found", http.StatusNotFound, nil)
		return
	}
	if err != nil {
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}

	if accType.String == "private" {
		var count int
		err = tp.DB.QueryRow(`
            SELECT COUNT(*)
            FROM follow_requests
            WHERE status = 'accepted' AND (
                (follower_id = ? AND followed_id = ?) OR
                (follower_id = ? AND followed_id = ?)
            )
        `, u.ID, userID, userID, u.ID).Scan(&count)
		if err != nil {
			help.JsonError(w, "db error", http.StatusInternalServerError, err)
			return
		}
		if count == 0 {
			help.JsonError(w, "user not found", http.StatusNotFound, nil)
			return
		}
	}

	resp := map[string]string{
		"first_name":  fn.String,
		"last_name":   ln.String,
		"profile_pic": pic.String,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
