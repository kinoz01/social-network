package server

import (
	"net/http"

	auth "social-network/handlers/authentication"
	mw "social-network/handlers/middlewares"
)

var Router http.Handler

// Application routes.
func Routes() http.Handler {
	mux := http.NewServeMux()

	// Rate limiters, prevent spam and DoS attacks.
	// Allow 1 request per 20(x) microsecond
	// rl := NewRateLimiter(20 * time.Microsecond)
	mux.HandleFunc("/api/check-session", auth.CheckSession)

	return mw.SecureHeaders(mux)
}
