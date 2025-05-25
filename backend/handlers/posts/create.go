package posts

import (
	"encoding/json"
	"fmt"
	"net/http"

	postDB "social-network/database/repositories/db_posts"
	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	typeP "social-network/handlers/types"
	Postsrv "social-network/service/service_posts"

	"github.com/gofrs/uuid"
)

func CreatPosts(w http.ResponseWriter, r *http.Request) {
	// fmt.Println("createPOst now")
	if r.Method != http.MethodPost {
		help.JsonError(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed, nil)
		return
	}

	user, err := auth.GetUser(r)
	if err != nil {
		fmt.Println("not exist user", err)
		help.JsonError(w, err.Error(), http.StatusBadRequest, nil)
		return
	}
	// fmt.Println("user-------------", user)

	// posts := type.Post
	err = r.ParseMultipartForm(10 << 20)
	if err != nil {
		help.JsonError(w, "Error in parsing form data", http.StatusBadRequest, nil)
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
		help.JsonError(w, err.Error(), http.StatusBadRequest, nil)
		return
	}
	newPost.Content = content

	filename, err := help.HamdleFIleUpload(r)
	newPost.Imag_post = filename

	if newPost.Visibility == "private" {
		// fmt.Println("handle now private posts")
		for _, vipUser := range vipUsers {
			if err := postDB.PostPrivacyDB(newPost.ID, vipUser); err != nil {
				help.JsonError(w, err.Error(), http.StatusInternalServerError, nil)
				return
			}
		}
	}
	fmt.Println("--------posts", newPost)
	if err := postDB.CreatePostDB(newPost); err != nil {
		help.JsonError(w, err.Error(), http.StatusInternalServerError, nil)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(newPost); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
	fmt.Println("--------INSERT SUCCEFLY")
}
