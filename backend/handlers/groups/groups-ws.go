package groups

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"

	"github.com/gofrs/uuid"
	"github.com/gorilla/websocket"
)

/*────────── Payload structs ─────────*/
// sent for members snapshots
type wsMember struct {
	ID         string `json:"id"`
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	ProfilePic string `json:"profile_pic"`
	IsOnline   bool   `json:"isOnline"`
}

// chat message sent to clients
type chatMsg struct {
	ID         string    `json:"id"`
	GroupID    string    `json:"group_id"`
	SenderID   string    `json:"sender_id"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"created_at"`
	FirstName  string    `json:"first_name"`
	LastName   string    `json:"last_name"`
	ProfilePic string    `json:"profile_pic"`
}

/*────────── client & hubs ─────────*/
type client struct {
	userID string
	conn   *websocket.Conn
	mu     sync.Mutex
	subs   map[string]bool // member snapshots
	chats  map[string]bool // chat rooms joined
}

var (
	clients      = make(map[*client]bool) // every socket
	clientsMu    sync.RWMutex
	onlineCounts = make(map[string]int) // userID → open‑socket count

	// chat hubs: groupID → set of *client
	chatHubs = struct {
		m  map[string]map[*client]bool
		mu sync.RWMutex
	}{m: make(map[string]map[*client]bool)}
)

/*────────── Upgrader ─────────*/
var upgrader = websocket.Upgrader{CheckOrigin: func(*http.Request) bool { return true }}

/*────────── Incoming message ─────────*/
// client → server
type inbound struct {
	Type    string `json:"type"` // subscribeGroup | subscribeChat | groupChatMessage
	GroupID string `json:"groupId,omitempty"`
	Content string `json:"content,omitempty"`
}

/*────────── Entry point (upgrade) ─────────*/
// route:  GET  /api/ws
func GlobalWS(w http.ResponseWriter, r *http.Request) {
	u, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauth", 401, err)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	cl := &client{userID: u.ID, conn: conn, subs: make(map[string]bool), chats: make(map[string]bool)}

	// register globally
	clientsMu.Lock()
	clients[cl] = true
	onlineCounts[u.ID]++
	clientsMu.Unlock()
	broadcastOnlineStatus()

	// read‑pump
	for {
		_, raw, err := conn.ReadMessage()
		if err != nil {
			break
		}
		handleMessage(cl, raw, u)
	}

	// cleanup
	clientsMu.Lock()
	delete(clients, cl)
	if onlineCounts[u.ID]--; onlineCounts[u.ID] == 0 {
		delete(onlineCounts, u.ID)
	}
	clientsMu.Unlock()

	chatHubs.mu.Lock()
	for gid := range chatHubs.m {
		delete(chatHubs.m[gid], cl)
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
		c.mu.Lock()
		c.subs[msg.GroupID] = true
		c.mu.Unlock()
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
		m := storeAndBuildMessage(msg.GroupID, u, msg.Content)
		broadcastChat(msg.GroupID, m)
	}
}

/*────────── Member snapshots ─────────*/
func sendGroupSnapshot(c *client, gid string) {
	members, err := buildMembers(gid)
	if err != nil {
		return
	}
	payload := map[string]any{"type": "groupMembers", "groupId": gid, "members": members}
	c.mu.Lock()
	_ = c.conn.WriteJSON(payload)
	c.mu.Unlock()
}

func buildMembers(gid string) ([]wsMember, error) {
	rows, err := tp.DB.Query(`
        SELECT u.id, u.first_name, u.last_name, u.profile_pic
        FROM group_users gu JOIN users u ON u.id = gu.users_id
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
		out = append(out, wsMember{ID: id, FirstName: fn, LastName: ln, ProfilePic: pic, IsOnline: onlineCounts[id] > 0})
	}
	return out, nil
}

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
		// refresh snapshots too
		for gid := range cl.subs {
			sendGroupSnapshot(cl, gid)
		}
	}
}

/*────────── Chat helpers ─────────*/
func sendChatHistory(c *client, gid string) {
	rows, _ := tp.DB.Query(`
      SELECT gc.id, gc.content, gc.created_at,
             u.id, u.first_name, u.last_name, u.profile_pic
      FROM group_chats gc
      JOIN users u ON u.id = gc.sender_id
      WHERE gc.group_id = ?
      ORDER BY gc.created_at DESC LIMIT 20`, gid)
	defer rows.Close()

	var hist []chatMsg
	for rows.Next() {
		var m chatMsg
		rows.Scan(&m.ID, &m.Content, &m.CreatedAt,
			&m.SenderID, &m.FirstName, &m.LastName, &m.ProfilePic)
		hist = append([]chatMsg{m}, hist...) // reverse to ascending
	}
	c.mu.Lock()
	_ = c.conn.WriteJSON(map[string]any{
		"type": "chatHistory", "groupId": gid, "messages": hist,
	})
	c.mu.Unlock()
}

func storeAndBuildMessage(gid string, u *tp.User, content string) chatMsg {
	id := uuid.Must(uuid.NewV4()).String()
	tp.DB.Exec(`INSERT INTO group_chats(id, group_id, sender_id, content) VALUES(?,?,?,?)`, id, gid, u.ID, content)
	return chatMsg{ID: id, GroupID: gid, SenderID: u.ID, Content: content, CreatedAt: time.Now(), FirstName: u.FirstName, LastName: u.LastName, ProfilePic: u.ProfilePic}
}

func broadcastChat(gid string, m chatMsg) {
	payload := map[string]any{"type": "groupChatMessage", "groupId": gid, "message": m}
	chatHubs.mu.RLock()
	defer chatHubs.mu.RUnlock()
	for cl := range chatHubs.m[gid] {
		cl.mu.Lock()
		_ = cl.conn.WriteJSON(payload)
		cl.mu.Unlock()
	}
}
