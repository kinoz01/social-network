import styles from "./chat.module.css";
import {  SendIcon } from "../icons";
import Message from "./Message";
import { getUser, User } from "@/lib/user";
import { fetchMessages, Messages } from "@/lib/message";
import { useEffect, useRef, useState } from "react";

function Chat({user, socket, msg}:{user?: User, socket:React.MutableRefObject<WebSocket | null>, msg:Messages| null}) {
    console.log(user);
    const [message, setMessage] = useState<string>("")
    const [messages, setMessages] = useState<Messages[]>([])
    const [currentUser, setCurrentUser] = useState<User|null>(null)
    // const [msgNum, setMsgNum] = useState<number>(0)
    // const [loading, setLoading] = useState<boolean>(false);
    const [moreMessages, setMoreMessages] = useState<boolean>(true)
    const messageContainer = useRef<HTMLDivElement>(null)
    const msgNumRef = useRef<number>(0)

    useEffect(() => {
        const getCurrentUser = async() => {
            const loggedUser = await getUser()
            setCurrentUser(loggedUser)
        }
        getCurrentUser()
    },[])

    useEffect(() => {
        console.log("msg",msg);
        
        if(msg && msg.receiver_id && msg.content) {
            setMessages(prev => [...prev, msg])
            
        }
        
    }, [msg])

    useEffect(() => {
        if(!user?.id || !currentUser?.id) return
        const getMessages = async() => {
            const msgs =  await fetchMessages(user, currentUser, msgNumRef.current)
            setMessages(prev => msgNumRef.current === 0 ? msgs : [...msgs, ...prev])
            msgNumRef.current += 4
            setMoreMessages(msgs.length > 0)
           
            const container = messageContainer.current
            if (container) container.

        }
        getMessages()
    },[user, currentUser] )

    const handleScroll = debounce(() => {
        const container = messageContainer.current
        console.log("msgNum", msgNumRef.current);
        console.log("scroll", messageContainer.current?.scrollTop);
        console.log("container",container);
        
        if (!container || !moreMessages) return

        if(container.scrollTop < 10) {
            getMoreMessages()
        }
    }, 1000)


    const getMoreMessages = async() => {
        if(!moreMessages || !user || !currentUser) return
        const msgs =  await fetchMessages(user, currentUser, msgNumRef.current)
        if(msgs.length === 0) {
            setMoreMessages(false)
        } else {
            setMessages(prev => [...msgs, ...prev]);
            msgNumRef.current += 4
        }
    }
    
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if(!message.trim()) return
        console.log("message", message);
        
        const objMessage = {
            type: "message",
            sender_id: currentUser?.id,
            receiver_id: user?.id,
            content: message,
            is_read: 0,
            created_at: new Date().toISOString(),
    
        }
        setMessage("")
        socket.current?.send(JSON.stringify(objMessage))
    
    }

    useEffect(() => {
        const container = messageContainer.current
        if(container) container.addEventListener('scroll', handleScroll)

        return () => {
            if(container) container.removeEventListener("scroll", handleScroll)
        }
    }, [handleScroll])
    return (
        <div className={styles.chat}>

            <div className={styles.messages} ref={messageContainer}>
                {messages.map(msg => {
                    const isReceiver = msg.receiver_id === user?.id
                    const name = `${msg.first_name} ${msg.last_name}`
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

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}


export default Chat

