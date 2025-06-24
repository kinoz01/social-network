package chat

import (
	"database/sql"
	"encoding/json"
	"net/http"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// Get user profile info (fn, ln and pic) to show in chat box.
func GetDMProfile(w http.ResponseWriter, r *http.Request) {
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

	var fn, ln, pic string
	err = tp.DB.QueryRow(`
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

	var count int

	err = tp.DB.QueryRow(`
		SELECT COUNT(*)
			FROM follow_requests
			WHERE status = 'accepted'
			  	AND (
			        (follower_id = ? AND followed_id = ?)  -- you → them
			    OR (follower_id = ? AND followed_id = ?)  -- them → you
			);
		`, u.ID, userID, userID, u.ID,
		u.ID, userID, userID, u.ID).Scan(&count)
	if err != nil {
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}
	if count == 0 {
		help.JsonError(w, "user not found", http.StatusNotFound, nil)
		return
	}

	resp := map[string]string{
		"first_name":  fn,
		"last_name":   ln,
		"profile_pic": pic,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
