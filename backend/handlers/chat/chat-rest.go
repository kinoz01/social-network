package chat

import (
	"encoding/json"
	"net/http"
	"strconv"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// chat history with limit and offset
func GetPrivateMessages(w http.ResponseWriter, r *http.Request) {
	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauthorized", http.StatusUnauthorized, err)
		return
	}

	peerID := r.URL.Query().Get("peer_id")
	if peerID == "" {
		help.JsonError(w, "peer_id required", http.StatusBadRequest, nil)
		return
	}

	limitQ := r.URL.Query().Get("limit")
	offsetQ := r.URL.Query().Get("offset")
	limit, _ := strconv.Atoi(limitQ)
	offset, _ := strconv.Atoi(offsetQ)
	if limit <= 0 {
		limit = 20
	}

	// Fetch messages where (sender=user AND receiver=peer) OR vice versa
	query := `
	  SELECT pc.id, pc.sender_id, pc.content, pc.created_at,
	         u.first_name, u.last_name, u.profile_pic
	  FROM private_chats pc
	  JOIN users u ON u.id = pc.sender_id
	  WHERE (
	    (pc.sender_id   = ? AND pc.receiver_id = ?)
	    OR
	    (pc.sender_id   = ? AND pc.receiver_id = ?)
	  )
	  ORDER BY pc.created_at DESC, pc.ROWID DESC
	  LIMIT ? OFFSET ?`
	rows, err := tp.DB.Query(
		query,
		user.ID, peerID,
		peerID, user.ID,
		limit, offset,
	)
	if err != nil {
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	type msg struct {
		ID         string `json:"id"`
		SenderID   string `json:"sender_id"`
		Content    string `json:"content"`
		CreatedAt  string `json:"created_at"`
		FirstName  string `json:"first_name"`
		LastName   string `json:"last_name"`
		ProfilePic string `json:"profile_pic"`
	}

	var rev []msg
	for rows.Next() {
		var m msg
		if err := rows.Scan(
			&m.ID, &m.SenderID, &m.Content, &m.CreatedAt,
			&m.FirstName, &m.LastName, &m.ProfilePic,
		); err != nil {
			help.JsonError(w, "scan error", http.StatusInternalServerError, err)
			return
		}
		rev = append(rev, m)
	}

	if len(rev) == 0 {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	// Reverse into ascending order (oldest to newest)
	for i, j := 0, len(rev)-1; i < j; i, j = i+1, j-1 {
		rev[i], rev[j] = rev[j], rev[i]
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rev)
}
