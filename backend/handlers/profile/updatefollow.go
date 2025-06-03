package profile

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	tp "social-network/handlers/types"

	Error "social-network/handlers/helpers"
)

func ProfileData(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		Error.JsonError(w, "Method not allowed", 405, nil)
		return
	}

	// cookie, err := r.Cookie("session_token")
	// if err != nil {
	// 	Error.JsonError(w, "session not found", http.StatusUnauthorized, err)
	// 	return
	// }
	fmt.Println("r", r.URL.Path)

	// token := cookie.Value
	// var useid string
	var userdata tp.UserData
	useid := strings.Split(r.URL.Path, "/")[3]
	// if err := tp.DB.QueryRow(`SELECT user_id FROM sessions WHERE token=?`, token).Scan(&useid); err != nil {
	// 	if err == sql.ErrNoRows {
	// 		Error.JsonError(w, "Internal Server Error "+fmt.Sprintf("%v", err), 500, nil)
	// 		return
	// 	}
	// 	Error.JsonError(w, "Internal Server Error "+fmt.Sprintf("%v", err), 500, nil)
	// 	return
	// }
	fmt.Println("iddd", useid)
	err := tp.DB.QueryRow(`SELECT 
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
    ) AS cte_likes,
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
    posts.created_at DESC;
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
			&post.GroupID,
			&post.Content,
			&post.Imag_post,
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
		if err != nil {
			Error.JsonError(w, "Internal Server Error "+fmt.Sprintf("%v", err), 500, nil)
			return
		}
		resction , err := GitReaction(w ,post.PostID, post.UserID)
		fmt.Println("react", resction)
		post.HasReact = resction
		userdata.Posts = append(userdata.Posts, post)
	}
	fmt.Println("posr======", userdata.Posts)
	if err = rows.Err(); err != nil {
		Error.JsonError(w, "Internal Server Error "+fmt.Sprintf("%v", err), 500, nil)
		return
	}
	userdata.PostNbr = len(userdata.Posts)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userdata)
}

func GitReaction(w http.ResponseWriter, postid string, useid string) (string, error) {
	var react string
	err := tp.DB.QueryRow(`SELECT
    react_type
FROM
    like_reaction
where
    like_reaction.user_id = ?
    AND like_reaction.post_id = ?
`, useid, postid).Scan(&react)
	if err != nil {
		Error.JsonError(w, "Internal Server Error "+fmt.Sprintf("%v", err), 500, nil)
		return "", err
	}
	return react, nil
}
