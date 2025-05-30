package groups

import (
	"encoding/json"
	"net/http"
	"strconv"

	tp "social-network/handlers/types"
)

// GET /api/groups/chat?group_id=...&limit=20&offset=40
func ChatPage(w http.ResponseWriter, r *http.Request) {
	gid := r.URL.Query().Get("group_id")
	limS := r.URL.Query().Get("limit")
	offS := r.URL.Query().Get("offset")

	if gid == "" {
		http.Error(w, "group_id required", 400)
		return
	}

	limit, _ := strconv.Atoi(limS)
	if limit <= 0 {
		limit = 20
	}
	offset, _ := strconv.Atoi(offS)
	if offset < 0 {
		offset = 0
	}

	rows, err := tp.DB.Query(`
		SELECT gc.id, gc.content, gc.created_at,
		       u.id, u.first_name, u.last_name, u.profile_pic
		FROM group_chats gc
		JOIN users u ON u.id = gc.sender_id
		WHERE gc.group_id = ?
		ORDER BY gc.created_at DESC, gc.ROWID DESC
		LIMIT ? OFFSET ?`, gid, limit, offset)
	if err != nil {
		http.Error(w, "db err", 500)
		return
	}
	defer rows.Close()

	var page []map[string]any
	for rows.Next() {
		var m chatMsg
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
