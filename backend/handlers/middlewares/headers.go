package mw

import "net/http"

// CORS Middleware
func EnableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		// Allow only specific origins
		if origin == "http://localhost:3000" || origin == "https://snet.fly.dev" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin") // for caching proxies
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE, PUT") // Allow Http methods
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")     // Allowed headers
		w.Header().Set("Access-Control-Allow-Credentials", "true")                        // Allow cookies & tokens

		// Handle preflight requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}

// Secure Headers Middleware.
func SecureHeaders(next http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Security-Policy", "script-src 'self';") // For XSS attacks (only alllow scripts from the same origin serving html)
		w.Header().Set("X-Frame-Options", "DENY")                       // For clickjacking (prevent from clickjacking - embedding website)
		w.Header().Set("X-Content-Type-Options", "nosniff")             // For MIME sniffing
		next.ServeHTTP(w, r)
	}
}
