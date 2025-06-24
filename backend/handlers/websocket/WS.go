package websocket

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	notif "social-network/handlers/notifications"
	tp "social-network/handlers/types"

	"github.com/gofrs/uuid"
	"github.com/gorilla/websocket"
)

/*────────── Payload structs ─────────*/

type wsMember struct {
	ID         string `json:"id"`
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	ProfilePic string `json:"profile_pic"`
	IsOnline   bool   `json:"isOnline"`
}

type ChatMsg struct {
	ID         string    `json:"id"`
	SenderID   string    `json:"sender_id"`
	ReceiverID string    `json:"receiver_id,omitempty"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"created_at"`
	FirstName  string    `json:"first_name"`
	LastName   string    `json:"last_name"`
	ProfilePic string    `json:"profile_pic"`
	Type       string    `json:"type"` // "dmMessage" or "groupChatMessage"
	GroupID    string    `json:"group_id,omitempty"`
}

/*────────── client & hubs ─────────*/
type client struct {
	userID string
	conn   *websocket.Conn
	mu     sync.Mutex
}

var (
	clients      = make(map[*client]bool)
	clientsMu    sync.RWMutex
	onlineCounts = make(map[string]int)

	chatHubs = struct {
		m  map[string]map[*client]bool
		mu sync.RWMutex
	}{m: make(map[string]map[*client]bool)}
)

/*────────── Upgrader ─────────*/
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		return origin == "http://localhost:3000" || origin == "https://snet.fly.dev"
	},
}

/*────────── Incoming message ─────────*/
type inbound struct {
	Type    string `json:"type"`
	PeerID  string `json:"peerId,omitempty"`
	GroupID string `json:"groupId,omitempty"`
	Content string `json:"content,omitempty"`

	Page  int `json:"page,omitempty"`
	Limit int `json:"limit,omitempty"`

	Notification tp.Notification `json:"notification"`
}

/*────────── Entry point (upgrade) ─────────*/

func GlobalWS(w http.ResponseWriter, r *http.Request) {
	u, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauthenticated", http.StatusUnauthorized, err)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	cl := &client{
		userID: u.ID,
		conn:   conn,
	}

	clientsMu.Lock()
	clients[cl] = true
	onlineCounts[u.ID]++
	clientsMu.Unlock()
	broadcastOnlineStatus()

	for {
		_, raw, err := conn.ReadMessage()
		if err != nil {
			break
		}
		handleMessage(cl, raw, u)
	}

	clientsMu.Lock()
	delete(clients, cl)
	if onlineCounts[u.ID]--; onlineCounts[u.ID] == 0 {
		delete(onlineCounts, u.ID)
	}
	clientsMu.Unlock()

	chatHubs.mu.Lock()
	for _, set := range chatHubs.m {
		delete(set, cl)
	}
	chatHubs.mu.Unlock()

	broadcastOnlineStatus()
	conn.Close()
}

/*────────── Router ─────────*/

func handleMessage(c *client, raw []byte, u *tp.User) {
	var msg inbound
	if err := json.Unmarshal(raw, &msg); err != nil {
		return
	}

	switch msg.Type {

	case "getGroupMembers":
		sendGroupSnapshot(c, msg.GroupID)

	case "subscribeChat":
		chatHubs.mu.Lock()
		if _, ok := chatHubs.m[msg.GroupID]; !ok {
			chatHubs.m[msg.GroupID] = make(map[*client]bool)
		}
		chatHubs.m[msg.GroupID][c] = true
		chatHubs.mu.Unlock()
		sendChatHistory(c, msg.GroupID)

	case "groupChatMessage":
		if msg.Content == "" || len(msg.Content) > 500 {
			return
		}
		m := storeAndBuildGroupMessage(msg.GroupID, u, msg.Content)
		broadcastGroupChat(msg.GroupID, m)

	case "dmMessage":
		if msg.Content == "" {
			return
		}
		m := storeAndBuildDM(u.ID, msg.PeerID, msg.Content)
		broadcastDM(m.ReceiverID, m)

	case "getNotifications":
		sendNotificationList(c, u, msg, "getNotifications")
	}
}

/*────────── Broadcast online status ─────────*/

func broadcastOnlineStatus() {
	clientsMu.RLock()
	defer clientsMu.RUnlock()

	ids := make([]string, 0, len(onlineCounts))
	for id := range onlineCounts {
		ids = append(ids, id)
	}
	payload := map[string]any{"type": "onlineStatus", "users": ids}

	for cl := range clients {
		cl.mu.Lock()
		_ = cl.conn.WriteJSON(payload)
		cl.mu.Unlock()
	}
}

/*────────── Group chat logic ─────────*/
func sendGroupSnapshot(c *client, gid string) {
	members, err := buildMembers(gid)
	if err != nil {
		return
	}
	payload := map[string]any{
		"type":    "groupMembers",
		"groupId": gid,
		"members": members,
	}
	c.mu.Lock()
	_ = c.conn.WriteJSON(payload)
	c.mu.Unlock()
}

func buildMembers(gid string) ([]wsMember, error) {
	rows, err := tp.DB.Query(`
	  SELECT u.id, u.first_name, u.last_name, u.profile_pic
	  FROM group_users gu
	  JOIN users u ON u.id = gu.users_id
	  WHERE gu.group_id = ?`, gid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	clientsMu.RLock()
	defer clientsMu.RUnlock()

	var out []wsMember
	for rows.Next() {
		var id, fn, ln, pic string
		rows.Scan(&id, &fn, &ln, &pic)
		isOn := onlineCounts[id] > 0
		out = append(out, wsMember{
			ID:         id,
			FirstName:  fn,
			LastName:   ln,
			ProfilePic: pic,
			IsOnline:   isOn,
		})
	}
	return out, nil
}

func sendChatHistory(c *client, gid string) {
	rows, _ := tp.DB.Query(`
	  SELECT gc.id, gc.content, gc.created_at,
	         u.id, u.first_name, u.last_name, u.profile_pic
	  FROM group_chats gc
	  JOIN users u ON u.id = gc.sender_id
	  WHERE gc.group_id = ?
	  ORDER BY gc.created_at DESC, gc.ROWID DESC
	  LIMIT 20`, gid)
	defer rows.Close()

	var hist []ChatMsg
	for rows.Next() {
		var m ChatMsg
		rows.Scan(
			&m.ID,
			&m.Content,
			&m.CreatedAt,
			&m.SenderID,
			&m.FirstName,
			&m.LastName,
			&m.ProfilePic,
		)
		hist = append([]ChatMsg{m}, hist...)
	}
	c.mu.Lock()
	_ = c.conn.WriteJSON(map[string]any{
		"type":     "chatHistory",
		"groupId":  gid,
		"messages": hist,
	})
	c.mu.Unlock()
}

func storeAndBuildGroupMessage(gid string, u *tp.User, content string) ChatMsg {
	id := uuid.Must(uuid.NewV4()).String()
	tp.DB.Exec(`INSERT INTO group_chats(id, group_id, sender_id, content) VALUES(?,?,?,?)`,
		id, gid, u.ID, content)
	return ChatMsg{
		ID:         id,
		SenderID:   u.ID,
		Content:    content,
		CreatedAt:  time.Now(),
		FirstName:  u.FirstName,
		LastName:   u.LastName,
		ProfilePic: u.ProfilePic,
		Type:       "groupChatMessage",
		GroupID:    gid,
	}
}

func broadcastGroupChat(gid string, m ChatMsg) {
	payload := map[string]any{"type": "groupChatMessage", "groupId": gid, "message": m}
	chatHubs.mu.RLock()
	defer chatHubs.mu.RUnlock()
	for cl := range chatHubs.m[gid] {
		cl.mu.Lock()
		_ = cl.conn.WriteJSON(payload)
		cl.mu.Unlock()
	}
}

/*────────── DM logic (simplified) ─────────*/

func storeAndBuildDM(senderID, receiverID, content string) ChatMsg {
	id := uuid.Must(uuid.NewV4()).String()
	tp.DB.Exec(`INSERT INTO private_chats(id, sender_id, receiver_id, content) VALUES(?,?,?,?)`,
		id, senderID, receiverID, content)

	var fn, ln, pic string
	_ = tp.DB.QueryRow(`SELECT first_name, last_name, profile_pic FROM users WHERE id = ?`,
		senderID).Scan(&fn, &ln, &pic)

	return ChatMsg{
		ID:         id,
		SenderID:   senderID,
		ReceiverID: receiverID,
		Content:    content,
		CreatedAt:  time.Now(),
		FirstName:  fn,
		LastName:   ln,
		ProfilePic: pic,
		Type:       "dmMessage",
	}
}

func broadcastDM(receiverID string, m ChatMsg) {
	payload := map[string]any{"type": "dmMessage", "message": m}

	clientsMu.RLock()
	for cl := range clients {
		if cl.userID == m.SenderID || cl.userID == receiverID {
			cl.mu.Lock()
			_ = cl.conn.WriteJSON(payload)
			cl.mu.Unlock()
		}
	}
	clientsMu.RUnlock()
}

/*────────── Notifications (untouched) ─────────*/

func BroadcastNotification(n tp.Notification) {
	if err := notif.AddNotification(n); err != nil {
		return
	}
	payload := map[string]any{
		"type":         "notification",
		"notification": n,
	}

	clientsMu.RLock()
	for cl := range clients {
		if cl.userID == n.Receiver {
			cl.mu.Lock()
			_ = cl.conn.WriteJSON(payload)
			cl.mu.Unlock()
		}
	}
	clientsMu.RUnlock()
}

func sendNotificationList(c *client, u *tp.User, msg inbound, msgType string) {
	notifs, err := notif.GetNotifications(u.ID, msg.Limit, msg.Page)
	if err != nil {
		return
	}
	if notifs.Notifications == nil {
		notifs.Notifications = make([]*tp.Notification, 0)
	}
	payload := map[string]any{
		"type":          msgType,
		"notifications": notifs.Notifications,
		"totalCount":    notifs.TotalCount,
		"totalPages":    notifs.TotalPages,
	}
	c.mu.Lock()
	_ = c.conn.WriteJSON(payload)
	c.mu.Unlock()
}
