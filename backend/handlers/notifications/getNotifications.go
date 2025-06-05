package notifications

import (
	"fmt"

	tp "social-network/handlers/types"
)

type Notifcations struct {
	Notifications []*tp.Notification `json:"notifications"`
	TotalCount    int                `json:"totalCount"`
	TotalPages    int                `json:"totalPages"`
}

func GetNotifications(id string, limitQuery, pageQuery int) (*Notifcations, error) {
	var totalCount int

	stmnt := fmt.Sprintf(`SELECT COUNT(*) FROM notifications  WHERE receiver_id = ?`)
	row := tp.DB.QueryRow(stmnt, id)
	if err := row.Scan(&totalCount); err != nil {
		return nil, err
	}

	offset := (pageQuery - 1) * limitQuery

	totalPages := (totalCount + limitQuery - 1) / limitQuery

	insertNotification := `
SELECT
    users.id,
    users.first_name,
    users.last_name,
    users.profile_pic,
    notifications.id,
    notifications.receiver_id,
    notifications.type,
    notifications.content,
    notifications.created_at,
    notifications.is_read

FROM
    notifications
    LEFT JOIN users ON users.id = notifications.sender_id
WHERE
    notifications.receiver_id = ?
ORDER BY
    notifications.created_at DESC
LIMIT ? OFFSET ?
`
	fmt.Println("queries: ", id, limitQuery, pageQuery)
	rows, err := tp.DB.Query(insertNotification, id, limitQuery, offset)

	fmt.Println("notifications err: ", err, rows)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var notifications []*tp.Notification

	for rows.Next() {

		var notification tp.Notification

		if err := rows.Scan(&notification.Sender.ID, &notification.Sender.FirstName, &notification.Sender.LastName, &notification.Sender.ProfilePic, &notification.ID, &notification.Receiver, &notification.Type, &notification.Content, &notification.CreatedAt, &notification.IsRead); err != nil {
			fmt.Println("row2 err: ", err, row)
			return nil, err
		}

		notifications = append(notifications, &notification)

	}

	return &Notifcations{
		Notifications: notifications,
		TotalCount:    totalCount,
		TotalPages:    totalPages,
	}, nil
}
