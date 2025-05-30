package groups

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

// Retrieves posts from a specific group based on the provided group ID.
// while supporting pagination through limit and offset parameters.
func GroupPosts(w http.ResponseWriter, r *http.Request) {
	/* ---------- params ---------- */
	groupID := r.URL.Query().Get("group_id")
	if groupID == "" {
		help.JsonError(w, "missing group_id", http.StatusBadRequest, nil)
		return
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	
	/* ---------- viewer ---------- */
	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "unauthorized", http.StatusUnauthorized, err)
		return
	}

	/* ---------- query ---------- */
	rows, err := tp.DB.Query(`
	    SELECT
	      p.post_id,
	      p.user_id,
	      p.body,
	      p.img_post,                        -- nullable
	      u.first_name,
	      u.last_name,
	      u.profile_pic,
	      lr.react_type,                     -- nullable
	      p.created_at,
	      (SELECT COUNT(*) FROM like_reaction lr2
	         WHERE lr2.post_id  = p.post_id
	           AND lr2.react_type = '1')              AS like_count,
	      (SELECT COUNT(*) FROM comments c
	         WHERE c.post_id = p.post_id)             AS comment_count
	    FROM posts p
	    JOIN users u ON u.id = p.user_id
	    LEFT JOIN like_reaction lr
	           ON  lr.post_id = p.post_id
	           AND lr.user_id = ?                     -- current viewer
	    WHERE p.group_id  = ?
	      AND p.visibility = 'public'
	    ORDER BY p.created_at DESC, p.ROWID DESC
	    LIMIT ? OFFSET ?`,
		user.ID, groupID, limit, offset)
	if err != nil {
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	/* ---------- scan ---------- */
	var list []tp.PostData
	for rows.Next() {
		var p tp.PostData
		var img sql.NullString
		var react sql.NullString

		if err := rows.Scan(
			&p.PostID,
			&p.UserID,
			&p.Content,
			&img,
			&p.FirstName,
			&p.LastName,
			&p.ProfilePic,
			&react,
			&p.CreatedAt,
			&p.TotalLIKes,
			&p.TotalComments,
		); err != nil {
			help.JsonError(w, "scan error", http.StatusInternalServerError, err)
			return
		}
		if img.Valid {
			p.Imag_post = img.String
		}
		if react.Valid {
			p.HasReact = react.String
		}
		list = append(list, p)
	}

	/* ---------- respond ---------- */
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}
