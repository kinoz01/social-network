package groups

import (
	"encoding/json"
	"net/http"
	"strconv"

	tp "social-network/handlers/types"
	help "social-network/handlers/helpers"
	ws "social-network/handlers/websocket"
)

// api end-point to get group chat history
func ChatPage(w http.ResponseWriter, r *http.Request) {
	
	gid := r.URL.Query().Get("group_id")
	limS := r.URL.Query().Get("limit")
	offS := r.URL.Query().Get("offset")

	limit, _ := strconv.Atoi(limS)
	offset, _ := strconv.Atoi(offS)

	rows, err := tp.DB.Query(`
		SELECT gc.id, gc.content, gc.created_at,
		       u.id, u.first_name, u.last_name, u.profile_pic
		FROM group_chats gc
		JOIN users u ON u.id = gc.sender_id
		WHERE gc.group_id = ?
		ORDER BY gc.created_at DESC, gc.ROWID DESC
		LIMIT ? OFFSET ?`, gid, limit, offset)
	if err != nil {
		help.JsonError(w, "db err", 500, err)
		return
	}
	defer rows.Close()

	var page []map[string]any
	for rows.Next() {
		var m ws.ChatMsg
		rows.Scan(&m.ID, &m.Content, &m.CreatedAt,
			&m.SenderID, &m.FirstName, &m.LastName, &m.ProfilePic)
		page = append(page, map[string]any{
			"id": m.ID, "sender_id": m.SenderID, "first_name": m.FirstName,
			"last_name": m.LastName, "profile_pic": m.ProfilePic,
			"content": m.Content, "created_at": m.CreatedAt,
		})
	}
	// reverse into ascending order
	for i, j := 0, len(page)-1; i < j; i, j = i+1, j-1 {
		page[i], page[j] = page[j], page[i]
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(page)
}
