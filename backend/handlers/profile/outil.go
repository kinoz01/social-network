package profile

import (
	"database/sql"
	"fmt"
	"net/http"
	Error "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

func GitReaction(w http.ResponseWriter, postid string, userid string) (string, error) {
	var react string
	err := tp.DB.QueryRow(`SELECT
    react_type
FROM
    like_reaction
where
    like_reaction.user_id = ?
    AND like_reaction.post_id = ?
`, userid, postid).Scan(&react)
	if err != nil {
		if err == sql.ErrNoRows {
			return "ErrNoRows", nil
		}
		Error.JsonError(w, "Internal Server Error "+fmt.Sprintf("%v", err), 500, nil)
		return "", err
	}
	return react, nil
}

func IsFollower(w http.ResponseWriter, userProfile_id string, UserLoggedin_id string) (bool, error) {
	var row int
	err := tp.DB.QueryRow(`
SELECT COUNT(*) 
FROM follow_requests
 WHERE follow_requests.follower_id = ?
 AND follow_requests.followed_id = ?
 AND follow_requests.status = "accepted"
`, UserLoggedin_id, userProfile_id).Scan(&row)
	if err != nil {
		// if err == sql.ErrNoRows {
		// 	return false, nil
		// }
		Error.JsonError(w, "Internal Server Error "+fmt.Sprintf("%v", err), 500, nil)
		return false, err
	}
	if row == 1 {
		return true, nil
	}
	return false, nil
}
func IsPublicAccount(w http.ResponseWriter, userProfil_id string) (bool, error) {
	var row int
	err := tp.DB.QueryRow(`
SELECT COUNT(*) 
FROM users
 WHERE users.id = ?
 AND users.account_type = "public"
`, userProfil_id).Scan(&row)
	if err != nil {
		// if err == sql.ErrNoRows {
		// 	return false, nil
		// }
		Error.JsonError(w, "Internal Server Error "+fmt.Sprintf("%v", err), 500, nil)
		return false, err
	}
	if row == 1 {
		return true, nil
	}
	return false, nil
}
