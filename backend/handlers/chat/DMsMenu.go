package chat

import (
	"encoding/json"
	"net/http"
	"strconv"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// JSON shape returned to the frontend.
type DMEntry struct {
	PeerID      string `json:"peer_id"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	ProfilePic  string `json:"profile_pic"`
	LastContent string `json:"last_content"`
	LastTime    string `json:"last_time"` 
	UnreadCount int    `json:"unread_count"`
}

// api endpoint to get available DM users
func ChatDMList(w http.ResponseWriter, r *http.Request) {
	// Verify authentication
	u, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauthorized", http.StatusUnauthorized, err)
		return
	}
	meID := u.ID

	// Parse limit query (default = 300) (perfomance limit)
	limit := 300
	if limS := r.URL.Query().Get("limit"); limS != "" {
		if x, err := strconv.Atoi(limS); err == nil && x > 0 {
			limit = x
		}
	}

	/*
	   	We want, for each "peer" that this user (meID) has ever exchanged a message with,
	   	to return:
	    	- peer_id
	     	- peer's first_name, last_name, profile_pic
	     	- last_content & last_time (the text + timestamp of the most recent DM between me ↔️ peer)
	     	- unread_count = COUNT(*) of (sender_id = peer_id AND receiver_id = meID AND is_read = false)
	   	Order by last_time DESC, limit = ?
	*/

	rows, err := tp.DB.Query(`
    WITH latest AS (           -- creates a temporary table "latest" with each peer_id (me or him) and time of latest message
      SELECT
        CASE
          WHEN sender_id = ? THEN receiver_id
          ELSE sender_id
        END   AS peer_id,
        MAX(created_at) AS max_time
      FROM private_chats
      WHERE sender_id = ? OR receiver_id = ?
      GROUP BY peer_id
    )
    SELECT
      u.id                AS peer_id,
      u.first_name,
      u.last_name,
      u.profile_pic,
      pc.content          AS last_content,
      pc.created_at       AS last_time,
      IFNULL(uc.unread_cnt, 0) AS unread_count  -- number of unread messages from peer (0 if none)
    FROM latest

    JOIN private_chats pc	-- Join to get the actual content of the latest message with each peer
      ON (
           (pc.sender_id   = ? AND pc.receiver_id = latest.peer_id) OR
           (pc.sender_id   = latest.peer_id AND pc.receiver_id = ?)
         )
     AND pc.created_at = latest.max_time  -- ensure it's the latest message for that peer

    JOIN users u			-- Join to get peer's user information
      ON u.id = latest.peer_id

	
    JOIN follow_requests fr		-- Only include peers that follow you or are followed by you 
      ON fr.status = 'accepted'
     AND (
          (fr.follower_id = ? AND fr.followed_id = u.id)  
       OR (fr.follower_id = u.id AND fr.followed_id = ?) 
         )

    LEFT JOIN (		-- LEFT JOIN to get count of unread messages from each peer
      SELECT sender_id AS peer, COUNT(*) AS unread_cnt
      FROM private_chats
      WHERE receiver_id = ? AND is_read = 0
      GROUP BY sender_id
    ) uc
      ON uc.peer = latest.peer_id

    ORDER BY latest.max_time DESC
    LIMIT ?`,
		meID,       // latest CASE
		meID, meID, // latest WHERE
		meID, meID, // pc join
		meID, meID, // follow_requests join
		meID, // unread-count sub-query
		limit,
	)
	if err != nil {
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	var out []DMEntry
	for rows.Next() {
		var e DMEntry
		if err := rows.Scan(
			&e.PeerID,
			&e.FirstName,
			&e.LastName,
			&e.ProfilePic,
			&e.LastContent,
			&e.LastTime,
			&e.UnreadCount,
		); err != nil {
			help.JsonError(w, "scan error", http.StatusInternalServerError, err)
			return
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
