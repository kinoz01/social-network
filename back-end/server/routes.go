package server

import (
	"net/http"
	"time"

	auth "social-network/handlers/authentication"
	mw "social-network/handlers/middlewares"
)

var Router http.Handler

// Application routes.
func Routes() http.Handler {
	mux := http.NewServeMux()

	// Allow 1 request per 20(x) microsecond
	rl := mw.NewRateLimiter(20 * time.Microsecond)

	mux.HandleFunc("/api/check-session", auth.CheckSession)
	mux.Handle("/api/signup", rl.RateLimitMW(http.HandlerFunc(auth.SignUpHandler)))
	mux.Handle("/api/login", rl.RateLimitMW(http.HandlerFunc(auth.LoginHandler)))

	return mw.EnableCORS(mw.SecureHeaders(mux))
}
