package posts

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	repoPosts "social-network/database/repositories/db_posts"
	auth "social-network/handlers/authentication"
	"social-network/handlers/helpers"
)

func AllPosts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		helpers.JsonError(w, "method not allowed", http.StatusMethodNotAllowed, nil)
		return
	}

	user, err := auth.GetUser(r)
	if err != nil {
		helpers.JsonError(w, err.Error(), http.StatusUnauthorized, nil)
		return
	}

	currentPage, err := strconv.Atoi((strings.Split(r.URL.Path, "/")[3]))
	if err != nil {
		helpers.JsonError(w, err.Error(), http.StatusBadRequest, nil)
		return
	}
	posts, err := repoPosts.GetAllPOst(currentPage, user.ID)
	if err != nil {
		helpers.JsonError(w, err.Error(), http.StatusInternalServerError, nil)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(posts); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}
