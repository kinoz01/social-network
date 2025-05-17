// groups/ws_members.go
package groups

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"

	"github.com/gorilla/websocket"
)

/*
──────────────────────────────
 1. Payload

──────────────────────────────
*/
type wsMember struct {
	ID         string `json:"id"`
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	ProfilePic string `json:"profile_pic"`
	IsOnline   bool   `json:"isOnline"`
}

/*
──────────────────────────────
 2. Global presence map

──────────────────────────────
*/
var (
	onlineUsers   = make(map[string]int) // userID → open-socket count (all pages)
	onlineUsersMu sync.RWMutex
)

/*
──────────────────────────────
 3. Per-group hub (for broadcast only)

──────────────────────────────
*/
type groupHub struct {
	users map[string]map[*websocket.Conn]bool // userID → sockets in this group
	mu    sync.RWMutex
}

var hubs = struct {
	m map[string]*groupHub // key = groupID
	sync.RWMutex
}{m: make(map[string]*groupHub)}

/*
──────────────────────────────
 4. Upgrader (CORS)

──────────────────────────────
*/
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		if os.Getenv("FLY_APP_NAME") != "" {
			return r.Header.Get("Origin") == "https://dwi.fly.dev"
		}
		return true
	},
}

/*──────────────────────────────
   5.  Helpers
──────────────────────────────*/

// Build member list + online flag via global map
func currentMembersWS(groupID string) ([]wsMember, error) {
	rows, err := tp.DB.Query(`
		SELECT u.id, u.first_name, u.last_name, u.profile_pic
		  FROM group_users gu
		  JOIN users       u ON gu.users_id = u.id
		 WHERE gu.group_id = ?`, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	onlineUsersMu.RLock()
	defer onlineUsersMu.RUnlock()

	var list []wsMember
	for rows.Next() {
		var id, fname, lname, pic string
		if err := rows.Scan(&id, &fname, &lname, &pic); err != nil {
			return nil, err
		}
		list = append(list, wsMember{
			ID:         id,
			FirstName:  fname,
			LastName:   lname,
			ProfilePic: pic,
			IsOnline:   onlineUsers[id] > 0,
		})
	}
	return list, nil
}

// push fresh list to every socket in this group
func broadcastGroupMembers(groupID string) {
	snapshot, err := currentMembersWS(groupID)
	if err != nil {
		log.Println("Error fetching members:", err)
		return
	}
	fmt.Println(snapshot)
	data, _ := json.Marshal(snapshot)

	hubs.RLock()
	h, ok := hubs.m[groupID]
	hubs.RUnlock()
	if !ok {
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, conns := range h.users {
		for c := range conns {
			_ = c.WriteMessage(websocket.TextMessage, data)
		}
	}
}

/*──────────────────────────────
   6.  WebSocket handler
──────────────────────────────*/

// GET /ws/groups/members?group_id=...
func MembersWS(w http.ResponseWriter, r *http.Request) {
	fmt.Println("hey")
	groupID := r.URL.Query().Get("group_id")
	if groupID == "" {
		help.JsonError(w, "group_id required", http.StatusBadRequest, nil)
		return
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	// user from cookie/session
	user, err := auth.GetUser(r)
	if err != nil {
		return
	}

	/*── GLOBAL presence bookkeeping ──*/
	onlineUsersMu.Lock()
	onlineUsers[user.ID]++
	onlineUsersMu.Unlock()

	/*── register socket in this group hub ──*/
	hubs.Lock()
	h, ok := hubs.m[groupID]
	if !ok {
		h = &groupHub{users: make(map[string]map[*websocket.Conn]bool)}
		hubs.m[groupID] = h
	}
	h.mu.Lock()
	if _, ok := h.users[user.ID]; !ok {
		h.users[user.ID] = make(map[*websocket.Conn]bool)
	}
	h.users[user.ID][conn] = true
	h.mu.Unlock()
	hubs.Unlock()

	/*── initial list & broadcast ──*/
	if snap, err := currentMembersWS(groupID); err == nil {
		_ = conn.WriteJSON(snap)
	}
	broadcastGroupMembers(groupID)

	/*── read-pump: wait for close ──*/
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}

	/*── cleanup ──*/
	// 1) group hub
	h.mu.Lock()
	delete(h.users[user.ID], conn)
	if len(h.users[user.ID]) == 0 {
		delete(h.users, user.ID)
	}
	h.mu.Unlock()

	// 2) global presence
	onlineUsersMu.Lock()
	if cnt := onlineUsers[user.ID]; cnt > 1 {
		onlineUsers[user.ID] = cnt - 1
	} else {
		delete(onlineUsers, user.ID)
	}
	onlineUsersMu.Unlock()

	broadcastGroupMembers(groupID)
}
