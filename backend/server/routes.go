package server

import (
	"net/http"
	"time"

	auth "social-network/handlers/authentication"
	hlp "social-network/handlers/helpers"
	mw "social-network/handlers/middlewares"
	chat "social-network/handlers/chat"
)

var Router http.Handler

// Application routes.
func Routes() http.Handler {
	mux := http.NewServeMux()

	// Allow 1 request per 20(x) microsecond
	rl := mw.NewRateLimiter(20 * time.Microsecond)

	// Serving storage
	mux.HandleFunc("/api/storage/", hlp.FilesHandler)

	//chatApp
	mux.HandleFunc("/api/fetchUsers", chat.FetchUsers)
	mux.HandleFunc("ws://localhost:8080/ws", chat.HandleConnection)

	// Authentication:
	mux.HandleFunc("/api/check-session", auth.CheckSession)
	mux.Handle("/api/signup", rl.RateLimitMW(http.HandlerFunc(auth.SignUpHandler)))
	mux.Handle("/api/login", rl.RateLimitMW(http.HandlerFunc(auth.LoginHandler)))

	return mw.EnableCORS(mw.SecureHeaders(mux))
}
