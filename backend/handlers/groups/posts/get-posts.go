package groups

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// Retrieves posts from a specific group based on the provided group ID.
// while supporting pagination through limit and offset parameters.
func GroupPosts(w http.ResponseWriter, r *http.Request) {
	groupID := r.URL.Query().Get("group_id")
	if groupID == "" {
		help.JsonError(w, "missing group_id", http.StatusBadRequest, nil)
		return
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	rows, err := tp.DB.Query(`
	    SELECT
	        p.post_id,
	        p.body,
	        p.img_post,          -- nullable
	        p.created_at,
	        u.id         AS user_id,
	        u.first_name,
	        u.last_name,
	        u.profile_pic
	    FROM posts p
	    JOIN users u ON u.id = p.user_id
	    WHERE p.group_id  = ?
	      AND p.visibility = 'public'
	    ORDER BY p.created_at DESC, p.ROWID DESC
	    LIMIT ? OFFSET ?`, groupID, limit, offset)
	if err != nil {
		help.JsonError(w, "DB error", http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	type post struct {
		PostID     string `json:"post_id"`
		Body       string `json:"body"`
		ImgPost    string `json:"img_post"`
		CreatedAt  string `json:"created_at"`
		UserID     string `json:"user_id"`
		FirstName  string `json:"first_name"`
		LastName   string `json:"last_name"`
		ProfilePic string `json:"profile_pic"`
	}

	var list []post
	for rows.Next() {
		var img sql.NullString
		var p post
		if err := rows.Scan(
			&p.PostID, &p.Body, &img, &p.CreatedAt,
			&p.UserID, &p.FirstName, &p.LastName, &p.ProfilePic); err != nil {
			help.JsonError(w, "scan error", http.StatusInternalServerError, err)
			return
		}
		p.ImgPost = img.String // "" when NULL
		list = append(list, p)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}
