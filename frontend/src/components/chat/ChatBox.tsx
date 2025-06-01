"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./style/chat.module.css";
import Loading from "@/components/Loading";
import { API_URL } from "@/lib/api_url";

interface DMChatBoxProps {
    peerId: string;
}

/* purely presentational for now - messages coming next step */
export default function ChatBox({ peerId }: DMChatBoxProps) {
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);

    /* send button placeholder */
    const sendMsg = () => {
        if (!text.trim()) return;
        /* later: wsClient.send({type:"dmMessage", to:peerId, content:text}) */
        setText("");
    };

    if (loading) return <Loading />;

    return (
        <div className={styles.chatBox}>
            {/* messages list – will be filled by WS later */}
            <div className={styles.messages}>
                <div className={styles.emptyBox}>
                    <Image
                        src="/img/empty.svg"
                        alt="Empty chat"
                        width={150}
                        height={150}
                    />
                    <p className={styles.status}>
                        Start your conversation with&nbsp;
                        <code>{peerId.slice(0, 8)}</code>
                    </p>
                </div>
            </div>

            {/* input row (re-use the same controls) */}
            <div className={styles.inputRow}>
                <input
                    className={styles.input}
                    placeholder="Type a message…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={700}
                    onKeyDown={(e) => e.key === "Enter" && sendMsg()}
                />
                <button className={styles.sendBtn} onClick={sendMsg}>
                    Send
                </button>
            </div>
        </div>
    );
}
