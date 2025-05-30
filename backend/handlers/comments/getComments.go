package comments

import (
	"encoding/json"
	"net/http"
	db_comment "social-network/database/repositories/db_posts"
	"social-network/handlers/helpers"
	"strconv"
)

func GetComments(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		helpers.JsonError(w, "method not allowed", http.StatusMethodNotAllowed, nil)
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

	comments, err := db_comment.CommentByPost(postID, currentPage)
	if err != nil {
		helpers.JsonError(w, err.Error(), http.StatusInternalServerError, nil)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(comments); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}
