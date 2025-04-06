package mw

import "net/http"

// Secure Headers Middleware.
func SecureHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Security-Policy", "script-src 'self';") // For XSS attacks
		w.Header().Set("X-Frame-Options", "DENY")                       // For clickjacking
		w.Header().Set("X-Content-Type-Options", "nosniff")             // For MIME sniffing
		next.ServeHTTP(w, r)
	})
}

// CORS Middleware
func EnableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")            // Allow frontend
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE, PUT") // Allow Http methods
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")     // Allowed headers
		w.Header().Set("Access-Control-Allow-Credentials", "true")                        // Allow cookies & tokens

		// Allow Preflight Requests (sent before some methods (eg. PUT, POST))
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
