import styles from "./chat.module.css";
import {  SendIcon } from "../icons";
import Message from "./Message";
import { User } from "@/lib/user";
import { fetchMessages, Messages } from "@/lib/message";
import { useEffect, useState } from "react";

function Chat({user}:{user: User}) {
    console.log(user);
    
    const [messages, setMessages] = useState<Messages[]>([])
    useEffect(() => {
        const getMessages = async() => {
            const msgs =  await fetchMessages(user)
            setMessages(msgs)
        }
        getMessages()
    }, [user])
  console.log(messages);
  console.log("ddddd",messages);
  
    return (
        <div className={styles.chat}>
            <div className={styles.messages}>
                {messages.map(msg => {
                    console.log("Rendering message: ", msg.receiver_id, user.id);
                    return (
                        
                        <Message
                            key= {msg.id}
                         type={msg.receiver_id == user.id ? "receiver" : "sender"} 
                         message={msg.content}
                         />
                    )
                })}
                {/* <Message type="sender" />
                <Message type="receiver" />
                <Message type="sender" />
                <Message type="receiver" /> */}
            </div>
            <form className={styles.chatForm}>
                <input type="text" placeholder="Send a message..." />
                <button className={styles.sendBtn}>
                    <SendIcon />
                </button>
            </form>
        </div >
    )

}

export default Chat