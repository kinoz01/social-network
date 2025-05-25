package groups

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"
	"regexp"
	"strings"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"

	"github.com/gofrs/uuid"
)

func CreateGroupPost(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		help.JsonError(w, "method not allowed", http.StatusMethodNotAllowed, nil)
		return
	}

	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauth", http.StatusUnauthorized, err)
		return
	}

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

	// collapse ≥3 newlines to 2
	re := regexp.MustCompile(`(\r\n|\r|\n){3,}`)
	body = re.ReplaceAllString(body, "\n\n")

	// membership check
	var exists int
	if err := tp.DB.QueryRow(
		`SELECT 1 FROM group_users WHERE group_id = ? AND users_id = ? LIMIT 1`,
		groupID, user.ID,
	).Scan(&exists); err != nil {
		help.JsonError(w, "forbidden", http.StatusForbidden, err)
		return
	}

	/* ─ optional image ─ */
	var imgPath sql.NullString
	if file, hdr, _ := r.FormFile("imag_post"); file != nil {
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

		if p, err := help.SaveImg(buff, "groups_posts/"); err == nil {
			imgPath.String = p
			imgPath.Valid = true
			fmt.Printf("Image saved to: %s\n", p)
		}
	}

	/* ─ insert ─ */
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
