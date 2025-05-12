package chat

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
	"time"
)

func FetchMessages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		help.JsonError(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed, nil)
	}
	fmt.Println("yes1")
	type UsersId struct {
		Sender_id   string `json:"sender_id"`
		Receiver_id string `json:"receiver_id"`
	}
	user := UsersId{}
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		help.JsonError(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest, nil)
		return
	}
	fmt.Println("yes2")
	type Messages struct {
		Id          string    `json:"id"`
		Sender_id   string    `json:"sender_id"`
		Receiver_id string    `json:"receiver_id"`
		Content     string    `json:"content"`
		Is_read     bool       `json:"is_read"`
		Created_at  time.Time `json:"created_at"`
		First_name  string    `json:"first_name"`
		Last_name   string    `json:"last_name"`
	}
	msgs := []Messages{}
	fmt.Println(user)
	query := "SELECT p.id, p.sender_id, p.receiver_id, p.content, p.is_read, p.created_at, u.first_name, u.last_name FROM private_chats p inner join users u on u.id = p.sender_id where (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)  ORDER BY p.created_at DESC LIMIT ? OFFSET ?"
	rows, err := tp.DB.Query(query, user.Sender_id, user.Receiver_id, user.Receiver_id, user.Sender_id, 10, 0)
	fmt.Println("errr,,,", err)
	if err != nil {
		fmt.Println("fffff")
		help.JsonError(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest, nil)
		return
	}
	for rows.Next() {
		msg := Messages{}
		// id := ""
		err := rows.Scan(&msg.Id, &msg.Sender_id, &msg.Receiver_id, &msg.Content, &msg.Is_read, &msg.Created_at, &msg.First_name, &msg.Last_name)
		if err != nil {
			fmt.Println("Scan error:", err)
			continue
		}
		msgs = append(msgs, msg)
	}
	// fmt.Println(msgs)
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(&msgs); err != nil {
		log.Fatal("can not encode data!!")
	}

}
