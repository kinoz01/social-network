import Image from "next/image";
import styles from "@/components/chat/style/chat.module.css"; // reuse box look

export default function ChatHome() {
    return (
        <div className={styles.emptyBox}>
            <Image src="/img/empty.svg" alt="no chat" width={160} height={160} />
            <p className={styles.status}>Pick a user from DMs or Users Menu to start chatting</p>
        </div>
    );
}