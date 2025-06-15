package groups

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"regexp"
	"strings"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"

	"github.com/gofrs/uuid"
)

func CreateGroupPost(w http.ResponseWriter, r *http.Request) {
	userId, _ := auth.GetUserId(r)

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		help.JsonError(w, "invalid form", http.StatusBadRequest, err)
		return
	}

	groupID := r.FormValue("group_id")
	body := strings.TrimSpace(r.FormValue("content"))
	if groupID == "" || len(body) == 0 || len(body) > 2000 {
		help.JsonError(w, "invalid text", http.StatusBadRequest, nil)
		return
	}

	// collapse >3 newlines to 2
	re := regexp.MustCompile(`(\r\n|\r|\n){3,}`)
	body = re.ReplaceAllString(body, "\n\n")

	/* ─ optional image ─ */
	var imgPath sql.NullString
	imgstr, err := help.HandleFileUpload(r, "groups_posts/", "imag_post")
	if err != nil {
		help.JsonError(w, err.Error(), http.StatusBadRequest, nil)
		return
	}
	if imgstr != "" {
		imgPath = sql.NullString{
			String: imgstr,
			Valid:  true,
		}
	}

	/* ─ insert ─ */
	postID := uuid.Must(uuid.NewV4()).String()
	_, err = tp.DB.Exec(`
		INSERT INTO posts
		  (post_id, user_id, group_id, body, img_post, visibility)
		VALUES (?,?,?,?,?, 'public')`,
		postID, userId, groupID, body, imgPath)
	if err != nil {
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}

	/* ─ fetch full row for immediate UI update ─ */
	var p tp.PostData
	var img sql.NullString
	row := tp.DB.QueryRow(`
		SELECT p.post_id, p.user_id, p.group_id, p.body, p.img_post,
		       p.created_at, u.first_name, u.last_name, u.profile_pic
		FROM posts p
		JOIN users u ON u.id = p.user_id
		WHERE p.post_id = ? LIMIT 1`, postID)

	if err := row.Scan(
		&p.PostID, &p.UserID, &p.GroupID, &p.Content, &img,
		&p.CreatedAt, &p.FirstName, &p.LastName, &p.ProfilePic,
	); err != nil {
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}
	if img.Valid {
		p.Imag_post = img.String
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p)
}
