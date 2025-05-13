package groups

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"path/filepath"
	"strings"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"

	"github.com/gofrs/uuid"
)

func CreatePostHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		help.JsonError(w, "method not allowed", http.StatusMethodNotAllowed, nil)
		return
	}

	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauth", http.StatusUnauthorized, err)
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10 MB
		help.JsonError(w, "invalid form", http.StatusBadRequest, err)
		return
	}

	groupID := r.FormValue("group_id")
	body := strings.TrimSpace(r.FormValue("body"))

	if groupID == "" || len(body) == 0 || len(body) > 10000 {
		help.JsonError(w, "bad payload", http.StatusBadRequest, err)
		return
	}

	// verify membership
	var exists int
	if err := tp.DB.QueryRow(`
		SELECT 1 FROM group_users WHERE group_id = ? AND users_id = ? LIMIT 1`,
		groupID, user.ID).Scan(&exists); err != nil {
		help.JsonError(w, "forbidden", http.StatusForbidden, err)
		return
	}

	/* ---------- optional image ------------------------------------ */
	var imgPath sql.NullString
	if file, hdr, _ := r.FormFile("image"); file != nil {
		defer file.Close()

		buff, err := help.LimitRead(file, 4<<20) // 4 MB
		if err != nil {
			help.JsonError(w, "image too large", http.StatusBadRequest, err)
			return
		}
		ext := strings.ToLower(filepath.Ext(hdr.Filename))
		if ext != ".jpg" && ext != ".png" && ext != ".webp" && ext != ".jpeg" && ext != ".gif" {
			help.JsonError(w, "unsupported image format", http.StatusBadRequest, nil)
			return
		}
		if p, err := help.SaveImg(buff, "posts/"); err == nil {
			imgPath.String = p
			imgPath.Valid = true
		}
	}

	postID := uuid.Must(uuid.NewV4()).String()
	_, err = tp.DB.Exec(`
		INSERT INTO posts
		  (post_id, user_id, group_id, body, img_post, visibility)
		VALUES (?,?,?,?,?, 'public')`,
		postID, user.ID, groupID, body, imgPath)
	if err != nil {
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"post_id": postID})
}
