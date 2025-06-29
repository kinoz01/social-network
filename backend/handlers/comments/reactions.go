package comments

import (
	"encoding/json"
	"net/http"

	postDB "social-network/database/repositories/db_posts"
	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	"social-network/handlers/types"

	"github.com/gofrs/uuid"
)

func HandleCommentLike(w http.ResponseWriter, r *http.Request) {
	u, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauthorized", http.StatusUnauthorized, err)
		return
	}

	// payload
	var like types.React 
	if err := json.NewDecoder(r.Body).Decode(&like); err != nil {
		help.JsonError(w, "bad request", http.StatusBadRequest, err)
		return
	}
	defer r.Body.Close()

	like.UserID = u.ID
	like.ID = uuid.Must(uuid.NewV4()).String()
	like.ISLike = "1"

	// toggle
	exists := postDB.IsCommentReacted(like) == nil // found row: already liked

	var nextLiked bool
	if exists {
		if err := postDB.DeleteCommentLike(like); err != nil {
			help.JsonError(w, err.Error(), 500, err)
			return
		}
		nextLiked = false
	} else {
		if err := postDB.SaveCommentLike(like); err != nil {
			help.JsonError(w, err.Error(), 500, err)
			return
		}
		nextLiked = true
	}

	newCount, err := postDB.CountCommentLikes(like.CommentID)
	if err != nil {
		help.JsonError(w, err.Error(), 500, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"liked": nextLiked,
		"count": newCount,
	})
}
