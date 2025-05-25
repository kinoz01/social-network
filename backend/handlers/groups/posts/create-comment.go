package groups

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"path/filepath"
	"regexp"
	"strings"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"

	"github.com/gofrs/uuid"
)

const maxCommentImg = 3 << 20 // 3 MB

// POST /api/groups/comment
// Multipart-form: post_id, content (text), image (optional file)
func CreateComment(w http.ResponseWriter, r *http.Request) {
	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
		return
	}
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		help.JsonError(w, "Bad form", http.StatusBadRequest, err)
		return
	}

	postID := strings.TrimSpace(r.FormValue("post_id"))
	content := strings.TrimSpace(r.FormValue("content"))
	if postID == "" {
		help.JsonError(w, "post_id required", http.StatusBadRequest, nil)
		return
	}
	if len(content) == 0 && r.MultipartForm.File["image"] == nil {
		help.JsonError(w, "empty comment", http.StatusBadRequest, nil)
		return
	}
	if len(content) > 800 {
		help.JsonError(w, "comment too long", http.StatusBadRequest, nil)
		return
	}

	// remove consecutive more than three consecutive new lines to just two.
	re := regexp.MustCompile(`(\r\n|\r|\n){3,}`)
	content = re.ReplaceAllString(content, "\n\n")

	/* -------- optional image -------- */
	var imgPath sql.NullString
	if file, hdr, _ := r.FormFile("image"); file != nil {
		defer file.Close()
		buf, err := help.LimitRead(file, maxCommentImg)
		if err != nil {
			help.JsonError(w, "image too large", http.StatusBadRequest, err)
			return
		}
		ext := strings.ToLower(filepath.Ext(hdr.Filename))
		if ext != ".jpg" && ext != ".png" && ext != ".webp" && ext != ".jpeg" && ext != ".gif" {
			help.JsonError(w, "unsupported image format", http.StatusBadRequest, nil)
			return
		}
		if p, err := help.SaveImg(buf, "groups_comments/"); err == nil {
			imgPath.String = p
			imgPath.Valid = true
		}
	}

	/* -------- insert comment -------- */
	cID := uuid.Must(uuid.NewV4()).String()
	_, err = tp.DB.Exec(`
		INSERT INTO comments (comment_id, user_id, post_id, content, img_comment)
		VALUES (?,?,?,?,?)`,
		cID, user.ID, postID, content, imgPath)
	if err != nil {
		help.JsonError(w, "Something went wrong", 500, err)
		return
	}

	/* -------- return full comment with author info -------- */
	var resp struct {
		CommentID  string `json:"comment_id"`
		UserID     string `json:"user_id"`
		FirstName  string `json:"first_name"`
		LastName   string `json:"last_name"`
		ProfilePic string `json:"profile_pic"`
		Content    string `json:"content"`
		ImgComment string `json:"img_comment"`
		CreatedAt  string `json:"created_at"`
	}
	var imgComment sql.NullString

	err = tp.DB.QueryRow(`
	SELECT c.comment_id, u.id, u.first_name, u.last_name, u.profile_pic,
	       c.content, c.img_comment, c.created_at
	FROM comments c
	JOIN users u ON u.id = c.user_id
	WHERE c.comment_id = ?`, cID).
		Scan(&resp.CommentID, &resp.UserID, &resp.FirstName, &resp.LastName,
			&resp.ProfilePic, &resp.Content, &imgComment, &resp.CreatedAt)
	if err != nil {
		help.JsonError(w, "Something went wrong", 500, err)
		return
	}

	resp.ImgComment = ""
	if imgComment.Valid {
		resp.ImgComment = imgComment.String
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
