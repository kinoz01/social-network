package comments

import (
	"encoding/json"
	"net/http"
	"strconv"

	db_comment "social-network/database/repositories/db_posts"
	auth "social-network/handlers/authentication"
	"social-network/handlers/helpers"
)

// comments end-point 
func GetComments(w http.ResponseWriter, r *http.Request) {
	
	user, err := auth.GetUser(r)
	if err != nil {
		helpers.JsonError(w, "user not found", http.StatusUnauthorized, nil)
		return
	}
	postID := r.URL.Query().Get("postId")
	page := r.URL.Query().Get("page")
	currentPage := 0
	if page != "" {
		var err error
		currentPage, err = strconv.Atoi(page)
		if err != nil {
			helpers.JsonError(w, err.Error(), http.StatusInternalServerError, nil)
			return
		}
	}

	comments, err := db_comment.CommentByPost(postID, currentPage, user.ID)
	if err != nil {
		helpers.JsonError(w, err.Error(), http.StatusInternalServerError, nil)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(comments); err != nil {
		helpers.JsonError(w, "Failed to encode response", http.StatusInternalServerError, err)
	}
}
