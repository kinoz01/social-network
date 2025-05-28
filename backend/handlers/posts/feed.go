package posts

import (
	"encoding/json"
	"fmt"
	"net/http"
	repoPosts "social-network/database/repositories/db_posts"
	"social-network/handlers/helpers"
	"strconv"
	"strings"
)

//	type PostsREply struct {
//		Posts   []Post `json:"posts"`
//		HasMore bool   `json:"hasMore"`
//	}
func AllPosts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		helpers.JsonError(w, "method not allowed", http.StatusMethodNotAllowed, nil)
		return
	}
	fmt.Println("path", r.URL.Path)
	currentPage, err := strconv.Atoi((strings.Split(r.URL.Path, "/")[3]))
	if err != nil {
		helpers.JsonError(w, err.Error(), http.StatusBadRequest, nil)
	}
	posts, err := repoPosts.GetAllPOst(currentPage)
	// response := PostsREply{
	// 	Posts:   posts,
	// 	HasMore: hasMore,
	// }
	// if len(posts) == 0 {

	// }
	if err != nil {
		helpers.JsonError(w, err.Error(), http.StatusInternalServerError, nil)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(posts); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}
