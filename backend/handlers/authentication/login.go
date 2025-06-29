package auth

import (
	"encoding/json"
	"net/http"

	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"

	"golang.org/x/crypto/bcrypt"
)

// Handle Log In functionality
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var creds struct {
		Login    string `json:"login"`
		Password string `json:"password"`
	}

	// Limit the size of the readable request body to 30 KB.
	r.Body = http.MaxBytesReader(w, r.Body, 30000)

	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		help.JsonError(w, "Invalid request payload or size exceeded", http.StatusBadRequest, err)
		return
	}

	var user tp.User
	row := tp.DB.QueryRow(`SELECT id, email, username, password FROM users WHERE email = ?`, creds.Login)
	err := row.Scan(&user.ID, &user.Email, &user.Username, &user.Password)
	if err != nil {
		help.JsonError(w, "Invalid credentials.", http.StatusUnauthorized, err)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(creds.Password)); err != nil {
		help.JsonError(w, "Invalid Password.", http.StatusUnauthorized, err)
		return
	}

	if err = CreateSession(w, &user); err != nil {
		help.JsonError(w, "Error creating user session.", http.StatusInternalServerError, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"username": user.Username,
	})
}
