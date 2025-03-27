package handlers

import (
	"fmt"
	"net/http"
	"time"

	"social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

type CheckUser struct {
	Exists bool `json:"exists"`
}

// Checks whether the user has a valid session.
func CheckSession(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		helpers.JsonError(w, "Only GET method is allowed!", http.StatusMethodNotAllowed, nil)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	user, err := GetUser(r)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprintf(w, `{"loggedIn": false}`)
		return
	}
	fmt.Fprintf(w, `{"loggedIn": true, "username": %q, "profile_pic": %q}`, user.Username, user.ProfilePic)
}

// Get the user from the current session using cookies.
func GetUser(r *http.Request) (*tp.User, error) {
	cookie, err := r.Cookie("session_token")
	if err != nil {
		return nil, fmt.Errorf("no session token provided")
	}

	token := cookie.Value
	var session struct {
		UserID    int
		ExpiresAt time.Time
	}

	// Select user_id, expires_at from DB based on token value.
	err = tp.DB.QueryRow(`SELECT user_id, expires_at FROM sessions WHERE token = ?`, token).Scan(&session.UserID, &session.ExpiresAt)
	if err != nil {
		return nil, fmt.Errorf("invalid or expired session token")
	}

	// Check if the session is expired.
	if time.Now().After(session.ExpiresAt) {
		return nil, fmt.Errorf("session expired")
	}

	// Fetch the user associated with the session from DB
	var user tp.User
	err = tp.DB.QueryRow(`SELECT id, email, username, profile_pic FROM users WHERE id = ?`, session.UserID).Scan(&user.ID, &user.Email, &user.Username, &user.ProfilePic)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	return &user, nil
}
