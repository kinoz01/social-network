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

// tp.DB

// GET /api/profile?id=<user-uuid>
// func ProfileData(w http.ResponseWriter, r *http.Request) {
// 	uid, _ := auth.GetUserId(r)

// 	userID := r.URL.Query().Get("id")
// 	if userID == "" {
// 		userID = uid
// 	}

// 	const q = `
// 	SELECT
// 	  u.id, u.email, u.username, u.first_name, u.last_name,
// 	  u.birthday, u.profile_pic, u.about_me, u.account_type,

// 	  (SELECT COUNT(*) FROM posts        p  WHERE p.user_id   = u.id)                           AS total_posts,
// 	  (SELECT COUNT(*) FROM group_users  g  WHERE g.users_id  = u.id)                           AS total_groups,
// 	  (SELECT COUNT(*) FROM follow_requests fr WHERE fr.followed_id = u.id AND fr.status='accepted') AS followers,
// 	  (SELECT COUNT(*) FROM follow_requests fr WHERE fr.follower_id = u.id AND fr.status='accepted') AS following
// 	FROM users u
// 	WHERE u.id = ? LIMIT 1;
// 	`

// 	var out struct {
// 		tp.User
// 		TotalPosts  int  `json:"total_posts"`
// 		TotalGroups int  `json:"total_groups"`
// 		Followers   int  `json:"followers"`
// 		Followings  int  `json:"followings"`
// 		IsFollowing bool `json:"is_following"`
// 		IsFollowed  bool `json:"is_followed"`
// 		IsOwn       bool `json:"is_own"`
// 	}

// 	err := tp.DB.QueryRow(q, userID).Scan(
// 		&out.ID, &out.Email, &out.Username, &out.FirstName, &out.LastName,
// 		&out.Bday, &out.ProfilePic, &out.AboutMe, &out.AccountType,
// 		&out.TotalPosts, &out.TotalGroups, &out.Followers, &out.Followings,
// 	)
// 	switch {
// 	case err == sql.ErrNoRows:
// 		help.JsonError(w, "user not found", http.StatusNotFound, nil)
// 		return
// 	case err != nil:
// 		help.JsonError(w, "db error", http.StatusInternalServerError, err)
// 		return
// 	}

// 	// Check if requester follows profile
// 	var isFollowing bool
// 	checkFollowing := `
// 	SELECT EXISTS (
// 		SELECT 1 FROM follow_requests
// 		WHERE (
// 			follower_id = ? AND followed_id = ?
// 		)
// 		AND status = 'accepted'
// 	);`
// 	err = tp.DB.QueryRow(checkFollowing, uid, out.ID).Scan(&isFollowing)
// 	if err != nil {
// 		help.JsonError(w, "follow check failed", http.StatusInternalServerError, err)
// 		return
// 	}
// 	out.IsFollowing = isFollowing
// 	out.IsOwn = (uid == out.ID)

// 	// Check if requester is followed by profile
// 	var isFollowed bool
// 	checkFollowed := `
// 	SELECT EXISTS (
// 		SELECT 1 FROM follow_requests
// 		WHERE (
// 			follower_id = ? AND followed_id = ?
// 		)
// 		AND status = 'accepted'
// 	);`
// 	err = tp.DB.QueryRow(checkFollowed, out.ID, uid).Scan(&isFollowed)
// 	if err != nil {
// 		help.JsonError(w, "follow check failed", http.StatusInternalServerError, err)
// 		return
// 	}
// 	out.IsFollowed = isFollowed

// 	// Privacy logic
// 	if out.AccountType == "private" && uid != out.ID && !isFollowing {
// 		type partial struct {
// 			ID          string `json:"id"`
// 			FirstName   string `json:"first_name"`
// 			LastName    string `json:"last_name"`
// 			ProfilePic  string `json:"profile_pic"`
// 			AccountType string `json:"account_type"`
// 			IsFollowing bool   `json:"is_following"`
// 			IsFollowed  bool   `json:"is_followed"`
// 			IsOwn       bool   `json:"is_own"`
// 		}

// 		w.Header().Set("Content-Type", "application/json")
// 		w.WriteHeader(http.StatusPartialContent)

// 		_ = json.NewEncoder(w).Encode(partial{
// 			ID:          out.ID,
// 			FirstName:   out.FirstName,
// 			LastName:    out.LastName,
// 			ProfilePic:  out.ProfilePic,
// 			AccountType: out.AccountType,
// 			IsFollowing: isFollowing,
// 			IsFollowed:  isFollowed,
// 			IsOwn:       out.IsOwn,
// 		})
// 		return
// 	}

// 	w.Header().Set("Content-Type", "application/json")
// 	json.NewEncoder(w).Encode(out)
// }

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
	if !IsPublicAccount && !IsFriend && useid != user.ID {
		Error.JsonError(w, "private account", http.StatusPartialContent, nil)
		return
	}

	var userdata tp.UserData
	defer r.Body.Close()
	//****************update query******************
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
    -- Count followers
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
    -- Count following
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
