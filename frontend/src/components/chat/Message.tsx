import Image from "next/image";
import styles from "./chat.module.css";

function Message({ type, message, username, time}: { type: "sender" | "receiver" , message:string, username: string, time:string}) {
    // console.log("gggg", username)
    return (
        <div className={`${styles.message} ${styles[type]}`}>
            <div className={styles.header}>
                <Image
                    className={styles.userIcon}
                    src="https://images.unsplash.com/photo-1742626157100-a25483dda2ea?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDM0fGJvOGpRS1RhRTBZfHxlbnwwfHx8fHw%3D"
                    alt=""
                    width={40}
                    height={40}
                />
                <span className={styles.ListItemName}>{username}</span>
            </div>
            <div className={styles.messageContent}>
                {message}
            </div>
            <div className={styles.messageDate}>
                {time}
            </div>

        </div >
    )

}

export default Message