import styles from "./chat.module.css";
import {  SendIcon } from "../icons";
import Message from "./Message";
import { User } from "@/lib/user";
import { fetchMessages, Messages } from "@/lib/message";
import { useEffect, useState } from "react";
// import { create } from "domain";

function Chat({user, socket}:{user?: User, socket:React.MutableRefObject<WebSocket | null>}) {
    console.log(user);
    const [message, setMessage] = useState<string>("")
    const [messages, setMessages] = useState<Messages[]>([])
    useEffect(() => {
        if(!user?.id) return
        const getMessages = async() => {
            const msgs =  await fetchMessages(user)
            setMessages(msgs)
        }
        getMessages()
    },[user] )
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if(!message.trim()) return
        console.log("message", message);
        
        const objMessage = {
            id: Date.now().toString(),
            type: "message",
            sender_id: "137cc52b-edf7-4e0b-a62d-9f2863438f66",
            receiver_id: user?.id,
            message: message,
            is_read: 0,
            created_at: new Date().toISOString(),
            first_name: "mostafa",
            last_name: "stof"
    
        }
        console.log(objMessage.created_at);
        
        setMessage("")
        socket.current?.send(JSON.stringify(objMessage))
    
    }

    
    return (
        <div className={styles.chat}>

            <div className={styles.messages}>
                {messages.map(msg => {
                    const isReceiver = msg.receiver_id === user?.id
                    const name = `${msg.first_name} ${msg.last_name}`
                  
                    // console.log("Rendering message: ", isReceiver, name);
                    return (
                        
                        <Message
                            key= {msg.id}
                            type={isReceiver ? "receiver" : "sender"} 
                            message={msg.content}
                            username= {name}
                            time={getDateAndTime(msg.created_at)}
                         />
                    )
                })}
            </div>
            <form className={styles.chatForm} onSubmit={handleSubmit}>
                <input type="text" placeholder="Send a message..." value={message} onChange={(e) => setMessage(e.target.value)}/>
                <button type="submit" className={styles.sendBtn}>
                    <SendIcon />
                </button>
            </form>
        </div >
    )

}



function getDateAndTime(time: string): string {

    const date = new Date(time)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
}



export default Chat

