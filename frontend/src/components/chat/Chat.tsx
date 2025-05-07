import styles from "./chat.module.css";
import {  SendIcon } from "../icons";
import Message from "./Message";

function Chat() {
    
    return (
        <div className={styles.chat}>
            <div className={styles.messages}>
                <Message type="sender" />
                <Message type="receiver" />
                <Message type="sender" />
                <Message type="receiver" />
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