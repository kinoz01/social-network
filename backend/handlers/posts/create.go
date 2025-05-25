package posts

import (
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"
	"strings"

	postDB "social-network/database/repositories/db_posts"
	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	typeP "social-network/handlers/types"
	Postsrv "social-network/service/service_posts"

	"github.com/gofrs/uuid"
)

func CreatPosts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		help.JsonError(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed, nil)
		return
	}

	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, err.Error(), http.StatusBadRequest, nil)
		return
	}

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
	if file, hdr, _ := r.FormFile("file"); file != nil {
		defer file.Close()

		buff, err := help.LimitRead(file, 4<<20) // 4 MB max
		if err != nil {
			help.JsonError(w, "image too large", http.StatusBadRequest, err)
			return
		}
		ext := strings.ToLower(filepath.Ext(hdr.Filename))
		switch ext {
		case ".jpg", ".jpeg", ".png", ".gif", ".webp":
		default:
			help.JsonError(w, "unsupported image format", http.StatusBadRequest, nil)
			return
		}

		if p, err := help.SaveImg(buff, "posts/"); err == nil {
			newPost.Imag_post = p
			fmt.Printf("Image saved to: %s\n", p)
		}
	}
	
	if err := Postsrv.ValidInput(content); err != nil {
		help.JsonError(w, err.Error(), http.StatusBadRequest, nil)
		return
	}
	newPost.Content = content

	if newPost.Visibility == "private" {
		for _, vipUser := range vipUsers {
			if err := postDB.PostPrivacyDB(newPost.ID, vipUser); err != nil {
				help.JsonError(w, err.Error(), http.StatusInternalServerError, nil)
				return
			}
		}
	}

	if err := postDB.CreatePostDB(newPost); err != nil {
		help.JsonError(w, err.Error(), http.StatusInternalServerError, nil)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(newPost); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}
