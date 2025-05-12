package server

import (
	"net/http"
	"time"

	auth "social-network/handlers/authentication"
	ch "social-network/handlers/chat"
	hlp "social-network/handlers/helpers"
	mw "social-network/handlers/middlewares"
)

var Router http.Handler

// Application routes.
func Routes() http.Handler {
	mux := http.NewServeMux()

	// Allow 1 request per 20(x) microsecond
	rl := mw.NewRateLimiter(20 * time.Microsecond)

	// Serving storage
	mux.HandleFunc("/api/storage/", hlp.FilesHandler)

	// Authentication:
	mux.HandleFunc("/api/check-session", auth.CheckSession)
	mux.Handle("/api/signup", rl.RateLimitMW(http.HandlerFunc(auth.SignUpHandler)))
	mux.Handle("/api/login", rl.RateLimitMW(http.HandlerFunc(auth.LoginHandler)))
	mux.Handle("/api/logout", rl.RateLimitMW(http.HandlerFunc(auth.LogoutHandler)))
	mux.HandleFunc("/api/userInfo", auth.GetUserHandler)

	//Getting users Data
	mux.HandleFunc("/api/fetchUsers", ch.FetchUsers)
	mux.HandleFunc("/api/fetchMessages", ch.FetchMessages)

	//WebSocket Connection
	mux.HandleFunc("/ws", ch.HandleConnection)

	return mw.EnableCORS(mw.SecureHeaders(mux))
}
