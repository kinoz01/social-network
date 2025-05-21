package chat

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	auth "social-network/handlers/authentication"
	"social-network/handlers/helpers"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

type UserData struct {
	UserId     string `json:"id"`
	First_name string `json:"first_name"`
	Last_name  string `json:"last_name"`
	Profile    string `json:"image"`
}

func FetchUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		help.JsonError(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed, nil)
	}
	user, err := auth.GetUser(r)
	if err != nil {
		helpers.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
		return
	}
	fmt.Println(user.ID)
	query := `SELECT DISTINCT u.id, u.first_name, u.last_name, u.profile_pic 
FROM users u
LEFT JOIN follow_requests fr1 ON fr1.followed_id = u.id AND fr1.follower_id = ? AND fr1.status = 'accepted'
LEFT JOIN follow_requests fr2 ON fr2.follower_id = u.id AND fr2.followed_id = ? AND fr2.status = 'accepted'
WHERE 
    u.account_type = 'public' 
    OR fr1.follower_id IS NOT NULL 
    OR fr2.followed_id IS NOT NULL;`
	rows, err := tp.DB.Query(query, user.ID, user.ID)
	if err != nil {
		log.Fatal("error in fetching data!!")
		return
	}
	usersData := []UserData{}
	for rows.Next() {
		userData := UserData{}
		if err := rows.Scan(&userData.UserId, &userData.First_name, &userData.Last_name, &userData.Profile); err != nil {
			fmt.Println("Error scanning row:", err)
			continue
		}
		usersData = append(usersData, userData)
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(&usersData); err != nil {
		fmt.Println("can not convert to json")
		return
	}
	fmt.Println(usersData)
}
