import styles from "./chat.module.css";
import {  SendIcon } from "../icons";
import Message from "./Message";
import { getUser, User } from "@/lib/user";
import { fetchMessages, Messages } from "@/lib/message";
import { useEffect, useRef, useState } from "react";

const EMOJIS = ["😀", "😂", "😍", "👍", "🙏", "😎", "😢"];

function Chat({user, socket, msg}:{user?: User, socket:React.MutableRefObject<WebSocket | null>, msg:Messages| null}) {
    console.log(user);
    const [message, setMessage] = useState<string>("")
    const [messages, setMessages] = useState<Messages[]>([])
    const [currentUser, setCurrentUser] = useState<User|null>(null)
    const [moreMessages, setMoreMessages] = useState<boolean>(true)
    const messageContainer = useRef<HTMLDivElement>(null)
    const msgNumRef = useRef<number>(0)
    const [showEmojis, setShowEmojis] = useState(false)


    useEffect(() => {
        const getCurrentUser = async() => {
            const loggedUser = await getUser()
            setCurrentUser(loggedUser)
        }
        getCurrentUser()
    },[])

    useEffect(() => {
        if (!msg || !msg.receiver_id || !msg.content) return;
    
        const isCurrentUserSender = msg.sender_id === currentUser?.id;
        const isCurrentUserReceiver = msg.receiver_id === currentUser?.id;
        const isChatWithSenderOpen = user?.id === msg.sender_id;
        const isChatWithReceiverOpen = user?.id === msg.receiver_id;
    
        // 1. Show message in sender's chat if the sender is the current user and chatting with the receiver
        if (isCurrentUserSender && isChatWithReceiverOpen) {
            setMessages(prev => [...prev, msg]);
            scrollToBottom();
        }
    
        // 2. Show message in receiver's chat if receiver is current user and is chatting with sender
        else if (isCurrentUserReceiver && isChatWithSenderOpen) {
            setMessages(prev => [...prev, msg]);
            scrollToBottom();
        }
    
        // 3. In all cases where receiver is current user, show notification
        if (isCurrentUserReceiver) {
            displayNotification(`${msg.first_name} ${msg.last_name}`);
        }
    
    }, [msg, currentUser?.id, user?.id]);
    
    const scrollToBottom = () => {
        setTimeout(() => {
            const container = messageContainer.current;
            if (container) container.scrollTop = container.scrollHeight;
        }, 100);
    };
    

    useEffect(() => {
        if(!user?.id || !currentUser?.id) return
        const getMessages = async() => {
            const msgs =  await fetchMessages(user, currentUser, 0)
            msgs.sort().reverse()
            setMessages(msgs)
            setMoreMessages(msgs.length > 0)
            setTimeout(() => {
                const container = messageContainer.current;
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            }, 100); 
            if (msgs.length > 0) msgNumRef.current = 4

        }
        getMessages()
    },[user, currentUser] )

    const handleScroll = debounce(() => {
        const container = messageContainer.current
        if (!container || !moreMessages) return

        if(container.scrollTop < 10) {
            getMoreMessages()
        }
    }, 1000)


    const getMoreMessages = async() => {
        if(!moreMessages || !user || !currentUser) return
        const currentMsgNum = msgNumRef.current;
        const msgs =  await fetchMessages(user, currentUser, currentMsgNum)
        const container = messageContainer.current;
    if (!container) return;
        const oldScroll = container.scrollHeight;
        // console.log(previousScrollHeight, "previous");
        
        if(msgs.length === 0) {
            setMoreMessages(false)
        } else {
            msgs.sort().reverse()
            setMessages(prev => [...msgs, ...prev]);
            if(msgs.length > 0) msgNumRef.current =  currentMsgNum + 4
            setTimeout(() => {
                if (container) {
                    container.scrollTop = container.scrollHeight - oldScroll - 20; // 3. Scroll delta
                    
                }
            }, 100);
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
            <div className={styles.emojiContainer}>
                    <button 
                        type="button" 
                        className={styles.emojiToggleBtn} 
                        onClick={() => setShowEmojis(prev => !prev)}
                    >
                        😊
                    </button>

                    {showEmojis && (
                        <div className={styles.emojiDropdown}>
                            {EMOJIS.map((emoji, index) => (
                                <span 
                                    key={index} 
                                    className={styles.emoji} 
                                    onClick={() => {
                                        setMessage(prev => prev + emoji)
                                        setShowEmojis(false) // Hide emoji picker after selecting
                                    }}
                                >
                                    {emoji}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                
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

const displayNotification = (username: string) => {
    const chat = document.querySelector('.chat')
    const containerNotification = document.createElement('div')
    const messageNotification = document.createElement('div')
    const timerNotification = document.createElement('div')
    containerNotification.className = styles.messageNotification
    timerNotification.className = styles.timer
    messageNotification.innerHTML = `<strong>${username}</strong> has sent you a new message`
    containerNotification.append(messageNotification, timerNotification)
    chat?.appendChild(containerNotification)
    console.log("suuuure");
    setTimeout(() => containerNotification.remove(), 5000)
    
}

export default Chat

