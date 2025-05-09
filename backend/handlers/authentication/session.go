package auth

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"social-network/handlers/helpers"
	tp "social-network/handlers/types"

	"github.com/gofrs/uuid"
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
		UserID    string
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
	err = tp.DB.QueryRow(`
  		SELECT id, email, username, first_name, last_name, birthday, profile_pic, about_me, account_type
  		FROM users
  		WHERE id = ?`,
		session.UserID,
	).Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.FirstName,
		&user.LastName,
		&user.Bday,
		&user.ProfilePic,
		&user.AboutMe,
		&user.AccountType,
	)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	return &user, nil
}

// Create session token (cookie) and insert it into DB.
func CreateSession(w http.ResponseWriter, user *tp.User) error {
	tokenuuid, err := uuid.NewV4()
	if err != nil {
		return err
	}
	token := tokenuuid.String()

	// Set token expiration time.
	expiresAt := time.Now().Add(24 * time.Hour)

	// Limit concurrent sessions to only one per user
	_, err = tp.DB.Exec(`DELETE FROM sessions WHERE user_id = ?`, user.ID)
	if err != nil {
		return err
	}

	// Insert session into DB.
	_, err = tp.DB.Exec(`INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)`, user.ID, token, expiresAt)
	if err != nil {
		return err
	}

	// Set the token in a cookie
	cookie := &http.Cookie{
		Name:     "session_token",
		Value:    token,
		Expires:  expiresAt,
		HttpOnly: true,
		Path:     "/",
	}

	http.SetCookie(w, cookie)
	return nil
}

// API for fetching the logged-in user's information
func GetUserHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		helpers.JsonError(w, "Method not allowed", http.StatusMethodNotAllowed, nil)
		return
	}

	user, err := GetUser(r)
	if err != nil {
		helpers.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
