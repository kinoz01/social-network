package profile

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	auth "social-network/handlers/authentication"
	tp "social-network/handlers/types"

	Error "social-network/handlers/helpers"
)


func ProfileData(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		Error.JsonError(w, "Method not allowed", 405, nil)
		return
	}
	user, err := auth.GetUser(r)
	if err != nil {
		Error.JsonError(w, "Internal Server Error", http.StatusUnauthorized, err)
		return
	}
	useid := strings.Split(r.URL.Path, "/")[3]

	IsFriend, err := IsFollower(w, useid, user.ID)
	if err != nil {
		Error.JsonError(w, "Internal Server Error", 500, nil)
		return
	}
	IsPublicAccount, err := IsPublicAccount(w, useid)
	if err != nil {
		Error.JsonError(w, "Internal Server Error", 500, nil)
		return
	}
	var userdata tp.UserData
	if !IsPublicAccount && !IsFriend && useid != user.ID {
		userdata.Id = useid
		if IsPublicAccount{
			userdata.AccountType = "public"
		}else{
			userdata.AccountType = "private"
		}
		w.WriteHeader(http.StatusPartialContent)
		json.NewEncoder(w).Encode(userdata)
		return
	}


	defer r.Body.Close()
	err = tp.DB.QueryRow(`SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.birthday,
    u.about_me,
    u.profile_pic,
    u.account_type,
    u.email,
    u.username,
    COALESCE(
        (
            (
                SELECT
                    COUNT(*)
                FROM
                    follow_requests
                WHERE
                    followed_id = u.id
                    AND status = 'accepted'
            )
        ),
        0
    ) AS total_followers,
    COALESCE(
        (
            SELECT
                COUNT(*)
            FROM
                follow_requests
            WHERE
                follower_id = u.id
                AND status = 'accepted'
        ),
        0
    ) as total_following,
    COALESCE(
        (
            SELECT
                COUNT(*)
            from
                posts
            WHERE
                posts.user_id = u.id
        ),
        0
    ) as total_posts
FROM
    users u
WHERE
    u.id = ?`, useid).Scan(&userdata.Id,
		&userdata.Firstname,
		&userdata.Lastname,
		&userdata.Birthday,
		&userdata.About_me,
		&userdata.Profile_pic,
		&userdata.AccountType,
		&userdata.Email,
		&userdata.Username,
		&userdata.TotalFollowers,
		&userdata.TotalFollowings,
		&userdata.PostNbr,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			Error.JsonError(w, "Internal Server Error"+fmt.Sprintf("%v", err), 500, nil)
			return
		}
		Error.JsonError(w, "Internal Server Error"+fmt.Sprintf("%v", err), 500, nil)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(userdata)
}
