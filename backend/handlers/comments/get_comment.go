package comments

import (
	"encoding/json"
	"fmt"
	"net/http"

	JsonError "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

func GetComments(w http.ResponseWriter, r *http.Request) {
	post_id := "e4853d68-fd1e-465e-8413-783fa9bf3dd8"
	var comments []tp.Comment
	if r.Method != http.MethodGet {
		JsonError.JsonError(w, "Method not allowed", 405, nil)
		return
	}
	query := `
SELECT
    users.first_name,
    users.last_name,
    users.profile_pic,
    comments.content,
    comments.created_at
FROM
    comments
    LEFT JOIN users ON comments.user_id = users.id
WHERE
    comments.post_id = ?
	`
	rows, err := tp.DB.Query(query, post_id)
	if err != nil {
		JsonError.JsonError(w, "Internal Server Error 1"+fmt.Sprintf("%v", err), 500, nil)
		return
	}
	for rows.Next() {
		var comment tp.Comment
		if scanErr := rows.Scan(&comment.Firstname, &comment.Lastname, &comment.Profile_pic, &comment.Content, &comment.Creatat); scanErr != nil {
			JsonError.JsonError(w, "Internal Server Error 2"+fmt.Sprintf("%v", scanErr), 500, nil)
			return
		}
		comments = append(comments, comment)
	}
	if err = rows.Err(); err != nil {
		JsonError.JsonError(w, fmt.Sprintf("%v", err), 500, nil)
		JsonError.JsonError(w, "Internal Server Error 3"+fmt.Sprintf("%v", err), 500, nil)
		return
	}
	fmt.Println("comments", comments)
	w.Header().Add("Content-type", "application/json")
	json.NewEncoder(w).Encode(comments)
}
