package mw

import "net/http"

// CORS Middleware
func EnableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		// Allow only specific origins
		if origin == "http://localhost:3000" || origin == "https://snet.fly.dev" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin") //- Do not reuse a cached version of this response unless the Origin header is exactly the same.
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
		w.Header().Set("Content-Security-Policy", "script-src 'self';") //- only allow scripts from the same origin serving html, and also prevent inline scripts
		w.Header().Set("X-Frame-Options", "DENY")                       //- Blocks iframe embedding (clickjacking)
		w.Header().Set("X-Content-Type-Options", "nosniff")             //- browser don't guess the content type. Only rely on Content-Type header.
		next.ServeHTTP(w, r)
	}
}
