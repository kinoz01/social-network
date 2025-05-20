package mw

import (
	"net/http"
	"social-network/handlers/helpers"
	"sync"
	"time"
)

// Server's rate limiter struct.
type RateLimiter struct {
	visitors map[string]time.Time
	mu       sync.Mutex
	interval time.Duration
}

// Rate limiter constructor.
func NewRateLimiter(interval time.Duration) *RateLimiter {
	return &RateLimiter{
		visitors: make(map[string]time.Time),
		interval: interval,
	}
}

// Allows a request based on the rate limit
func (rl *RateLimiter) Allow(clientIP string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	lastRequest, exists := rl.visitors[clientIP]

	// Allow if not in map or request outside interval
	if !exists || now.Sub(lastRequest) > rl.interval {
		rl.visitors[clientIP] = now
		return true
	}
	// Deny otherwise
	return false
}

// Middleware for rate limiting
func (rl *RateLimiter) RateLimitMW(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		clientIP := r.RemoteAddr
		if !rl.Allow(clientIP) {
			helpers.JsonError(w, "Request could not be processed.", http.StatusServiceUnavailable, nil)
			return
		}
		next.ServeHTTP(w, r)
	})
}
