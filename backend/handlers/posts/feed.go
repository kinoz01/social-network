package posts

import (
	"encoding/json"
	"net/http"
	"strconv"

	repoPosts "social-network/database/repositories/db_posts"
	auth "social-network/handlers/authentication"
	"social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

func AllPosts(w http.ResponseWriter, r *http.Request) {
	user, err := auth.GetUser(r)
	if err != nil {
		helpers.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
		return
	}
	pageStr := r.URL.Query().Get("pageNum")
	if pageStr == "" {
		pageStr = "0"
	}
	currentPage, err := strconv.Atoi(pageStr)
	if err != nil || currentPage < 0 {
		helpers.JsonError(w, "Invalid pageNum", http.StatusBadRequest, nil)
		return
	}

	var posts []tp.PostData
	if r.URL.Query().Get("profileId") != "" {
		posts, err = repoPosts.GetProfilePosts(currentPage, user.ID, r.URL.Query().Get("profileId"))
	} else if r.URL.Query().Get("groupId") != "" {
		posts, err = repoPosts.GetGroupPOsts(currentPage, user.ID, r.URL.Query().Get("groupId"))
	} else {
		posts, err = repoPosts.GetAllPOst(currentPage, user.ID)
	}

	if err != nil {
		if err.Error() == "private profile" {
			helpers.JsonError(w, "private profile", http.StatusPartialContent, err)
		} else if err.Error() == "profile not found" {
			helpers.JsonError(w, "profile not found", http.StatusNotFound, err)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(posts); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}
