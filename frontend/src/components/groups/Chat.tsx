"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import styles from "./style/chat.module.css";
import { useWS } from "@/context/wsClient";
import { throttle } from "./GroupFeed";
import Loading from "../Loading";
import Image from "next/image";

/* ─────────────────────────────── Types ─────────────────────────────── */
interface ChatMsg {
    id: string;
    sender_id: string;
    first_name: string;
    last_name: string;
    profile_pic: string | null;
    content: string;
    created_at: string;
}

/* ─────────────────────────────── Constants ─────────────────────────────── */
const PAGE = 20;
const EMOJIS = [ /* emoji list unchanged */] as const;

/* ─────────────────────────────── Component ─────────────────────────────── */
export default function Chat() {
    const { id: groupId } = useParams() as { id: string };
    const { socket, send } = useWS();

    const [msgs, setMsgs] = useState<ChatMsg[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [text, setText] = useState("");
    const [showEmojis, setShowEmojis] = useState(false);
    const [loadingFirst, setLoadingFirst] = useState(true);

    const idSetRef = useRef<Set<string>>(new Set());
    const listRef = useRef<HTMLDivElement>(null);
    const prevHeightRef = useRef<number | null>(null);

    /* ─────────────────────── Helpers ─────────────────────── */
    const fetchPage = async (offsetValue: number) => {
        const qs = `group_id=${groupId}&limit=${PAGE}&offset=${offsetValue}`;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/chat?${qs}`, {
            credentials: "include",
            cache: "no-store"
        });

        if (!res.ok) return [];
        return await res.json() as ChatMsg[];
    };

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });

    const sendMsg = () => {
        if (!text.trim()) return;
        send({ type: "chatMessage", groupId, content: text.trim() });
        setText("");
    };

    /* ─────────────────────── Initial Fetch ─────────────────────── */
    useEffect(() => {
        (async () => {
            if (!groupId) return;

            setLoadingFirst(true);
            const page = await fetchPage(0);
            const validMessages = Array.isArray(page) ? page : [];

            idSetRef.current = new Set(validMessages.map(m => m.id));
            setMsgs(validMessages);
            setOffset(validMessages.length);
            setHasMore(validMessages.length === PAGE);
            setLoadingFirst(false);
        })();
    }, [groupId]);

    /* ─────────────────────── Scroll Lazy Loading ─────────────────────── */
    useEffect(() => {
        const box = listRef.current;
        if (!box || !hasMore) return;

        const handleScroll = throttle(async () => {
            if (box.scrollTop < 150) {
                const olderMessages = await fetchPage(offset);

                if (!olderMessages.length) {
                    setHasMore(false);
                    return;
                }

                prevHeightRef.current = box.scrollHeight;
                const uniqueMessages = olderMessages.filter(m => !idSetRef.current.has(m.id));
                uniqueMessages.forEach(m => idSetRef.current.add(m.id));

                setMsgs(prev => [...uniqueMessages, ...prev]);
                setOffset(prev => prev + uniqueMessages.length);
                setHasMore(olderMessages.length === PAGE);
            }
        }, 300);

        box.addEventListener("scroll", handleScroll);
        return () => box.removeEventListener("scroll", handleScroll);
    }, [offset, hasMore, groupId]);

    /* ─────────────────────── Live WebSocket Listener ─────────────────────── */
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (ev: MessageEvent) => {
            let data: any;
            try {
                data = JSON.parse(ev.data);
            } catch {
                return;
            }

            if (data.groupId !== groupId || data.type !== "chatMessage") return;
            if (idSetRef.current.has(data.message.id)) return;

            idSetRef.current.add(data.message.id);
            setMsgs(prev => [...prev, data.message]);
            setOffset(prev => prev + 1);
        };

        socket.addEventListener("message", handleMessage);
        send({ type: "subscribeChat", groupId });

        return () => socket.removeEventListener("message", handleMessage);
    }, [groupId, send, socket]);

    /* ─────────────────────── Scroll Management ─────────────────────── */
    useLayoutEffect(() => {
        const box = listRef.current;
        if (!box) return;

        if (prevHeightRef.current !== null) {
            box.scrollTop = box.scrollHeight - prevHeightRef.current;
            prevHeightRef.current = null;
        } else {
            box.scrollTop = box.scrollHeight;
        }
    }, [msgs]);

    /* ─────────────────────── Render ─────────────────────── */
    if (!groupId) return null;

    if (loadingFirst) {
        return <Loading />;
    }

    if (!msgs.length) {
        return (
            <div className={styles.emptyBox}>
                <Image src="/img/empty.svg" alt="Empty chat" width={180} height={180} />
                <p className={styles.status}>No messages yet — be the first!</p>
                <ChatInput />
            </div>
        );
    }

    let lastDay = "";

    return (
        <div className={styles.chatBox}>
            <div className={styles.messages} ref={listRef}>
                {msgs.map(msg => {
                    const day = formatDate(msg.created_at);
                    const showDivider = day !== lastDay;
                    lastDay = day;

                    return (
                        <div key={msg.id}>
                            {showDivider && (
                                <div key={`day-${day}-${msg.id}`} className={styles.dayDivider}>
                                    {day}
                                </div>
                            )}
                            <div className={styles.msg}>
                                <img
                                    src={msg.profile_pic
                                        ? `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${msg.profile_pic}`
                                        : "/img/default-avatar.png"}
                                    className={styles.avatar}
                                    alt=""
                                />
                                <div className={styles.bubble}>
                                    <span className={styles.name}>
                                        {msg.first_name} {msg.last_name}
                                        <span className={styles.time}> {formatTime(msg.created_at)}</span>
                                    </span>
                                    <p className={styles.content}>{msg.content}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <ChatInput />
        </div>
    );

    function ChatInput() {
        return (
            <div className={styles.inputRow}>
                <button
                    type="button"
                    className={styles.emojiBtn}
                    onClick={() => setShowEmojis(prev => !prev)}
                >🙂</button>

                <input
                    className={styles.input}
                    placeholder="Type a message…"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    maxLength={700}
                    onKeyDown={e => { if (e.key === "Enter") { sendMsg(); setShowEmojis(false); } }}
                />

                <button
                    className={styles.sendBtn}
                    onClick={() => { sendMsg(); setShowEmojis(false); }}
                >
                    Send
                </button>

                {showEmojis && (
                    <div className={styles.emojiPicker}>
                        {EMOJIS.map(e => (
                            <button
                                key={e}
                                className={styles.emojiItem}
                                onClick={() => setText(t => t + e)}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }
}
