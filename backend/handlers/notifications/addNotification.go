package notifications

import (
	"database/sql"
	"fmt"

	tp "social-network/handlers/types"

	"github.com/gofrs/uuid"
)

// Insert notification into the database.
func AddNotification(n tp.Notification) error {
	id := uuid.Must(uuid.NewV4()).String()

	const q = `
	  INSERT INTO notifications
	    (id, type, content, receiver_id, sender_id,
	     related_group_id, related_event_id,
	     related_invitation_id, related_request_id, is_read)
	  VALUES (?,?,?,?,?,?,?,?,?,?);`

	null := func(s string) sql.NullString {
		if s == "" {
			return sql.NullString{Valid: false}
		}
		return sql.NullString{String: s, Valid: true}
	}

	_, err := tp.DB.Exec(q,
		id,
		n.Type,
		n.Content,
		n.Receiver,
		n.Sender.ID,
		n.Group, 
		null(n.Event),
		null(n.InvitationID),
		null(n.RequestID),
		n.IsRead,
	)
	if err != nil {
		fmt.Println("AddNotification error:", err)
	}
	return err
}
