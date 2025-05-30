package helpers

import (
	"fmt"
	"net/http"

	tp "social-network/handlers/types"
)

func GetUserId(r *http.Request) (string, error) {
	cookie, err := r.Cookie("session_token")
	if err != nil {
		return "", err
	}

	token := cookie.Value

	fmt.Println("token: ", token)

	GetUserId := `
SELECT
    user_id
FROM
    sessions
WHERE
    token = ?
`
	var userID string
	if err := tp.DB.QueryRow(GetUserId, token).Scan(&userID); err != nil {
		return "", err
	}

	return userID, nil
}
