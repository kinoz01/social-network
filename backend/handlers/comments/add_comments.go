package comments

import (
	"encoding/json"
	"html"
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
	isvalid := CheckComment(comment.Content)
	if !isvalid {
		JsonError.JsonError(w, "Bad Request", 400, nil)
		return
	} else {
		query := `INSERT INTO comments (comment_id, user_id, post_id, content) VALUES (?,?,?,?)`
		stmt, err := tp.DB.Prepare(query)
		if err != nil {
			JsonError.JsonError(w, "Internal Server Error", 500, nil)
			return
		}
		_, err = stmt.Exec(uniqueID, comment.Userid, comment.Postid, html.EscapeString(comment.Content))
		if err != nil {
			JsonError.JsonError(w, "Internal Server Error", 500, nil)
			return
		}
		json.NewEncoder(w).Encode("comment created")
	}
}

func CheckComment(Content string) bool {
	if len(Content) == 0 {
		return false
	}
	return true
}
