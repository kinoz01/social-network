package chat

import (
	"fmt"
	"log"
	"net/http"
	auth "social-network/handlers/authentication"
	"social-network/handlers/helpers"
	tp "social-network/handlers/types"
	"time"

	"github.com/gofrs/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var Clients = make(map[string]*websocket.Conn)

func HandleConnection(w http.ResponseWriter, r *http.Request) {

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading connection:", err)
		return
	}
	defer conn.Close()

	user, err := auth.GetUser(r)
	if err != nil {
		helpers.JsonError(w, "Unauthorized", http.StatusUnauthorized, err)
		return
	}
	Clients[user.ID] = conn
	fmt.Println("user id ; ", user)
	type Messages struct {
		Id          string    `json:"id"`
		MsgType     string    `json:"type"`
		Content     string    `json:"content"`
		Sender_id   string    `json:"sender_id"`
		Receiver_id string    `json:"receiver_id"`
		Time        time.Time `json:"created_at"`
		First_name  string    `json:"first_name"`
		Last_name   string    `json:"last_name"`
	}
	msg := Messages{}
	for {
		err := conn.ReadJSON(&msg)
		fmt.Println(msg)
		if err != nil {
			log.Printf("Error reading from client %s: %v", user.ID, err)
			delete(Clients, user.ID)
			break
		}
		log.Printf("Message from %s: %s", user.ID, msg.Content)
		uuid := uuid.Must(uuid.NewV4()).String()

		if storeMessage(uuid, msg.Sender_id, msg.Receiver_id, msg.Content) {
			msg.Id = uuid
			msg.First_name = user.FirstName
			msg.Last_name = user.LastName

			if conn, exists := Clients[msg.Receiver_id]; exists {
				if err := conn.WriteJSON(msg); err != nil {
					log.Println("Error sending message:", err)
					return
				}
				log.Println("sent sucessfully from backend")

			}
			if conn, exists := Clients[msg.Sender_id]; exists {
				if err := conn.WriteJSON(msg); err != nil {
					log.Println("Error sending message:", err)
					return
				}
				log.Println("sent sucessfully from backend")

			}
			// if err != nil {
			// 	log.Printf("Error writing to client %s: %v", user.ID, err)
			// 	break
			// }

		} else {
			log.Println("message does not inserted in database!!!")
		}

	}

}

func storeMessage(uiid, senderID, receiverID, msg string) bool {
	query := "INSERT INTO private_chats VALUES(?, ?, ?, ?, 0,?)"
	_, err := tp.DB.Exec(query, uiid, senderID, receiverID, msg, time.Now().Format("2006-01-02 15:04:05"))
	return err == nil
}
