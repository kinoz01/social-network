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
//**************************handle Split err******************************
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		Error.JsonError(w, "Invalid URL path", http.StatusBadRequest, nil)
		return
	}
	useid := pathParts[3]

	if useid == "" {
		Error.JsonError(w, "User ID is required", http.StatusBadRequest, nil)
		return
	}

	defer r.Body.Close()


	if !Found(useid) {
		Error.JsonError(w, "user not found", 404, nil)
		return
	}

	is_follower, err := IsFollower(w, useid, user.ID)
	if err != nil {
		Error.JsonError(w, "Internal Server Error"+fmt.Sprintf("%v", err), 500, nil)
		return
	}
	IsPublicAccount, err := IsPublicAccount(w, useid)
	if err != nil {
		Error.JsonError(w, "Internal Server Error"+fmt.Sprintf("%v", err), 500, nil)
		return
	}


// 	var is_accountexist , is_follower, IsPublicAccount bool

// 	err = tp.DB.QueryRow(`
// SELECT
//     CASE
//         WHEN users.id IS NOT NULL THEN 1
//         ELSE 0
//     END as is_accountexist ,
//     CASE
//         WHEN follow_requests.follower_id IS NOT NULL THEN 1
//         ELSE 0
//     END as is_follower,
//     CASE WHEN users.account_type = "public" THEN 1 ELSE 0 END AS is_public
// FROM
//     users
//     LEFT JOIN follow_requests  ON follow_requests.follower_id = ?
//     AND follow_requests.followed_id = users.id
//     AND follow_requests.status = 'accepted'
// WHERE
//     users.id = ?`, user.ID, useid).Scan(&is_accountexist ,&is_follower, &IsPublicAccount)
// 	if err != nil {
// 		if err == sql.ErrNoRows {
// 			Error.JsonError(w, "user not found", 404, nil)
// 			return
// 		}
// 		Error.JsonError(w, "Internal Server Error", 500, nil)
// 	}



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
		Error.JsonError(w, "Internal Server Error", 500, nil)
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

		if post.Visibility == "almost-private" || (!IsPublicAccount && post.Visibility == "public") {
			fmt.Println("isvissible")
			if !is_follower && useid != user.ID {
				continue
			}
		}

		if post.Visibility == "private" {
			isVisible, err := PostVisibility(post.PostID, user.ID)
			if err != nil {
				Error.JsonError(w, "Internal Server Error "+fmt.Sprintf("%v", err), 500, nil)
				return
			}
			if !isVisible || !is_follower && useid != user.ID {
				continue
			}
		}
		userdata.Posts = append(userdata.Posts, post)

	}
	if err = rows.Err(); err != nil {
		Error.JsonError(w, "Internal Server Error "+fmt.Sprintf("%v", err), 500, nil)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userdata.Posts)
}
