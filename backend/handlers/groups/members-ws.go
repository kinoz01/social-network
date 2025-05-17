// handlers/ws_global.go
package groups

import (
	"encoding/json"
	"net/http"
	"sync"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"

	"github.com/gorilla/websocket"
)

/*──────────── types sent to client ───────────*/
type wsMember struct {
	ID         string `json:"id"`
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	ProfilePic string `json:"profile_pic"`
	IsOnline   bool   `json:"isOnline"`
}

/*──────────── global state ───────────*/
type client struct {
	userID string
	conn   *websocket.Conn
	mu     sync.Mutex
	// groups this client cares about
	subs map[string]bool
}

var (
	clients      = make(map[*client]bool) // all live sockets
	clientsMu    sync.RWMutex
	onlineCounts = make(map[string]int) // userID → open-socket count
)

/*──────────── upgrader ───────────*/
var upgrader = websocket.Upgrader{
	CheckOrigin: func(*http.Request) bool { return true }, // TODO tighten
}

/*──────────── entry point ───────────*/
// GET /ws
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
	cl := &client{userID: u.ID, conn: conn, subs: make(map[string]bool)}

	/* register */
	clientsMu.Lock()
	clients[cl] = true
	onlineCounts[u.ID]++
	clientsMu.Unlock()
	broadcastOnlineStatus()

	/* initial read loop */
	for {
		_, raw, err := conn.ReadMessage()
		if err != nil {
			break
		}
		handleMessage(cl, raw)
	}

	/* cleanup */
	clientsMu.Lock()
	delete(clients, cl)
	if onlineCounts[u.ID]--; onlineCounts[u.ID] == 0 {
		delete(onlineCounts, u.ID)
	}
	clientsMu.Unlock()
	broadcastOnlineStatus()
	conn.Close()
}

/*──────────── inbound msg router ───────────*/
type incoming struct {
	Type    string `json:"type"`
	GroupID string `json:"groupId,omitempty"`
}

func handleMessage(c *client, raw []byte) {
	var msg incoming
	if err := json.Unmarshal(raw, &msg); err != nil {
		return
	}
	switch msg.Type {
	case "subscribeGroup":
		c.mu.Lock()
		c.subs[msg.GroupID] = true
		c.mu.Unlock()
		sendGroupSnapshot(c, msg.GroupID)
	}
}

/*──────────── snapshots ───────────*/
func sendGroupSnapshot(c *client, gid string) {
	members, err := buildMembers(gid)
	if err != nil {
		return
	}
	out := map[string]any{
		"type":    "groupMembers",
		"groupId": gid,
		"members": members,
	}
	c.mu.Lock()
	_ = c.conn.WriteJSON(out)
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

	var list []wsMember
	for rows.Next() {
		var id, fn, ln, pic string
		if err := rows.Scan(&id, &fn, &ln, &pic); err != nil {
			return nil, err
		}
		list = append(list, wsMember{
			ID:         id,
			FirstName:  fn,
			LastName:   ln,
			ProfilePic: pic,
			IsOnline:   onlineCounts[id] > 0,
		})
	}
	return list, nil
}

/*──────────── online broadcast ───────────*/
func broadcastOnlineStatus() {
	clientsMu.RLock()
	defer clientsMu.RUnlock()

	var ids []string
	for id := range onlineCounts {
		ids = append(ids, id)
	}

	payload := map[string]any{
		"type":  "onlineStatus",
		"users": ids,
	}

	for cl := range clients {
		cl.mu.Lock()
		_ = cl.conn.WriteJSON(payload)
		cl.mu.Unlock()

		// refresh any group snapshots this client is subscribed to
		for gid := range cl.subs {
			sendGroupSnapshot(cl, gid)
		}
	}
}
