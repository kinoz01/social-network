package notifications

import (
	"fmt"
	tp "social-network/handlers/types"

	"github.com/gofrs/uuid"
)

func AddNotification(notification tp.Notification)(error) {
	id := uuid.Must(uuid.NewV4())

	selectNotification := `SELECT
    EXISTS (
        SELECT
            1
        FROM
            notifications
        WHERE
             id = ?
    );
	`

	var notificationExists bool

	if err := tp.DB.QueryRow(selectNotification, notification.ID).Scan(&notificationExists); err != nil {
		fmt.Println("notification errrrrrrrr: ", err)
		return err
	}

	fmt.Println("notification exixts: ", notificationExists)
	if !notificationExists {

		insertNotification := `
	INSERT INTO 
	notifications (id, sender_id, receiver_Id, type, content, related_group_id, related_event_id, is_read)
	VALUES
	(?, ?, ?, ?, ?, ?, ?, ?);`

		if _, err := tp.DB.Exec(insertNotification, id, notification.Sender.ID, notification.Receiver, notification.Type, notification.Content, notification.Group, notification.Event, notification.IsRead); err != nil {
			fmt.Println("notification errrrrrrrr2: ", err)
			return err
		}

	} else {
		updateNotification := `
	UPDATE
		notifications
	SET 
		is_read = true
	WHERE
		id = ?;
	`

		if _, err := tp.DB.Exec(updateNotification, notification.ID); err != nil {
			fmt.Println("err delete2: ", err)
			return err
		}

	}
	return nil
}
