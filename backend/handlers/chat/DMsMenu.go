package chat

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// DMEntry mirrors the JSON shape returned to the frontend.
type DMEntry struct {
	PeerID      string `json:"peer_id"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	ProfilePic  string `json:"profile_pic"`
	LastContent string `json:"last_content"`
	LastTime    string `json:"last_time"` // ISO timestamp
	UnreadCount int    `json:"unread_count"`
}

// GET /api/chat/dm-list?limit=…
func ChatDMList(w http.ResponseWriter, r *http.Request) {
	// 1) Verify authentication
	u, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauthorized", http.StatusUnauthorized, err)
		return
	}
	meID := u.ID

	// 2) Parse limit query (default = 300)
	limit := 300
	if limS := r.URL.Query().Get("limit"); limS != "" {
		if x, err := strconv.Atoi(limS); err == nil && x > 0 {
			limit = x
		}
	}

	/*
	   We want, for each “peer” that this user (meID) has ever exchanged a message with,
	   to return:
	     - peer_id
	     - peer’s first_name, last_name, profile_pic
	     - last_content & last_time (the text + timestamp of the most recent DM between me ↔️ peer)
	     - unread_count = COUNT(*) of (sender_id = peer_id AND receiver_id = meID AND is_read = false)
	   Order by last_time DESC, limit = ?
	*/

	// 3) Single‐query approach using a derived “latest per peer” subquery:
	rows, err := tp.DB.Query(`
      WITH latest AS (
        SELECT 
          CASE
            WHEN sender_id = ? THEN receiver_id 
            ELSE sender_id 
          END AS peer_id,
          MAX(created_at) AS max_time
        FROM private_chats
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY peer_id
      )
      SELECT
        u.id               AS peer_id,
        u.first_name,
        u.last_name,
        u.profile_pic,
        pc.content         AS last_content,
        pc.created_at      AS last_time,
        IFNULL(uc.unread_cnt, 0) AS unread_count
      FROM latest
      JOIN private_chats pc 
        ON ((pc.sender_id = ? AND pc.receiver_id = latest.peer_id) 
             OR (pc.sender_id = latest.peer_id AND pc.receiver_id = ?))
        AND pc.created_at = latest.max_time
      JOIN users u 
        ON u.id = latest.peer_id
      LEFT JOIN (
        SELECT sender_id AS peer, COUNT(*) AS unread_cnt
        FROM private_chats
        WHERE receiver_id = ? AND is_read = 0
        GROUP BY sender_id
      ) uc 
        ON uc.peer = latest.peer_id
      ORDER BY latest.max_time DESC
      LIMIT ?`,
		// bind parameters in order:
		meID,       // subquery: CASE WHEN sender_id = meID ...
		meID, meID, // subquery WHERE sender_id=meID OR receiver_id=meID
		meID, meID, // join pm: pc.sender_id=meID AND pc.receiver_id=peer_id  OR vice versa
		meID, // LEFT JOIN unread_count: receiver_id = meID AND is_read=0 GROUP BY sender_id
		limit,
	)
	if err != nil {
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	var out []DMEntry
	var img sql.NullString
	for rows.Next() {
		var e DMEntry
		if err := rows.Scan(
			&e.PeerID,
			&e.FirstName,
			&e.LastName,
			&img,
			&e.LastContent,
			&e.LastTime,
			&e.UnreadCount,
		); err != nil {
			help.JsonError(w, "scan error", http.StatusInternalServerError, err)
			return
		}
		if img.Valid {
			e.ProfilePic = img.String
		}
		out = append(out, e)
	}
	if len(out) == 0 {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(out)
}
