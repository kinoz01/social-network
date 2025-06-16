package posts

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strings"
	"time"

	postDB "social-network/database/repositories/db_posts"
	auth "social-network/handlers/authentication"
	"social-network/handlers/helpers"
	hlp "social-network/handlers/helpers"
	typeP "social-network/handlers/types"

	"github.com/gofrs/uuid"
)

func CreatPosts(w http.ResponseWriter, r *http.Request) {
	user, err := auth.GetUser(r)
	if err != nil {
		helpers.JsonError(w, "unauthorized", http.StatusUnauthorized, err)
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		helpers.JsonError(w, "invalid form", http.StatusBadRequest, err)
		return
	}

	content := strings.TrimSpace(r.FormValue("content"))
	visibility := r.FormValue("privacy")
	vipUsers := append(r.Form["vipUsers"], user.ID)

	postID := uuid.Must(uuid.NewV4())
	newPost := typeP.Post{
		ID:         postID.String(),
		UserID:     user.ID,
		Visibility: hlp.ValidVisibility(visibility),
	}

	if err := hlp.ValidInput(content); err != nil {
		helpers.JsonError(w, err.Error(), http.StatusBadRequest, nil)
		return
	}
	
	// collapse >3 newlines to 2
	re := regexp.MustCompile(`(\r\n|\r|\n){3,}`)
	newPost.Content = re.ReplaceAllString(content, "\n\n")

	filename, err := helpers.HandleFileUpload(r, "posts/", "file")
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
}
