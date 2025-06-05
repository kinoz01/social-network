package server

import (
	"net/http"
	"social-network/handlers/posts"
	"social-network/handlers/users"
	"time"

	auth "social-network/handlers/authentication"
	ch "social-network/handlers/chat"
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

	//chatApp
	mux.HandleFunc("/api/fetchUsers", chat.FetchUsers)
	mux.HandleFunc("/ws", chat.HandleConnection)

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
	mux.Handle("/api/comment/like", rl.RateLimitMW(http.HandlerFunc(cmnts.HandleCommentLike)))
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
	mux.Handle("/api/groups/groupInfo", rl.RateLimitMW(http.HandlerFunc(grps.GetGroupInfo)))
	mux.Handle("/api/groups/invite", rl.RateLimitMW(http.HandlerFunc( grpsInvite.InviteFollowers)))
	mux.Handle("/api/groups/requests", rl.RateLimitMW(http.HandlerFunc(grpsRequest.ListJoinRequests)))
	mux.Handle("/api/groups/accept-request", rl.RateLimitMW(http.HandlerFunc(grpsRequest.AcceptJoinRequest)))
	mux.Handle("/api/groups/refuse-request", rl.RateLimitMW(http.HandlerFunc(grpsRequest.RefuseJoinRequest)))
	// Groups posts:
	mux.Handle("/api/groups/posts", rl.RateLimitMW(http.HandlerFunc(grpsPost.GroupPosts)))
	mux.Handle("/api/groups/create-post", rl.RateLimitMW(http.HandlerFunc(grpsPost.CreateGroupPost)))
	// Groups Rest Chat:
	mux.Handle("/api/groups/chat", rl.RateLimitMW(http.HandlerFunc(grps.ChatPage)))
	// Group Events:
	mux.Handle("/api/groups/create-event", rl.RateLimitMW(http.HandlerFunc(grpevent.CreateEvent)))
	mux.Handle("/api/groups/get-events", rl.RateLimitMW(http.HandlerFunc(grpevent.GetEvents)))
	mux.Handle("/api/groups/event-response", rl.RateLimitMW(http.HandlerFunc(grpevent.EventResponse)))
	// Restful members menu:
	mux.HandleFunc("/api/groups/members", grps.GetMembers)


	// Followers search:
	mux.HandleFunc("/api/followers", flw.GetFollowers)

	// Websocket
	mux.HandleFunc("/api/ws", ws.GlobalWS)

	//Getting users Data
	mux.HandleFunc("/api/fetchUsers", ch.FetchUsers)
	mux.HandleFunc("/api/fetchMessages", ch.FetchMessages)

	//Fetching Followers
	mux.HandleFunc("/api/followers", ch.FetchFollowers)

	//WebSocket Connection
	mux.HandleFunc("/ws", ch.HandleConnection)

	//Getting users Data
	mux.HandleFunc("/api/fetchUsers", ch.FetchUsers)
	mux.HandleFunc("/api/fetchMessages", ch.FetchMessages)

	//Fetching Followers
	mux.HandleFunc("/api/followers", ch.FetchFollowers)

	//WebSocket Connection
	mux.HandleFunc("/ws", ch.HandleConnection)

	return mw.EnableCORS(mw.SecureHeaders(mux))
}
