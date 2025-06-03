"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useWS, ChatMsg } from "@/context/wsClient";
import Loading from "@/components/Loading";
import Image from "next/image";
import styles from "./style/chat.module.css";
import { API_URL } from "@/lib/api_url";
import Link from "next/link";

export const EMOJIS = [
    "😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊", "😋", "😎", "😍", "😘", "😗", "😙", "😚", "🙂", "🤗", "🤩", "🤔", "🤨", "😐", "😑", "😶", "🙄", "😏", "😣", "😥", "😮", "🤐", "😯", "😪", "😫", "🥱",
    "😴", "😌", "😛", "😜", "😝", "🤤", "😒", "😓", "😔", "😕", "🙃", "🤑", "😲", "☹️", "🙁", "😖", "😞", "😟", "😤", "😢", "😭", "😦", "😧", "😨", "😩", "🤯", "😬", "😰", "😱", "🥵", "🥶", "😳", "🤪", "😵", "🥴",
    "😠", "😡", "🤬", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "😇", "🥳", "🥸", "🤠", "🥺", "🤡", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "👍", "👎", "👊", "✊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏",
    "🤳", "💪", "🦾", "🦿", "🖕", "✌️", "🤞", "🤟", "🤘", "👌", "🤌", "🤏", "👈", "👉", "👆", "👇", "✋", "🤚", "🖐️", "🖖", "👋", "🤙", "💘", "💝", "💖", "💗", "💓", "💞", "💕", "💟", "❣️", "❤️", "🧡", "💛", "💚",
    "💙", "💜", "🤎", "🖤", "🤍", "💔", "⚪️", "⚫️", "⬜️", "⬛️", "◻️", "◼️", "▫️", "▪️", "⬤", "⚪", "♟️", "♔", "♚", "♕", "♛", "♖", "♜", "♗", "♝", "♘", "♞", "♠️", "♥️", "♦️", "☆", "★", "♩", "♪", "♫", "♬",
    "☁️", "❄️", "☂️", "⚡", "💧", "🌊", "🌫️", "🌪️", "🌈", "🌤️", "☀️", "🌞", "🌝", "🌛", "🌜", "🌚", "⭐️", "🌟", "✨", "⚡️", "🔥", "💥", "💫", "🪐", "🪴", "🌱", "🌿", "☘️", "🍀", "🎍", "🎋", "🍃"
];

/**
 * DirectChatBox does the following:
 * 1) Fetch the “peer” user’s profile (name + avatar) via REST.
 * 2) Fetch the first 20 DM messages (ascending) via REST.
 * 3) Subscribe to real‐time DMs over WebSocket.
 * 4) Display incoming on the left, outgoing on the right.
 * 5) Show a header with peer’s avatar + “Online/Offline.”
 */
export default function DirectChatBox() {
    const { id: peerId } = useParams() as { id: string };
    const { meId, online, subscribeDM, sendDM, onNewDM } = useWS();

    // 1) Peer's profile
    const [peerName, setPeerName] = useState<{ first_name: string; last_name: string; profile_pic: string | null } | null>(null);

    // 2) Chat history + infinite scroll
    const [msgs, setMsgs] = useState<ChatMsg[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingFirst, setLoadingFirst] = useState(true);

    // 3) Input + emojis
    const [text, setText] = useState("");
    const [showEmojis, setShowEmojis] = useState(false);

    // 4) Refs for unique IDs & scroll‐position preservation
    const listRef = useRef<HTMLDivElement>(null);
    const idSetRef = useRef<Set<string>>(new Set());
    const prevScrollHeight = useRef<number | null>(null);

    const PAGE = 20;

    // Fetch peer's profile once on mount
    useEffect(() => {
        if (!peerId) return;
        fetch(`${API_URL}/api/users/profile?user_id=${encodeURIComponent(peerId)}`, {
            credentials: "include",
            cache: "no-store"
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch user profile");
                return res.json();
            })
            .then((data: {
                first_name: string;
                last_name: string;
                profile_pic: string | null;
            }) => {
                setPeerName({
                    first_name: data.first_name,
                    last_name: data.last_name,
                    profile_pic: data.profile_pic
                });
            })
            .catch(console.error);
    }, [peerId]);

    // REST: Fetch existing DM history (20 at a time, ascending)
    const fetchPage = async (off: number): Promise<ChatMsg[]> => {
        const qs = new URLSearchParams({
            peer_id: peerId,
            limit: String(PAGE),
            offset: String(off),
        }).toString();
        const r = await fetch(`${API_URL}/api/chat/messages?${qs}`, {
            credentials: "include",
            cache: "no-store",
        });
        if (r.status === 204) return [];
        if (!r.ok) return [];
        return (await r.json()) as ChatMsg[];
    };

    // On mount (or when peerId changes), load first page & subscribe
    useEffect(() => {
        if (!peerId || !meId) return;
        let isMounted = true;
        (async () => {
            setLoadingFirst(true);
            const page = await fetchPage(0);
            if (!isMounted) return;

            idSetRef.current = new Set(page.map((m) => m.id));
            setMsgs(page);
            setOffset(page.length);
            setHasMore(page.length === PAGE);
            setLoadingFirst(false);

            // Subscribe to WebSocket DMs
            subscribeDM(peerId);
        })();

        return () => {
            isMounted = false;
        };
    }, [peerId, meId, subscribeDM]);

    // Infinite scroll: load older messages when user scrolls near top
    useEffect(() => {
        const el = listRef.current;
        if (!el || !hasMore) return;
        const handler = async () => {
            if (el.scrollTop < 150 && !loadingFirst) {
                const older = await fetchPage(offset);
                if (!older.length) {
                    setHasMore(false);
                    return;
                }
                prevScrollHeight.current = el.scrollHeight;
                const unique = older.filter((m) => !idSetRef.current.has(m.id));
                unique.forEach((m) => idSetRef.current.add(m.id));
                setMsgs((prev) => [...unique, ...prev]);
                setOffset((o) => o + unique.length);
                setHasMore(older.length === PAGE);
            }
        };
        const throttled = () => {
            if (el.scrollTop < 150) handler();
        };
        el.addEventListener("scroll", throttled);
        return () => el.removeEventListener("scroll", throttled);
    }, [offset, hasMore, loadingFirst, peerId]);

    // Real‐time incoming DM handler
    useEffect(() => {
        if (!peerId) return;
        const unsubscribe = onNewDM(peerId, (incoming: ChatMsg) => {
            if (!idSetRef.current.has(incoming.id)) {
                idSetRef.current.add(incoming.id);
                setMsgs((prev) => [...prev, incoming]);
                setOffset((o) => o + 1);

                // ─── NEW: if I'm the receiver here, immediately mark as read ───
                if (incoming.receiver_id === meId) {
                    fetch(`${API_URL}/api/chat/mark-read?peer_id=${peerId}`, {
                        method: "POST",
                        credentials: "include",
                    }).catch(console.error);
                }
            }
        });
        return () => unsubscribe();
    }, [peerId, onNewDM]);

    // Auto‐scroll / preserve scroll when new messages arrive
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        if (prevScrollHeight.current !== null) {
            el.scrollTop = el.scrollHeight - prevScrollHeight.current;
            prevScrollHeight.current = null;
        } else {
            el.scrollTop = el.scrollHeight;
        }
    }, [msgs]);

    // Format helpers
    const formatTime = (iso: string) => {
        const d = iso.endsWith("Z") ? iso.slice(0, -1) : iso;
        return new Date(d).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };
    const formatDate = (iso: string) => {
        const d = iso.endsWith("Z") ? iso.slice(0, -1) : iso;
        return new Date(d).toLocaleDateString([], {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // Send a new DM
    const sendMsg = () => {
        if (!text.trim()) return;
        sendDM(peerId, text.trim());
        setText("");
    };

    // Show “Online/Offline” for peerId
    const isPeerOnline = online.has(peerId);

    if (!peerName) {
        return (
            <div className={styles.chatBox}>
                <div className={styles.emptyBox}>
                    <Image
                        src="/img/empty.svg"
                        alt="User not found"
                        width={150}
                        height={150}
                    />
                    <p className={styles.emptyStatus}>User not found<br></br>Try selecting available users</p>
                </div>
            </div>
        );
    }

    if (loadingFirst) {
        return <Loading />;
    }

    let lastDay = "";
    return (
        <>
            {/* ─── HEADER ─── */}
            <div className={styles.headerRow}>
                <Link href={`/profile/${peerId}`} className={styles.headerAvatarLink}>
                    <Image
                        src={
                            peerName.profile_pic
                                ? `${API_URL}/api/storage/avatars/${peerName.profile_pic}`
                                : "/img/default-avatar.png"
                        }
                        alt={`${peerName.first_name} ${peerName.last_name}`}
                        width={40}
                        height={40}
                        className={styles.avatar}
                    />
                </Link>

                <div className={styles.headerText}>
                    <Link href={`/profile/${peerId}`} className={styles.nameLink}>
                        <span className={styles.name}>
                            {peerName.first_name} {peerName.last_name}
                        </span>
                    </Link>
                </div>
                <span
                    className={styles.status}
                    style={{ color: isPeerOnline ? "#28c76f" : "#888" }}
                >
                    {isPeerOnline ? "Online" : "Offline"}
                </span>
            </div>

            {/* ─── MESSAGES LIST ─── */}
            <div className={styles.messages} ref={listRef}>
                {msgs.length === 0 ? (
                    <div className={styles.emptyBox}>
                        <Image
                            src="/img/empty.svg"
                            alt="No messages"
                            width={150}
                            height={150}
                        />
                        <p className={styles.emptyStatus}>No conversation yet<br></br>Say Hey</p>
                    </div>
                ) : (
                    msgs.map((m) => {
                        const day = formatDate(m.created_at);
                        const showDateDivider = day !== lastDay;
                        lastDay = day;

                        const isMine = m.sender_id === meId;
                        return (
                            <div key={m.id}>
                                {showDateDivider && (
                                    <div
                                        className={styles.dayDivider}
                                        key={`day-${day}-${m.id}`}
                                    >
                                        {day}
                                    </div>
                                )}
                                <div
                                    className={`${styles.msg} ${isMine ? styles.outgoing : styles.incoming}`}
                                >
                                    {!isMine && (
                                        <Image
                                            src={
                                                m.profile_pic
                                                    ? `${API_URL}/api/storage/avatars/${m.profile_pic}`
                                                    : "/img/default-avatar.png"
                                            }
                                            alt=""
                                            width={36}
                                            height={36}
                                            className={styles.avatar}
                                        />
                                    )}
                                    <div className={styles.bubble}>
                                        <p className={styles.content}>{m.content}</p>
                                        <span className={styles.timeRight}>
                                            {formatTime(m.created_at)}
                                        </span>
                                    </div>
                                    {isMine && (
                                        <Image
                                            src={
                                                m.profile_pic
                                                    ? `${API_URL}/api/storage/avatars/${m.profile_pic}`
                                                    : "/img/default-avatar.png"
                                            }
                                            alt=""
                                            width={36}
                                            height={36}
                                            className={styles.avatar}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ─── INPUT ROW ─── */}
            <div className={styles.inputRow}>
                <button
                    type="button"
                    className={styles.emojiBtn}
                    onClick={() => setShowEmojis((v) => !v)}
                >
                    🙂
                </button>
                <input
                    className={styles.input}
                    placeholder="Type a message…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={700}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            sendMsg();
                            setShowEmojis(false);
                        }
                    }}
                />
                <button
                    className={styles.sendBtn}
                    onClick={() => {
                        sendMsg();
                        setShowEmojis(false);
                    }}
                >
                    Send
                </button>
                {showEmojis && (
                    <div className={styles.emojiPicker}>
                        {EMOJIS.map((e) => (
                            <button
                                key={e}
                                className={styles.emojiItem}
                                onClick={() => setText((t) => t + e)}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
