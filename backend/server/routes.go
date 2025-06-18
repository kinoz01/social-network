package server

import (
	"net/http"
	"time"

	"social-network/handlers/posts"
	"social-network/handlers/users"

	auth "social-network/handlers/authentication"
	hlp "social-network/handlers/helpers"
	mw "social-network/handlers/middlewares"

	"social-network/handlers/chat"
	cmnts "social-network/handlers/comments"
	flw "social-network/handlers/follows"
	grps "social-network/handlers/groups"
	grpsD "social-network/handlers/groups/dashboard"
	grpevent "social-network/handlers/groups/events"
	grpsInvite "social-network/handlers/groups/invitations"
	grpsRequest "social-network/handlers/groups/joinRequests"
	notif "social-network/handlers/notifications"
	"social-network/handlers/profile"
	ws "social-network/handlers/websocket"
)

var Router http.Handler

// Application routes.
func Routes() http.Handler {
	mux := http.NewServeMux()

	// Allow 1 request per 20(x) microsecond
	rl := mw.NewRateLimiter(20 * time.Microsecond)

	// Serving storage
	mux.Handle("/api/storage/", mw.GetMW(hlp.FilesHandler))

	// Authentication:
	mux.Handle("/api/check-session", mw.GetMW(auth.CheckSession))
	mux.Handle("/api/userInfo", mw.GetMW(auth.GetUserHandler))
	mux.Handle("/api/signup", rl.RateLimitMW(mw.PostMW(auth.SignUpHandler)))
	mux.Handle("/api/login", rl.RateLimitMW(mw.PostMW(auth.LoginHandler)))
	mux.Handle("/api/logout", rl.RateLimitMW(mw.PostMW(auth.LogoutHandler)))
	mux.Handle("/api/users/search", mw.GetMW(users.SearchUsers))

	// posts
	mux.Handle("/api/createPost", rl.RateLimitMW(mw.PostMW(posts.CreatPosts)))
	mux.Handle("/api/allPosts/", mw.GetMW(posts.AllPosts))

	// comments
	mux.Handle("/api/addcomment", rl.RateLimitMW(mw.PostMW(cmnts.AddComment)))
	mux.Handle("/api/comments", mw.GetMW(cmnts.GetComments))

	// comment reactions
	mux.Handle("/api/comment/like", rl.RateLimitMW(mw.PostMW(cmnts.HandleCommentLike)))
	// post reactions
	mux.Handle("/api/react", rl.RateLimitMW(mw.PostMW(posts.HandleLike)))

	// Groups-dashboard:
	mux.Handle("/api/groups/owned", mw.GetMW(grpsD.GetOwnedGroups))
	mux.Handle("/api/groups/joined", mw.GetMW(grpsD.GetJoinedGroups))
	mux.Handle("/api/groups/available", mw.GetMW(grpsD.AvailableGroups))
	mux.Handle("/api/groups/invitations", mw.GetMW(grpsD.Invitations))
	mux.Handle("/api/groups/create", rl.RateLimitMW(mw.PostMW(grps.CreateGroup)))
	mux.Handle("/api/groups/join-request", rl.RateLimitMW(mw.PostMW(grpsRequest.JoinRequest)))
	mux.Handle("/api/groups/accept-invitation", rl.RateLimitMW(mw.PostMW(grpsInvite.AcceptInvitation)))
	mux.Handle("/api/groups/refuse-invitation", rl.RateLimitMW(mw.PostMW(grpsInvite.RefuseInvitation)))
	// Groups:
	mux.Handle("/api/groups/is-member", mw.GetMW(grps.IsGroupMember))
	mux.Handle("/api/groups/groupInfo", mw.GetMW(mw.Gm(grps.GetGroupInfo)))
	mux.Handle("/api/groups/invite", rl.RateLimitMW(mw.Gm(mw.PostMW(grpsInvite.InviteFollowers))))
	mux.Handle("/api/groups/requests", mw.Gm(grpsRequest.ListJoinRequests))
	mux.Handle("/api/groups/accept-request", rl.RateLimitMW(mw.PostMW(grpsRequest.AcceptJoinRequest)))
	mux.Handle("/api/groups/refuse-request", rl.RateLimitMW(mw.PostMW(grpsRequest.RefuseJoinRequest)))
	// Groups create post:
	mux.Handle("/api/groups/create-post", rl.RateLimitMW(mw.Gm(mw.PostMW(grps.CreateGroupPost))))
	// Groups Rest Chat:
	mux.Handle("/api/groups/chat", mw.GetMW(mw.Gm(grps.ChatPage)))
	// Group Events:
	mux.Handle("/api/groups/create-event", rl.RateLimitMW(mw.Gm(mw.PostMW(grpevent.CreateEvent))))
	mux.Handle("/api/groups/get-events", mw.GetMW(mw.Gm(grpevent.GetEvents)))
	mux.Handle("/api/groups/event-response", rl.RateLimitMW(mw.Gm(mw.PostMW(grpevent.EventResponse))))
	// Restful members menu:
	mux.Handle("/api/groups/members", mw.GetMW(mw.Gm(grps.GetMembers)))

	// CHAT
	// Chat menu:
	mux.Handle("/api/chat/list", mw.GetMW(chat.GetChatList))
	mux.Handle("/api/users/dmprofiles", mw.GetMW(chat.GetDMProfile))
	// Chat Rest DMs
	mux.Handle("/api/chat/messages", mw.GetMW(chat.GetPrivateMessages))
	mux.Handle("/api/chat/dm-list", mw.GetMW(chat.ChatDMList))
	mux.Handle("/api/chat/mark-read", rl.RateLimitMW(mw.PostMW(chat.ChatMarkRead)))
	mux.Handle("/api/chat/unread-summary", mw.GetMW(chat.GetUnreadSummary))

	// Notifications:
	mux.HandleFunc("/api/delete-notification", notif.DeleteNotification)
	mux.HandleFunc("/api/clear-notifications", notif.ClearAllNotifications)
	mux.Handle("/api/notifications/totalcount", mw.GetMW(notif.NotificationsCount))

	// Following:
	mux.Handle("/api/suggestions", mw.GetMW(flw.SuggestionsHandler))
	mux.Handle("/api/followers/isfollowed", mw.GetMW(flw.IsFollwedHandler))
	mux.Handle("/api/followers/requests", mw.GetMW(flw.GetFollowingRequestsHandler))
	mux.Handle("/api/getfollows", mw.GetMW(flw.GetFollowsHandler))
	mux.Handle("/api/followers/add", rl.RateLimitMW(mw.PostMW(flw.AddFollowRequest)))
	// search followers
	mux.Handle("/api/followers/search", mw.GetMW(flw.SearchFollowers))

	// Profiles:
	// mux.Handle("/api/users/profilesInfo", mw.GetMW(profile.ProfileData))
	// mux.Handle("/api/handleAccountStatu", rl.RateLimitMW(mw.PostMW(profile.ChangeStatu)))
	mux.HandleFunc("/api/profileData/", profile.ProfileData)
	mux.HandleFunc("/api/profilePosts/", profile.GetPosts)
	mux.HandleFunc("/api/handleAccountStatu/", profile.ChangeStatu)

	// Websocket
	mux.Handle("/api/ws", mw.GetMW(ws.GlobalWS))

	return mw.EnableCORS(mw.SecureHeaders(mux))
}
