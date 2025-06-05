package chat

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
)

func FetchUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		help.JsonError(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed, nil)
	}
	query := "SELECT id, username, profile_pic FROM users"
	rows, err := tp.DB.Query(query)
	defer rows.Close()
	if err != nil {
		help.JsonError(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError, err)
	}
	type RespUser struct {
		User_id int `json:"user_id"`
		Username string `json:"username"`
		Image string `json:"image"`
	}

	users := []RespUser{}
	for rows.Next() {
		resp := RespUser{}
		err := rows.Scan(&resp.User_id, &resp.Username, &resp.Image)
		if err != nil {
			log.Println("error in scaning data!")
		}
		users = append(users, resp)
	}
	fmt.Println(users)
	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(users)
	if err != nil {
		log.Println("Error encoding JSON:", err)
	}
}
