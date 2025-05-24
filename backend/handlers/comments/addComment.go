package comments

import (
	"encoding/json"
	"fmt"
	"net/http"
	db_comment "social-network/database/repositories/db_posts"
	"social-network/handlers/helpers"
	"social-network/handlers/types"
	"time"

	"github.com/gofrs/uuid"
)

func AddComment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		helpers.JsonError(w, "method not allowed", http.StatusMethodNotAllowed, nil)
		return
	}
	var comment types.Comment
	// err := json.NewDecoder(r.Body).Decode(&comment)
	// if err != nil {
	// 	helpers.JsonError(w, "failed to parse json", http.StatusBadRequest, nil)
	// 	return
	// }
	comment.Content = r.FormValue("content")
	comment.PostID = r.FormValue("postID")
	comment.UserID = r.FormValue("userID")
	// fmt.Println("content", comment.Content)

	filename, err := helpers.HamdleFIleUpload(r)
	if err != nil {
		helpers.JsonError(w, err.Error(), http.StatusBadRequest, nil)
		return
	}
	comment.Img_comment = filename

	// fmt.Println("image now", comment.Img_comment)
	comment.ID = uuid.Must(uuid.NewV4()).String()
	comment.CreatedAt = time.Now().Format("2006-01-02 15:04:05")

	if err := db_comment.CreateCommentDB(comment); err != nil {
		helpers.JsonError(w, err.Error(), http.StatusInternalServerError, nil)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(comment); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
	fmt.Println("testcomment", comment)
}
