package server

import (
	"net/http"
	"time"

	auth "social-network/handlers/authentication"
	flw "social-network/handlers/follows"
	grps "social-network/handlers/groups"
	grpsD "social-network/handlers/groups/dashboard"
	grpsInvite "social-network/handlers/groups/invitations"
	grpsRequest "social-network/handlers/groups/joinRequests"
	grpsPost "social-network/handlers/groups/posts"
	hlp "social-network/handlers/helpers"
	mw "social-network/handlers/middlewares"
	grpevent "social-network/handlers/groups/events"
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

	// Groups-dashboard:
	mux.HandleFunc("/api/groups/owned", grpsD.GetOwnedGroups)
	mux.HandleFunc("/api/groups/joined", grpsD.GetJoinedGroups)
	mux.HandleFunc("/api/groups/available", grpsD.AvailableGroups)
	mux.HandleFunc("/api/groups/invitations", grpsD.Invitations)
	mux.HandleFunc("/api/groups/create", grps.CreateGroup)
	mux.HandleFunc("/api/groups/join-request", grpsRequest.JoinRequest)
	mux.HandleFunc("/api/groups/accept-invitation", grpsInvite.AcceptInvitation)
	mux.HandleFunc("/api/groups/refuse-invitation", grpsInvite.RefuseInvitation)
	// Groups:
	mux.HandleFunc("/api/groups/is-member", grps.IsGroupMember)
	mux.HandleFunc("/api/groups/groupInfo", grps.GetGroupInfo)
	mux.HandleFunc("/api/groups/invite", grpsInvite.InviteFollowers)
	mux.HandleFunc("/api/groups/requests", grpsRequest.ListJoinRequests)
	mux.HandleFunc("/api/groups/accept-request", grpsRequest.AcceptJoinRequest)
	mux.HandleFunc("/api/groups/refuse-request", grpsRequest.RefuseJoinRequest)
	// Groups posts:
	mux.HandleFunc("/api/groups/posts", grpsPost.GroupPosts)
	mux.HandleFunc("/api/groups/create-post", grpsPost.CreateGroupPost)
	// Groups ws/chat:
	mux.HandleFunc("/api/groups/chat", grps.ChatPage)
	mux.HandleFunc("/api/ws", grps.GlobalWS)	
	// Group Events:
	mux.HandleFunc("/api/groups/create-event", grpevent.CreateEvent)
	mux.HandleFunc("/api/groups/get-events", grpevent.GetEvents)
	mux.HandleFunc("/api/groups/event-response", grpevent.EventResponse)
	// comments / groups comments
	mux.HandleFunc("/api/get-comments", grpsPost.GetComments)
	mux.HandleFunc("/api/create-comment", grpsPost.CreateComment)

	// Followers search:
	mux.HandleFunc("/api/followers", flw.GetFollowers)

	return mw.EnableCORS(mw.SecureHeaders(mux))
}
