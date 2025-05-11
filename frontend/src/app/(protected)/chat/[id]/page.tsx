"use client"
import Chat from "@/components/chat/Chat"
// import FetchUsers from "@/components/chat/fetchUsers"
import LeftMenu from "@/components/menus/LeftMenu"
import RightMenu from "@/components/menus/RightMenu"
import { User } from "@/lib/user";
import { useState, useRef, useEffect } from "react";
// import "./chatPage.css"

function ChatPage() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const socketRef = useRef<WebSocket| null>(null)

    useEffect(() => {
        socketRef.current = new WebSocket("ws://localhost:8080/ws")
        socketRef.current.onopen = () => {
            console.log("connection opened")

        }
        socketRef.current.onmessage = (event) => {
            console.log("messages from server:", event.data)
            const date = new Date()
            const data = {
                type : "message",
                message: "yes, it is!!",
                sender_id : "137cc52b-edf7-4e0b-a62d-9f2863438f66",
                receiver_id: "048e5917-c6d5-4913-a224-3e482507ecd5",
                time: `${date}`
            }
            socketRef.current?.send(JSON.stringify(data))
        }

        socketRef.current.onclose = () => {
            console.log("connection closed!!")
        }
        socketRef.current.onerror = (error : Event) => {
            console.error('Websocket errror: ', error)
        }

        return () => {
            socketRef.current?.close()
        }
    }, [])
    
    return (
        <div className="mainContent chat">
            <LeftMenu type="chat" selectedUser={setSelectedUser}/>
            {selectedUser ? <Chat user={selectedUser}/> :<div>Select a user to start chat</div>}
            <RightMenu/>
        </div>
    )
}

export default ChatPage