import Image from "next/image";
import styles from "./chat.module.css";

function Message({ type }: { type: "sender" | "receiver" }) {

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
                <span className={styles.ListItemName}>Wayne Burton</span>
            </div>
            <div className={styles.messageContent}>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. At minima saepe sunt neque eius, id dolor voluptate libero, sit nostrum voluptatibus similique in perferendis deserunt fugit! Assumenda porro dolorum sunt?
            </div>
            <div className={styles.messageDate}>
                01/01/2025
            </div>

        </div >
    )

}

export default Message