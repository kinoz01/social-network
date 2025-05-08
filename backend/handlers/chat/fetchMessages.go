package chat

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	help "social-network/handlers/helpers"
	tp "social-network/handlers/types"
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
		Id string `json:"id"`
		Sender_id   string `json:"sender_id"`
		Receiver_id string `json:"receiver_id"`
		Content     string `json:"content"`
		Is_read      int    `json:"is_read"`
		Created_at  string `json:"created_at"`
	}
	msgs := []Messages{}
	fmt.Println(user)
	query := "SELECT * FROM private_chats where (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)  ORDER BY created_at DESC LIMIT ? OFFSET ?"
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
		rows.Scan(&msg.Id, &msg.Sender_id, &msg.Receiver_id, &msg.Content, &msg.Is_read, &msg.Created_at)
		msgs = append(msgs, msg)
	}
	fmt.Println(msgs)
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(&msgs); err != nil {
		log.Fatal("can not encode data!!")
	}

}
