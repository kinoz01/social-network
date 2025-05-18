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
	mux.HandleFunc("/api/groups/available", grpsD.AvailableGroupsHandler)
	mux.HandleFunc("/api/groups/invitations", grpsD.InvitationsHandler)
	mux.HandleFunc("/api/groups/create", grps.CreateGroupHandler)
	mux.HandleFunc("/api/groups/join-request", grpsRequest.JoinRequestHandler)
	mux.HandleFunc("/api/groups/accept-invitation", grpsInvite.AcceptInvitationHandler)
	mux.HandleFunc("/api/groups/refuse-invitation", grpsInvite.RefuseInvitationHandler)
	// Groups:
	mux.HandleFunc("/api/groups/is-member", grps.IsGroupMember)
	mux.HandleFunc("/api/groups/groupInfo", grps.GetGroupInfoHandler)
	mux.HandleFunc("/api/groups/members", grps.MembersListHandler)
	mux.HandleFunc("/api/groups/invite", grpsInvite.InviteFollowersHandler)
	mux.HandleFunc("/api/groups/requests", grpsRequest.ListJoinRequestsHandler)
	mux.HandleFunc("/api/groups/accept-request", grpsRequest.AcceptJoinRequestHandler)
	mux.HandleFunc("/api/groups/refuse-request", grpsRequest.RefuseJoinRequestHandler)
	// Groups posts:
	mux.HandleFunc("/api/groups/posts", grpsPost.GroupPostsHandler)
	mux.HandleFunc("/api/groups/create-post", grpsPost.CreatePostHandler)
	mux.HandleFunc("/api/groups/chat", grps.ChatPage)
	mux.HandleFunc("/api/groups/comments", grpsPost.GetCommentsHandler)
	mux.HandleFunc("/api/groups/create-comment", grpsPost.CreateCommentHandler)
	mux.HandleFunc("/api/ws", grps.GlobalWS)	

	// Following:
	mux.HandleFunc("/api/followers", flw.GetFollowersHandler)

	return mw.EnableCORS(mw.SecureHeaders(mux))
}
