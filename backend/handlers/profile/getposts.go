package profile

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	auth "social-network/handlers/authentication"
	"social-network/handlers/helpers"
	Error "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

func GetPosts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		Error.JsonError(w, "Method not allowed", 405, nil)
		return
	}
	user, err := auth.GetUser(r)
	if err != nil {
		Error.JsonError(w, "Internal Server Error", http.StatusUnauthorized, err)
		return
	}
	pageStr := r.URL.Query().Get("pageNum")
	if pageStr == "" {
		pageStr = "0"
	}
	currentPage, err := strconv.Atoi(pageStr)
	if err != nil || currentPage < 0 {
		helpers.JsonError(w, "Invalid pageNum", http.StatusBadRequest, nil)
		return
	}

	var userdata tp.UserData
	useid := strings.Split(r.URL.Path, "/")[3]
	defer r.Body.Close()
	IsFriend, err := IsFollower(w, useid, user.ID)
	if err != nil {
		Error.JsonError(w, "Internal Server Error"+fmt.Sprintf("%v", err), 500, nil)
		return
	}
	IsPublicAccount, err := IsPublicAccount(w, useid)
	if err != nil {
		Error.JsonError(w, "Internal Server Error"+fmt.Sprintf("%v", err), 500, nil)
		return
	}


	// if useid == user.ID || IsPublicAccount {
		postsQuery := `SELECT
		    posts.body,
		    posts.img_post,
		    posts.visibility,
		    posts.created_at,
		    posts.post_id,
		    users.first_name,
		    users.last_name,
		    users.profile_pic,
			users.id,
		    (
		        select
		            count(*)
		        FROM
		            like_reaction l
		        WHERE
		            l.post_id = posts.post_id
		    ) AS total_likes,
		    (
		        SELECT
		            COUNT(*)
		        FROM
		            comments c
		        WHERE
		            c.post_id = posts.post_id
		    ) AS comment_count
		FROM posts 
		LEFT JOIN users ON users.id = posts.user_id
		WHERE
		    user_id = ?
		ORDER BY
		    posts.created_at DESC
			LIMIT 5 OFFSET ?;
		`
		rows, err := tp.DB.Query(postsQuery, useid, currentPage)
		if err != nil {
			Error.JsonError(w, "Internal Server Error"+fmt.Sprintf("%v", err), 500, nil)
			return
		}
		defer rows.Close()
		var img sql.NullString

		for rows.Next() {
			var post tp.PostData
			err := rows.Scan(
				&post.Content,
				&img,
				&post.Visibility,
				&post.CreatedAt,
				&post.PostID,
				&post.FirstName,
				&post.LastName,
				&post.ProfilePic,
				&post.UserID,
				&post.TotalLIKes,
				&post.TotalComments,
			)
			if img.Valid {
				post.Imag_post = img.String
			}
			if err != nil {
				Error.JsonError(w, "Internal Server Error "+fmt.Sprintf("%v", err), 500, nil)
				return
			}
			resction, err := GitReaction(w, post.PostID, post.UserID)
			if err != nil {
				// Error.JsonError(w, "Internal Server Error "+fmt.Sprintf("%v", err), 500, nil)
				return
			}
			if resction == "ErrNoRows" {
				post.HasReact = ""
			} else {
				post.HasReact = resction
			}

			if post.Visibility == "almost-private" || !IsPublicAccount && post.Visibility == "public"  {
				if !IsFriend && useid != user.ID{
					continue
				}
			}

			if post.Visibility == "private" {
				isVisible, err := PostVisibility(post.PostID, user.ID)
				if err != nil {
					Error.JsonError(w, "Internal Server Error "+fmt.Sprintf("%v", err), 500, nil)
					return
				}
				if !isVisible {
					continue
				}
			}
			userdata.Posts = append(userdata.Posts, post)

		}
		if err = rows.Err(); err != nil {
			Error.JsonError(w, "Internal Server Error "+fmt.Sprintf("%v", err), 500, nil)
			return
		}

	// }

	userdata.PostNbr = len(userdata.Posts)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userdata.Posts)
}
