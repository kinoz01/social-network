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

type UserId struct {
	UserId string `json:"logeduser_id"`
}

func ProfileData(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		Error.JsonError(w, "Method not allowed", 405, nil)
		return
	}
	var userdata tp.UserData
	useid := strings.Split(r.URL.Path, "/")[3]
	fmt.Println("iddd", useid)
	var userid UserId
	err := json.NewDecoder(r.Body).Decode(&userid)
	if err != nil {
		Error.JsonError(w, "Internal Server Error ", http.StatusBadRequest, nil)
		return
	}
	defer r.Body.Close()
	fmt.Println("uhada", userid.UserId)
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

	isfreand := IsFollower(w, useid, userid.UserId)
	fmt.Println("isfreand", isfreand)


if isfreand {


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
		resction, err := GitReaction(w, post.PostID, post.UserID)
		fmt.Println("react", resction)
		if err != nil {
			Error.JsonError(w, "Internal Server Error "+fmt.Sprintf("%v", err), 500, nil)
			return
		}
		if resction == "ErrNoRows" {
			post.HasReact = ""
		} else {
			post.HasReact = resction
		}
		userdata.Posts = append(userdata.Posts, post)
	}
	fmt.Println("posr======", userdata.Posts[0].HasReact)
	if err = rows.Err(); err != nil {
		Error.JsonError(w, "Internal Server Error "+fmt.Sprintf("%v", err), 500, nil)
		return
	}



}
	
	userdata.PostNbr = len(userdata.Posts)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userdata)
}

func GitReaction(w http.ResponseWriter, postid string, userid string) (string, error) {
	var react string
	err := tp.DB.QueryRow(`SELECT
    react_type
FROM
    like_reaction
where
    like_reaction.user_id = ?
    AND like_reaction.post_id = ?
`, userid, postid).Scan(&react)
	if err != nil {
		if err == sql.ErrNoRows {
			return "ErrNoRows", nil
		}
		Error.JsonError(w, "Internal Server Error "+fmt.Sprintf("%v", err), 500, nil)
		return "", err
	}
	return react, nil
}

func IsFollower(w http.ResponseWriter, userProfil_id string, userLoged_id string) bool {
fmt.Println("molpofile", userProfil_id)
fmt.Println("mol cookes", userLoged_id)

	return true
}
