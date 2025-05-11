package chat

import (
	"fmt"
	"log"
	"net/http"
	"social-network/handlers/authentication"
	"social-network/handlers/helpers"

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
	fmt.Println("user id ; ", user.ID)
	type Messages struct {
		MsgType string `json:"type"`
		Message string `json:"message"`
		Sender_id string `json:"sender_id"`
		Receiver_id string `json:"receiver_id"`
		Time string `json:"time"`
	}
	msg := Messages{}
	for {
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Printf("Error reading from client %s: %v", user.ID, err)
			delete(Clients, user.ID)
			break
		}
		log.Printf("Message from %s: %s", user.ID, msg.Message)

		err = conn.WriteJSON(msg)
		if err != nil {
			log.Printf("Error writing to client %s: %v", user.ID, err)
			break
		}

	}

}
