package comments

import (
	"encoding/json"
	"net/http"
	"time"

	db_comment "social-network/database/repositories/db_posts"
	auth "social-network/handlers/authentication"
	"social-network/handlers/helpers"
	"social-network/handlers/types"

	"github.com/gofrs/uuid"
)

func AddComment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		helpers.JsonError(w, "method not allowed", http.StatusMethodNotAllowed, nil)
		return
	}
	_, err := auth.GetUser(r)
	if err != nil {
		helpers.JsonError(w, err.Error(), http.StatusBadRequest, nil)
		return
	}
	var comment types.Comment

	comment.Content = r.FormValue("content")
	comment.PostID = r.FormValue("postID")
	comment.UserID = r.FormValue("userID")
	comment.FirstName = r.FormValue("firstName")
	comment.LastName = r.FormValue("lastName")
	comment.Avatar = r.FormValue("avatar")

	filename, err := helpers.HamdleFIleUpload(r, "posts/")
	if err != nil {
		helpers.JsonError(w, err.Error(), http.StatusBadRequest, nil)
		return
	}
	comment.Img_comment = filename

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
	// fmt.Println("⭐NEW COMMENT", comment, "|QVQTQR|", comment.Avatar)
}
