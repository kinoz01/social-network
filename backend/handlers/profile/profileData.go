package profile

import (
	"database/sql"
	"encoding/json"
	"net/http"

	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers" // JsonError
	tp "social-network/handlers/types"     // tp.DB
)

// GET /api/profile?id=<user-uuid>
func ProfileData(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		help.JsonError(w, "method not allowed", http.StatusMethodNotAllowed, nil)
		return
	}
	uid, _ := auth.GetUserId(r)
	
	userID := r.URL.Query().Get("id")
	if userID == "" {
		userID = uid
	}

	const q = `
	SELECT
	  u.id, u.email, u.username, u.first_name, u.last_name,
	  u.birthday, u.profile_pic, u.about_me, u.account_type,
	
	  (SELECT COUNT(*) FROM posts        p  WHERE p.user_id   = u.id)                           AS total_posts,
	  (SELECT COUNT(*) FROM group_users  g  WHERE g.users_id  = u.id)                           AS total_groups,
	  (SELECT COUNT(*) FROM follow_requests fr WHERE fr.followed_id = u.id AND fr.status='accepted') AS followers,
	  (SELECT COUNT(*) FROM follow_requests fr WHERE fr.follower_id = u.id AND fr.status='accepted') AS following
	FROM users u
	WHERE u.id = ? LIMIT 1;
	`

	var out struct {
		tp.User
		TotalPosts  int `json:"total_posts"`
		TotalGroups int `json:"total_groups"`
		Followers   int `json:"followers"`
		Following   int `json:"following"`
	}

	err := tp.DB.QueryRow(q, userID).Scan(
		&out.ID, &out.Email, &out.Username, &out.FirstName, &out.LastName,
		&out.Bday, &out.ProfilePic, &out.AboutMe, &out.AccountType,
		&out.TotalPosts, &out.TotalGroups, &out.Followers, &out.Following,
	)
	switch {
	case err == sql.ErrNoRows:
		help.JsonError(w, "user not found", http.StatusNotFound, nil)
		return
	case err != nil:
		help.JsonError(w, "db error", http.StatusInternalServerError, err)
		return
	}

	// If the account is private, only return data if the viewer is the user themselves.
	if out.AccountType == "private" && uid != out.ID {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(out)
}
