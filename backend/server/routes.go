package server

import (
	"net/http"
	"time"

	auth "social-network/handlers/authentication"
	comment "social-network/handlers/comments"
	profile "social-network/handlers/profile"
	"social-network/handlers/posts"
	"social-network/handlers/users"

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

	// posts
	mux.Handle("/api/createPost", rl.RateLimitMW(http.HandlerFunc(posts.CreatPosts)))
	mux.Handle("/api/allPosts/", rl.RateLimitMW(http.HandlerFunc(posts.AllPosts)))
	mux.Handle("/api/allUsers", rl.RateLimitMW(http.HandlerFunc(users.GetUsersHandler)))
	mux.HandleFunc("/api/addcomment", comment.AddComment)
	mux.HandleFunc("/api/comments", comment.GetComments)
	mux.HandleFunc("/api/profile", profile.GetDateFollow)

	return mw.EnableCORS(mw.SecureHeaders(mux))
}
