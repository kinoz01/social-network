package posts

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	postDB "social-network/database/repositories/db_posts"
	auth "social-network/handlers/authentication"
	"social-network/handlers/helpers"
	typeP "social-network/handlers/types"
	Postsrv "social-network/service/service_posts"

	"github.com/gofrs/uuid"
)

func CreatPosts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		helpers.JsonError(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed, nil)
		return
	}

	user, err := auth.GetUser(r)
	if err != nil {
		fmt.Println("not exist user", err)
		helpers.JsonError(w, err.Error(), http.StatusBadRequest, nil)
		return
	}

	err = r.ParseMultipartForm(10 << 20)
	if err != nil {
		helpers.JsonError(w, "Error in parsing form data", http.StatusBadRequest, nil)
		return
	}

	content := r.FormValue("content")
	visibility := r.FormValue("privacy")
	vipUsers := append(r.Form["vipUsers"], user.ID)

	postID := uuid.Must(uuid.NewV4())
	newPost := typeP.Post{
		ID:         postID.String(),
		UserID:     user.ID,
		Visibility: Postsrv.ValidVisibility(visibility),
	}

	if err := Postsrv.ValidInput(content); err != nil {
		helpers.JsonError(w, err.Error(), http.StatusBadRequest, nil)
		return
	}
	newPost.Content = content

	filename, err := helpers.HamdleFIleUpload(r, "posts/")
	if err != nil {
		helpers.JsonError(w, err.Error(), http.StatusBadRequest, nil)
		return
	}
	newPost.Imag_post = filename

	if newPost.Visibility == "private" {
		for _, vipUser := range vipUsers {
			if err := postDB.PostPrivacyDB(newPost.ID, vipUser); err != nil {
				helpers.JsonError(w, err.Error(), http.StatusInternalServerError, nil)
				return
			}
		}
	}
	newPost.CreatedAt = time.Now().Format("2006-01-02 15:04:05")

	if err := postDB.CreatePostDB(newPost); err != nil {
		helpers.JsonError(w, err.Error(), http.StatusInternalServerError, nil)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(newPost); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
	fmt.Println("--------INSERT SUCCEFLY")
}
