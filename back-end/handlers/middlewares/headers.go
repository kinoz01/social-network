package mw

import "net/http"

// Secure Headers Middleware.
func SecureHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Security-Policy", "script-src 'self';")                    // For XSS attacks
		w.Header().Set("X-Frame-Options", "DENY")                                          // For clickjacking
		w.Header().Set("X-Content-Type-Options", "nosniff")                                // For MIME sniffing
		next.ServeHTTP(w, r)
	})
}
