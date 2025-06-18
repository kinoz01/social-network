package chat

import (
	"encoding/json"
	"net/http"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// POST /api/chat/mark-read?peer_id=…
func ChatMarkRead(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		help.JsonError(w, "method not allowed", http.StatusMethodNotAllowed, nil)
		return
	}
	u, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauthorized", http.StatusUnauthorized, err)
		return
	}
	meID := u.ID

	peerID := r.URL.Query().Get("peer_id")
	if peerID == "" {
		help.JsonError(w, "peer_id required", http.StatusBadRequest, nil)
		return
	}

	// Update all rows where sender_id = peerID AND receiver_id = meID AND is_read = 0 → set is_read=1
	res, err := tp.DB.Exec(`
      UPDATE private_chats
      SET is_read = 1
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `, peerID, meID)
	if err != nil {
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}
	cnt, _ := res.RowsAffected()

	// Return a small JSON indicating how many were marked
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"marked": cnt,
	})
}
