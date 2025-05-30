package server

import (
	"net/http"
	"social-network/handlers/posts"
	"social-network/handlers/users"
	"time"

	auth "social-network/handlers/authentication"
	hlp "social-network/handlers/helpers"
	mw "social-network/handlers/middlewares"

	cmnts "social-network/handlers/comments"
	flw "social-network/handlers/follows"
	grps "social-network/handlers/groups"
	grpsD "social-network/handlers/groups/dashboard"
	grpevent "social-network/handlers/groups/events"
	grpsInvite "social-network/handlers/groups/invitations"
	grpsRequest "social-network/handlers/groups/joinRequests"
	grpsPost "social-network/handlers/groups/posts"
	nots "social-network/handlers/notifications"
	ws "social-network/handlers/websocket"
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

	// posts
	mux.Handle("/api/createPost", rl.RateLimitMW(http.HandlerFunc(posts.CreatPosts)))
	mux.Handle("/api/allPosts/", rl.RateLimitMW(http.HandlerFunc(posts.AllPosts)))

	// comments
	mux.Handle("/api/addcomment", rl.RateLimitMW(http.HandlerFunc(cmnts.AddComment)))
	mux.Handle("/api/comments", rl.RateLimitMW(http.HandlerFunc(cmnts.GetComments)))

	// reactions
	mux.Handle("/api/react", rl.RateLimitMW(http.HandlerFunc(posts.HandleLike)))

	// Groups-dashboard:
	mux.HandleFunc("/api/groups/owned", grpsD.GetOwnedGroups)
	mux.HandleFunc("/api/groups/joined", grpsD.GetJoinedGroups)
	mux.HandleFunc("/api/groups/available", grpsD.AvailableGroups)
	mux.HandleFunc("/api/groups/invitations", grpsD.Invitations)
	mux.Handle("/api/groups/create", rl.RateLimitMW(http.HandlerFunc(grps.CreateGroup)))
	mux.Handle("/api/groups/join-request", rl.RateLimitMW(http.HandlerFunc(grpsRequest.JoinRequest)))
	mux.Handle("/api/groups/accept-invitation", rl.RateLimitMW(http.HandlerFunc(grpsInvite.AcceptInvitation)))
	mux.Handle("/api/groups/refuse-invitation", rl.RateLimitMW(http.HandlerFunc(grpsInvite.RefuseInvitation)))
	// Groups:
	mux.Handle("/api/groups/is-member", rl.RateLimitMW(http.HandlerFunc(grps.IsGroupMember)))
	mux.Handle("/api/groups/groupInfo", rl.RateLimitMW(mw.Gm(http.HandlerFunc(grps.GetGroupInfo))))
	mux.Handle("/api/groups/invite", rl.RateLimitMW(mw.Gm(http.HandlerFunc(grpsInvite.InviteFollowers))))
	mux.Handle("/api/groups/requests", rl.RateLimitMW(mw.Gm(http.HandlerFunc(grpsRequest.ListJoinRequests))))
	mux.Handle("/api/groups/accept-request", rl.RateLimitMW(http.HandlerFunc(grpsRequest.AcceptJoinRequest)))
	mux.Handle("/api/groups/refuse-request", rl.RateLimitMW(http.HandlerFunc(grpsRequest.RefuseJoinRequest)))
	// Groups posts:
	mux.Handle("/api/groups/posts", rl.RateLimitMW(mw.Gm(http.HandlerFunc(grpsPost.GroupPosts))))
	mux.Handle("/api/groups/create-post", rl.RateLimitMW(mw.Gm(http.HandlerFunc(grpsPost.CreateGroupPost))))
	// Groups Rest Chat:
	mux.Handle("/api/groups/chat", rl.RateLimitMW(mw.Gm(http.HandlerFunc(grps.ChatPage))))
	// Group Events:
	mux.Handle("/api/groups/create-event", rl.RateLimitMW(mw.Gm(http.HandlerFunc(grpevent.CreateEvent))))
	mux.Handle("/api/groups/get-events", rl.RateLimitMW(mw.Gm(http.HandlerFunc(grpevent.GetEvents))))
	mux.Handle("/api/groups/event-response", rl.RateLimitMW(mw.Gm(http.HandlerFunc(grpevent.EventResponse))))

	// Followers search:
	// mux.HandleFunc("/api/followers", flw.GetFollowers)
	// Following:
	mux.HandleFunc("/api/followers/search", flw.SearchFollowersHandler)
	mux.HandleFunc("/api/followers/info", flw.FollowerInfoHandler)
	mux.HandleFunc("/api/followers/isfollowed", flw.IsFollwedHandler)
	mux.HandleFunc("/api/followers/add", flw.AddFollowRequest)
	mux.HandleFunc("/api/followers/requests", flw.GetFollowingRequestsHandler)
	mux.HandleFunc("/api/suggestions", flw.GetSuggestionsHandler)
	mux.HandleFunc("/api/followers", flw.GetFollowersHandler)
	mux.HandleFunc("/api/followings", flw.GetFollowingsHandler)

	// Notifications:
	mux.HandleFunc("/api/notifications/friendRequest", nots.FriendRequestHandler)
	mux.HandleFunc("/api/notifications", nots.NotificationsHandler)

	// image server

	// Websocket
	mux.HandleFunc("/api/ws", ws.GlobalWS)

	return mw.EnableCORS(mw.SecureHeaders(mux))
}

// package server

// import (
// 	"net/http"
// 	"time"

// 	auth "social-network/handlers/authentication"
// 	flw "social-network/handlers/follows"
// 	grps "social-network/handlers/groups"
// 	grpsD "social-network/handlers/groups/dashboard"
// 	grpsInvite "social-network/handlers/groups/invitations"
// 	grpsRequest "social-network/handlers/groups/joinRequests"
// 	grpsPost "social-network/handlers/groups/posts"
// 	hlp "social-network/handlers/helpers"
// 	mw "social-network/handlers/middlewares"
// 	nots "social-network/handlers/notifications"
// )

// var Router http.Handler

// // Application routes.
// func Routes() http.Handler {
// 	mux := http.NewServeMux()

// 	// Allow 1 request per 20(x) microsecond
// 	rl := mw.NewRateLimiter(20 * time.Microsecond)

// 	// Serving storage
// 	mux.HandleFunc("/api/storage/", hlp.FilesHandler)

// 	// Authentication:
// 	mux.HandleFunc("/api/check-session", auth.CheckSession)
// 	mux.Handle("/api/signup", rl.RateLimitMW(http.HandlerFunc(auth.SignUpHandler)))
// 	mux.Handle("/api/login", rl.RateLimitMW(http.HandlerFunc(auth.LoginHandler)))
// 	mux.Handle("/api/logout", rl.RateLimitMW(http.HandlerFunc(auth.LogoutHandler)))
// 	mux.HandleFunc("/api/userInfo", auth.GetUserHandler)

// 	// Groups-dashboard:
// 	mux.HandleFunc("/api/groups/owned", grpsD.GetOwnedGroups)
// 	mux.HandleFunc("/api/groups/joined", grpsD.GetJoinedGroups)
// 	mux.HandleFunc("/api/groups/available", grpsD.AvailableGroupsHandler)
// 	mux.HandleFunc("/api/groups/invitations", grpsD.InvitationsHandler)
// 	mux.HandleFunc("/api/groups/create", grps.CreateGroupHandler)
// 	mux.HandleFunc("/api/groups/join-request", grpsRequest.JoinRequestHandler)
// 	mux.HandleFunc("/api/groups/accept-invitation", grpsInvite.AcceptInvitationHandler)
// 	mux.HandleFunc("/api/groups/refuse-invitation", grpsInvite.RefuseInvitationHandler)

// 	// Groups:
// 	mux.HandleFunc("/api/groups/is-member", grps.IsGroupMember)
// 	mux.HandleFunc("/api/groups/groupInfo", grps.GetGroupInfoHandler)
// 	mux.HandleFunc("/api/groups/invite", grpsInvite.InviteFollowersHandler)
// 	mux.HandleFunc("/api/groups/requests", grpsRequest.ListJoinRequestsHandler)
// 	mux.HandleFunc("/api/groups/accept-request", grpsRequest.AcceptJoinRequestHandler)
// 	mux.HandleFunc("/api/groups/refuse-request", grpsRequest.RefuseJoinRequestHandler)

// 	// Groups posts:
// 	mux.HandleFunc("/api/groups/posts", grpsPost.GroupPostsHandler)
// 	mux.HandleFunc("/api/groups/create-post", grpsPost.CreatePostHandler)
// 	mux.HandleFunc("/api/groups/chat", grps.ChatPage)
// 	mux.HandleFunc("/api/groups/comments", grpsPost.GetCommentsHandler)
// 	mux.HandleFunc("/api/groups/create-comment", grpsPost.CreateCommentHandler)
// 	mux.HandleFunc("/api/ws", grps.GlobalWS)

// 	// Following:
// 	mux.HandleFunc("/api/followers/search", flw.GetFollowersHandler)
// 	mux.HandleFunc("/api/followers/info", flw.FollowerInfoHandler)
// 	mux.HandleFunc("/api/followers/requests/add", flw.FollowRequestHanlder)
// 	mux.HandleFunc("/api/followers/isfollowed", flw.IsFollwedHandler)
// 	mux.HandleFunc("/api/followers/add", flw.FollowingRequestHandler)
// 	mux.HandleFunc("/api/followers/requests", flw.FollowingRequestsHandler)
// 	mux.HandleFunc("/api/suggestions", flw.SuggestionsHandler)

// 	mux.HandleFunc("/api/followers", flw.FollowersHandler)
// 	mux.HandleFunc("/api/followings", flw.FollowingsHandler)

// 	// Notifications:
// 	mux.HandleFunc("/api/notifications/friendRequest", nots.FriendRequestHandler)
// 	mux.HandleFunc("/api/notifications", nots.NotificationsHandler)

// 	// image server

// 	return mw.EnableCORS(mw.SecureHeaders(mux))
// }
