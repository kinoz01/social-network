package chat

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
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
	query := "SELECT u.id, u.first_name, u.last_name, u.profile_pic FROM users u"
	rows, err := tp.DB.Query(query)
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
	fmt.Println(usersData[0])
}
