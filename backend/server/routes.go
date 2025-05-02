package server

import (
	"net/http"
	"time"

	auth "social-network/handlers/authentication"
	grps "social-network/handlers/groups"
	flw "social-network/handlers/follows"
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

	// Groups:
	mux.HandleFunc("/api/groups/create", grps.CreateGroupHandler)
	mux.HandleFunc("/api/groups/owned", grps.GetOwnedGroups)
	mux.HandleFunc("/api/groups/joined", grps.GetJoinedGroups)
	mux.HandleFunc("/api/groups/available", grps.GetAvailableGroups)
	
	// Following:
	mux.HandleFunc("/api/followers", flw.GetFollowersHandler)

	return mw.EnableCORS(mw.SecureHeaders(mux))
}
