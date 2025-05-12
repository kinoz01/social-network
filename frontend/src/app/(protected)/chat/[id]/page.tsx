"use client"
import Chat from "@/components/chat/Chat"
import LeftMenu from "@/components/menus/LeftMenu"
import RightMenu from "@/components/menus/RightMenu"
import { Messages } from "@/lib/message";
import { User } from "@/lib/user";
import { useState, useRef, useEffect } from "react";

function ChatPage() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [receiveMsg, setReceiveMsg] = useState<Messages | null>(null)
    const socketRef = useRef<WebSocket| null>(null)

    useEffect(() => {
        socketRef.current = new WebSocket("ws://localhost:8080/ws")
        socketRef.current.onopen = () => {
            console.log("connection opened")

        }
        socketRef.current.onmessage = (event) => {
            console.log("messages from server:", event.data)
            const data = JSON.parse(event.data)
            console.log(data);
            setReceiveMsg(data)
        
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
            {selectedUser ? <Chat user={selectedUser} socket={socketRef} msg={receiveMsg}/> :<div>Select a user to start chat</div>}
            <RightMenu/>
        </div>
    )
}

export default ChatPage