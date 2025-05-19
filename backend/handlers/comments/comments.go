package comments

import (
	"encoding/json"
	"fmt"
	"net/http"

	JsonError "social-network/handlers/helpers"

	"github.com/google/uuid"

	tp "social-network/handlers/types"
)

func AddComment(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-type", "application/json")
	if r.Method != http.MethodPost {
		JsonError.JsonError(w, "Method not allowed", 405, nil)
		return
	}
	var comment tp.Comment
	err := json.NewDecoder(r.Body).Decode(&comment)
	if err != nil {
		JsonError.JsonError(w, "Bad Request", 400, nil)
		return
	}
	uniqueID := uuid.New().ID()
	
	query := `INSERT INTO comments (comment_id, user_id, post_id, content) VALUES (?,?,?,?)`
	stmt, err := tp.DB.Prepare(query)
	if err != nil {
		JsonError.JsonError(w, fmt.Sprintf("%v", err), 500, nil)
		return
	}
	_, err = stmt.Exec(uniqueID, comment.Userid, comment.Postid, comment.Content)
	if err != nil {
		JsonError.JsonError(w, fmt.Sprintf("%v", err), 500, nil)
		return
	}
	json.NewEncoder(w).Encode("comment created")
}

func GetComments(w http.ResponseWriter, r *http.Request) {
	post_id := "f2216ae6-bb0e-4abf-a32d-45ee7bc0cfd2"
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
    comments.post_id = "f2216ae6-bb0e-4abf-a32d-45ee7bc0cfd2"
	`
	rows, err := tp.DB.Query(query, post_id)
	if err != nil {
		JsonError.JsonError(w, fmt.Sprintf("%v", err), 500, nil)
		return
	}
	for rows.Next() {
		var comment tp.Comment
		if scanErr := rows.Scan(&comment.Firstname, &comment.Lastname, &comment.Profile_pic, &comment.Content, &comment.Creatat); scanErr != nil {
			JsonError.JsonError(w, fmt.Sprintf("%v", err), 500, nil)
			return
		}
		comments = append(comments, comment)
	}
	if err = rows.Err(); err != nil {
		JsonError.JsonError(w, fmt.Sprintf("%v", err), 500, nil)
		return
	}
	fmt.Println("comments", comments)
	w.Header().Add("Content-type", "application/json")
	json.NewEncoder(w).Encode(comments)
}

// func WriteErrors(w http.ResponseWriter, status int, Message string) {
// 	fmt.Println("heeereee!!!")
// 	w.WriteHeader(status)
// 	w.Write([]byte(Message))
// }
