package chat

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	auth "social-network/handlers/authentication"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

func FetchFollowers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		help.JsonError(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed, nil)
	}

	user, err := auth.GetUser(r)
	if err != nil {
		help.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
		return
	}
	query := `SELECT u.first_name, u.last_name,
			(SELECT COUNT(*) FROM follow_requests WHERE follower_id = u.id) AS following,
			(SELECT COUNT(*) FROM follow_requests WHERE followed_id = u.id) AS followed,
			(SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS postNum FROM users u
			WHERE u.id = ?`

	row := tp.DB.QueryRow(query, user.ID)
	type Followers struct {
		First_name     string `json:"first_name"`
		Last_name      string `json:"last_name"`
		TotalFollowers int    `json:"totalFollowers"`
		TotalFollowing int    `json:"totalFollowing"`
		TotalPosts     int    `json:"totalPosts"`
	}
	follow := Followers{}
	err = row.Scan(&follow.First_name, &follow.Last_name, &follow.TotalFollowers, &follow.TotalFollowing, &follow.TotalPosts)
	if err != nil {
		fmt.Println("trueeeeeeeeeeeeeeee")
		log.Fatal("Error in scaninf followers!!")
		return
	}
	fmt.Println("mmmmm", follow)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(follow)
}
