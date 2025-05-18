package groups

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// GET /api/groups/comments?post_id=...&limit=&offset=
func GetCommentsHandler(w http.ResponseWriter, r *http.Request) {
	postID := r.URL.Query().Get("post_id")
	if postID == "" {
		http.Error(w, "post_id required", http.StatusBadRequest)
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 || limit > 50 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	rows, err := tp.DB.Query(`
		SELECT c.comment_id, u.id, u.first_name, u.last_name, u.profile_pic,
		       c.content, c.img_comment, c.created_at
		FROM comments c
		JOIN users u ON u.id = c.user_id
		WHERE c.post_id = ?
		ORDER BY c.created_at DESC, c.ROWID DESC
		LIMIT ? OFFSET ?`, postID, limit, offset)
	if err != nil {
		help.JsonError(w, "DB error", 500, err)
		return
	}
	defer rows.Close()

	type comment struct {
		CommentID  string `json:"comment_id"`
		UserID     string `json:"user_id"`
		FirstName  string `json:"first_name"`
		LastName   string `json:"last_name"`
		ProfilePic string `json:"profile_pic"`
		Content    string `json:"content"`
		ImgComment string `json:"img_comment"`
		CreatedAt  string `json:"created_at"`
	}

	var list []comment
	for rows.Next() {
		var (
			img sql.NullString
			c   comment
		)
		if err := rows.Scan(
			&c.CommentID, &c.UserID, &c.FirstName, &c.LastName, &c.ProfilePic,
			&c.Content, &img, &c.CreatedAt); err != nil {
			help.JsonError(w, "scan", 500, err)
			return
		}
		c.ImgComment = img.String
		list = append(list, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}
