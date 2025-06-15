package notifications

import (
	"database/sql"
	"fmt"

	tp "social-network/handlers/types"
)

// Insert notification into the database.
func AddNotification(n tp.Notification) error {
	const q = `
	  INSERT INTO notifications
	    (id, type, content, receiver_id, sender_id,
	     related_group_id, related_event_id,
	     related_invitation_id, related_request_id, related_follow_id, is_read)
	  VALUES (?,?,?,?,?,?,?,?,?,?,?);`

	null := func(s string) sql.NullString {
		if s == "" {
			return sql.NullString{Valid: false}
		}
		return sql.NullString{String: s, Valid: true}
	}

	_, err := tp.DB.Exec(q,
		n.ID,
		n.Type,
		n.Content,
		n.Receiver,
		n.Sender.ID,
		null(n.Group),
		null(n.Event),
		null(n.InvitationID),
		null(n.RequestID),
		null(n.FollowID),
		n.IsRead,
	)
	if err != nil {
		fmt.Println("AddNotification error:", err)
	}
	return err
}
