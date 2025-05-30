package notifications

import (
	"encoding/json"
	"fmt"
	"net/http"

	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"

	"github.com/gofrs/uuid"
)

func FriendRequestHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		help.JsonError(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed, nil)
		return
	}

	var notification tp.Notification

	if err := json.NewDecoder(r.Body).Decode(&notification); err != nil {
		fmt.Println("notification errrrrrrrrr1: ", err)

		help.JsonError(w, "Unexpected error, try again later.", http.StatusInternalServerError, err)
		return
	}

	fmt.Println("notification req: ", notification)
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
		help.JsonError(w, "Unexpected error, try again later", http.StatusInternalServerError, err)
		return
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
			help.JsonError(w, "Unexpected error, try again later", http.StatusInternalServerError, err)
			return
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

			help.JsonError(w, "Unexpected error, try again later", http.StatusInternalServerError, err)
			return
		}

	}
	fmt.Println("succcccccccccccccccccccessssssssssssss")

	json.NewEncoder(w).Encode("success!")
}
