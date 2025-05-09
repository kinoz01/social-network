package posts

import (
	"database/sql"
	"fmt"
	"io"
	"net/http"
	"os"

	postDB "social-network/database/repositories/db_posts"
	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	typeP "social-network/handlers/types"
	Postsrv "social-network/service/service_posts"

	"github.com/gofrs/uuid"
)

func CreatPosts(w http.ResponseWriter, r *http.Request) {
	fmt.Println("createPOst now")
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
	fmt.Println("user-------------", user)

	// posts := type.Post
	err = r.ParseMultipartForm(10 << 20)
	if err != nil {
		help.JsonError(w, "Error in parsing form data", http.StatusBadRequest, nil)
		return
	}

	content := r.FormValue("content")
	visibility := r.FormValue("privacy")
	vipUsers := r.Form["vipUsers"]
	var fileName sql.NullString
	fmt.Println("here------------->", content, visibility, vipUsers)

	file, handler, err := r.FormFile("file")
	if err != nil {
		// help.JsonError(w, err.Error(), http.StatusBadRequest, nil)
		fmt.Println("read file--", err)
	}
	fmt.Println("hereNNNNNNNNNNNN------------->", content, visibility, handler)
	if handler != nil {
		filePath, err := os.Create("./storage/posts/" + handler.Filename)
		if err != nil {
			help.JsonError(w, "Failed to ceate a file", http.StatusInternalServerError, nil)
			return
		}
		defer filePath.Close()
		_, err = io.Copy(filePath, file)
		if err != nil {
			help.JsonError(w, "Failed to save file", http.StatusInternalServerError, nil)
			return
		}
		if err := Postsrv.ValidFile(handler); err != nil {
			help.JsonError(w, err.Error(), http.StatusBadRequest, nil)
			return
		}
		fileName = sql.NullString{
			String: handler.Filename,
			Valid:  true,
		}
	}
	if err := Postsrv.ValidInput(content); err != nil {
		help.JsonError(w, err.Error(), http.StatusBadRequest, nil)
		return
	}
	fmt.Println("last esrror", err)
	postID := uuid.Must(uuid.NewV4())
	newPost := typeP.Post{
		ID:         postID.String(),
		UserID:     user.ID,
		Content:    content,
		Imag_post:  fileName,
		Visibility: Postsrv.ValidVisibility(visibility),
	}
	fmt.Println("--------posts", newPost)
	if err := postDB.CreatePostDB(newPost); err != nil {
		help.JsonError(w, err.Error(), http.StatusInternalServerError, nil)
		return
	}
	fmt.Println("--------INSERT SUCCEFLY")
}
