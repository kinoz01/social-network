package chat

import (
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

// Create an upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all connections (you might want to restrict this based on origin)
		return true
	},
}

func HandleConnection(w http.ResponseWriter, r *http.Request) {
	user_id := 2
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading connection:", err)
		return
	}
	defer conn.Close()
	var mu sync.Mutex
	var clients = make(map[int]*websocket.Conn)
	mu.Lock()
	clients[user_id] = conn
	mu.Unlock()

	type WsMessages struct {
		Sender_id   int    `json:"senderId"`
		Receiver_id int    `json:"receiverId"`
		Text        string `json:"text"`
		Timestamp   string `json:"timestamp"`
	}
	for {
		var wsMsg WsMessages
		if err := conn.ReadJSON(&wsMsg); err != nil {
			log.Fatal("Message does not arrived!!")
		}
		fmt.Printf("%#v\n", wsMsg)


		mu.Lock()
		delete(clients, user_id)
		mu.Unlock()


		mu.Lock()
		if conn, exists := clients[wsMsg.Receiver_id]; exists {
			if err := conn.WriteJSON(wsMsg); err != nil {
				log.Println("Error sending message:", err)
				return
			}
		}
		mu.Unlock()
	}
}
