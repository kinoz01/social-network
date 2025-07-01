package chat

import (
	"encoding/json"
	"net/http"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// total count of unread message from all peers
func GetUnreadSummary(w http.ResponseWriter, r *http.Request) {
	me, err := auth.GetUser(r) // your usual cookie lookup
	if err != nil {
		help.JsonError(w, "unauth", 401, err)
		return
	}

	rows, err := tp.DB.Query(`
        SELECT sender_id AS peer_id, COUNT(*) AS count
          FROM private_chats
         WHERE receiver_id = ? AND is_read = 0
         GROUP BY sender_id`, me.ID)
	if err != nil {
		help.JsonError(w, "db", 500, err)
		return
	}

	var out []struct {
		PeerID string `json:"peer_id"`
		Count  int    `json:"count"`
	}
	for rows.Next() {
		var p string
		var c int
		rows.Scan(&p, &c)
		out = append(out, struct {
			PeerID string `json:"peer_id"`
			Count  int    `json:"count"`
		}{p, c})
	}
	json.NewEncoder(w).Encode(out)
}
