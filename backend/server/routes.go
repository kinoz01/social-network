package server

import (
	"net/http"
	"time"

	auth "social-network/handlers/authentication"
	"social-network/handlers/posts"
	"social-network/handlers/users"

	"social-network/handlers/comments"
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
	mux.Handle("/api/allUsers", rl.RateLimitMW(http.HandlerFunc(users.GetUsersHandler)))

	//posts
	mux.Handle("/api/createPost", rl.RateLimitMW(http.HandlerFunc(posts.CreatPosts)))
	mux.Handle("/api/allPosts/", rl.RateLimitMW(http.HandlerFunc(posts.AllPosts)))
	mux.Handle("/api/addcomment", rl.RateLimitMW(http.HandlerFunc(comments.AddComment)))
	mux.Handle("/api/getcomments", rl.RateLimitMW(http.HandlerFunc(comments.GetComments)))

	//reactions
	mux.Handle("/api/react", rl.RateLimitMW(http.HandlerFunc(posts.HandleLike)))

	return mw.EnableCORS(mw.SecureHeaders(mux))
}
