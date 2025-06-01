package profil

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	tp "social-network/handlers/types"

	Error "social-network/handlers/helpers"
)

func GetDateFollow(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		Error.JsonError(w, "Method not allowed", 405, nil)
		return
	}

	cookie, err := r.Cookie("session_token")
	if err != nil {
		Error.JsonError(w, "session not found", http.StatusUnauthorized, err)
		return
	}

	token := cookie.Value
	var useid string
	var userdata tp.UserData
	if err := tp.DB.QueryRow(`SELECT user_id FROM sessions WHERE token=?`, token).Scan(&useid); err != nil {
		if err == sql.ErrNoRows {
			Error.JsonError(w, "Internal Server Error "+fmt.Sprintf("%v", err), 500, nil)
			return
		}
		Error.JsonError(w, "Internal Server Error "+fmt.Sprintf("%v", err), 500, nil)
		return
	}

	err = tp.DB.QueryRow(`SELECT 
	first_name,
	last_name,
	birthday,
	about_me,
	profile_pic,
	account_type,
	email,
	username
	from 
	users 
	where 
	id = ?`, useid).Scan(&userdata.Firstname,
		&userdata.Lastname,
		&userdata.Birthday,
		&userdata.About_me,
		&userdata.Profile_pic,
		&userdata.AccountType,
		&userdata.Email,
		&userdata.Username,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			Error.JsonError(w, "Internal Server Error"+fmt.Sprintf("%v", err), 500, nil)
			return
		}
		Error.JsonError(w, "Internal Server Error"+fmt.Sprintf("%v", err), 500, nil)
		return
	}
	// var posts []tp.Post_profil
	fmt.Println("useid", useid)
	postsQuery := `SELECT
    posts.group_id,
    posts.body,
    posts.img_post,
    posts.visibility,
    posts.created_at,
    posts.post_id,
    (
        select
            count(*)
        FROM
            like_reaction l
        WHERE
            l.post_id = posts.post_id
    ) AS cte_likes,
    (
        SELECT
            COUNT(*)
        FROM
            comments c
        WHERE
            c.post_id = posts.post_id
    ) AS comment_count
FROM
    posts
WHERE
    user_id = ?
ORDER BY
    created_at DESC;
`

	rows, err := tp.DB.Query(postsQuery, useid)
	if err != nil {
		Error.JsonError(w, "Internal Server Error"+fmt.Sprintf("%v", err), 500, nil)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var post tp.PostData
		err := rows.Scan(
			&post.Group_id,
			&post.Content,
			&post.Imag_post,
			&post.Visibility,
			&post.CreatedAt,
			&post.Post_id,
			&post.Cte_likes,
			&post.Comments_nbr,
		)
		if err != nil {
			Error.JsonError(w, "Internal Server Error"+fmt.Sprintf("%v", err), 500, nil)
			return
		}
		userdata.Posts = append(userdata.Posts, post)
	}

	if err = rows.Err(); err != nil {
		Error.JsonError(w, "Internal Server Error"+fmt.Sprintf("%v", err), 500, nil)
		return
	}
	userdata.PostNbr = len(userdata.Posts)
	userdata.Posts[0].FirstName = userdata.Firstname
	userdata.Posts[0].LastName = userdata.Lastname
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userdata)
}
