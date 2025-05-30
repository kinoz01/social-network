package notifications

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

type Notifcations struct {
	Notifications []*tp.Notification `json:"notifications"`
	TotalCount    int                `json:"totalCount"`
	TotalPages    int                `json:"totalPages"`
}

func NotificationsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		help.JsonError(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed, nil)
		return
	}
	
	userId, err := help.GetUserId(r)
	isReadQuery := r.URL.Query().Get("isread")
	limitQuery := r.URL.Query().Get("limit")
	pageQuery := r.URL.Query().Get("page")
	fmt.Println("is read queeeeeeeeeeery: ", isReadQuery)
	isRead := false

	fmt.Println("ussssssssser id: ", userId, err)
	if isReadQuery != "" {
		if isReadQuery == "true" {
			isRead = true
		}

		unreadNotifcationsCount, err := GetUnreadNotifications(userId, isRead)
		if err != nil {
			fmt.Println("notification err1: ", err)
			help.JsonError(w, "Unexpected error, try again .", http.StatusInternalServerError, err)
			return
		}
		json.NewEncoder(w).Encode(unreadNotifcationsCount)
		return

	}

	notifications, err := GetNotifications(userId, limitQuery, pageQuery)
	if err != nil {
		help.JsonError(w, "Unexpected error, try again again", http.StatusInternalServerError, err)
		return
	}

	json.NewEncoder(w).Encode(notifications)
}

func GetNotifications(id, limitQuery, pageQuery string) (*Notifcations, error) {
	var totalCount int

	stmnt := fmt.Sprintf(`SELECT COUNT(*) FROM notifications`)
	row := tp.DB.QueryRow(stmnt)
	if err := row.Scan(&totalCount); err != nil {
		return nil, err
	}

	fmt.Println("count err: ", totalCount)
	fmt.Println("queries: ", limitQuery, pageQuery)
	fmt.Println("totalCount: ", totalCount)

	page := 1
	limit := 10

	if pageQuery != "" {
		intPage, err := strconv.Atoi(pageQuery)
		if err != nil {
			return nil, err
		}
		if intPage <= 0 {
			intPage = page
		}
		page = intPage
	}

	if limitQuery != "" {
		intLimit, err := strconv.Atoi(limitQuery)
		if err != nil {
			return nil, err
		}

		if intLimit <= 0 {
			intLimit = limit
		}

		limit = intLimit
	}

	offset := (page - 1) * limit

	totalPages := (totalCount + limit - 1) / limit

	fmt.Println("pagination : ", limit, offset)

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
	fmt.Println("queries: ", id, limit, pageQuery)
	rows, err := tp.DB.Query(insertNotification, id, limit, offset)

	fmt.Println("notifications err: ", err, rows)
	if err != nil {
		return nil, err
	}
	defer rows.Scan()
	var notifications []*tp.Notification

	for rows.Next() {

		var notification tp.Notification

		if err := rows.Scan(&notification.Sender.ID, &notification.Sender.FirstName, &notification.Sender.LastName, &notification.Sender.ProfilePic, &notification.ID, &notification.Receiver, &notification.Type, &notification.Content, &notification.CreatedAt, &notification.IsRead); err != nil {
			fmt.Println("row2 err: ", err, row)
			return nil, err
		}

		fmt.Println("notifcation: ", notification)

		notifications = append(notifications, &notification)

	}

	fmt.Println("notifcationsssssssssssssss: ", notifications)

	return &Notifcations{
		Notifications: notifications,
		TotalCount:    totalCount,
		TotalPages:    totalPages,
	}, nil
}
