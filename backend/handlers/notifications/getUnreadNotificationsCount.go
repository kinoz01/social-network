package notifications

import (
	"fmt"

	tp "social-network/handlers/types"
)

func GetUnreadNotifications(id string, isRead bool) (int, error) {
	var count int
	fmt.Println("is reaaaaaaaaaaad: ", isRead)
	getCount := `
SELECT
    COUNT(*)
FROM
    notifications
WHERE
    is_read = ? 
AND
	receiver_id = ?
`
	row := tp.DB.QueryRow(getCount, isRead, id)
	if err := row.Scan(&count); err != nil {
		return 0, err
	}

	return count, nil
}
