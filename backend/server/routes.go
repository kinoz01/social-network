package server

import (
	"net/http"
	"time"

	auth "social-network/handlers/authentication"
	flw "social-network/handlers/follows"
	grps "social-network/handlers/groups"
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
	mux.HandleFunc("/api/groups/create", grps.CreateGroupHandler)
	mux.HandleFunc("/api/groups/owned", grps.GetOwnedGroups)
	mux.HandleFunc("/api/groups/joined", grps.GetJoinedGroups)
	mux.HandleFunc("/api/groups/available", grps.AvailableGroupsHandler)
	mux.HandleFunc("/api/groups/join-request", grps.JoinRequestHandler)
	mux.HandleFunc("/api/groups/accept-invitation", grps.AcceptInvitationHandler)
	mux.HandleFunc("/api/groups/refuse-invitation", grps.RefuseInvitationHandler)
	mux.HandleFunc("/api/groups/invitations", grps.InvitationsHandler)
	// Groups:
	mux.HandleFunc("/api/groups/is-member", grps.IsGroupMember)
	mux.HandleFunc("/api/groups/groupInfo", grps.GetGroupInfoHandler)

	// Following:
	mux.HandleFunc("/api/followers", flw.GetFollowersHandler)

	return mw.EnableCORS(mw.SecureHeaders(mux))
}
