// src/components/DirectChatBox.tsx
"use client";

import { useEffect, useLayoutEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useWS, ChatMsg } from "@/context/wsClient";
import Loading from "@/components/Loading";
import Image from "next/image";
import styles from "./style/chat.module.css";
import { API_URL } from "@/lib/api_url";
import Link from "next/link";
import { throttle } from "../utils";

export const EMOJIS = [
    "😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊", "😋", "😎", "😍", "😘", "😗", "😙", "😚", "🙂", "🤗", "🤩", "🤔", "🤨", "😐", "😑", "😶", "🙄", "😏", "😣", "😥", "😮", "🤐", "😯", "😪", "😫", "🥱",
    "😴", "😌", "😛", "😜", "😝", "🤤", "😒", "😓", "😔", "😕", "🙃", "🤑", "😲", "☹️", "🙁", "😖", "😞", "😟", "😤", "😢", "😭", "😦", "😧", "😨", "😩", "🤯", "😬", "😰", "😱", "🥵", "🥶", "😳", "🤪", "😵", "🥴",
    "😠", "😡", "🤬", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "😇", "🥳", "🥸", "🤠", "🥺", "🤡", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "👍", "👎", "👊", "✊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏",
    "🤳", "💪", "🦾", "🦿", "🖕", "✌️", "🤞", "🤟", "🤘", "👌", "🤌", "🤏", "👈", "👉", "👆", "👇", "✋", "🤚", "🖐️", "🖖", "👋", "🤙", "💘", "💝", "💖", "💗", "💓", "💞", "💕", "💟", "❣️", "❤️", "🧡", "💛", "💚",
    "💙", "💜", "🤎", "🖤", "🤍", "💔", "⚪️", "⚫️", "⬜️", "⬛️", "◻️", "◼️", "▫️", "▪️", "⬤", "⚪", "♟️", "♔", "♚", "♕", "♛", "♖", "♜", "♗", "♝", "♘", "♞", "♠️", "♥️", "♦️", "☆", "★", "♩", "♪", "♫", "♬",
    "☁️", "❄️", "☂️", "⚡", "💧", "🌊", "🌫️", "🌪️", "🌈", "🌤️", "☀️", "🌞", "🌝", "🌛", "🌜", "🌚", "⭐️", "🌟", "✨", "⚡️", "🔥", "💥", "💫", "🪐", "🪴", "🌱", "🌿", "☘️", "🍀", "🎍", "🎋", "🍃"
];

export default function DirectChatBox() {
    const { id: peerId } = useParams() as { id: string };
    const { meId, online, subscribeDM, sendDM, onNewDM } = useWS();

    /* ─── 1. Peer profile ─── */
    const [peerName, setPeerName] = useState<{
        first_name: string;
        last_name: string;
        profile_pic: string | null;
    } | null>(null);

    /* ─── 2. Messages state ─── */
    const [msgs, setMsgs] = useState<ChatMsg[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingFirst, setLoading] = useState(true);

    /* ─── 3. Input / emoji ─── */
    const [text, setText] = useState("");
    const [showEmojis, setShow] = useState(false);

    /* ─── 4. Refs ─── */
    const listRef = useRef<HTMLDivElement>(null);
    const idSetRef = useRef<Set<string>>(new Set());
    const prevScrollHeight = useRef<number | null>(null);
    const firstLoadRef = useRef(true);
    const newMsgRef = useRef(false);

    /* ─── 5. Jump badge ─── */
    const [showJump, setJump] = useState(false);

    const PAGE = 20;

    /* ────────────────────────────────────────────────────────────
       Fetch peer profile
    ──────────────────────────────────────────────────────────── */
    useEffect(() => {
        if (!peerId) return;
        fetch(`${API_URL}/api/users/profile?user_id=${encodeURIComponent(peerId)}`, {
            credentials: "include",
            cache: "no-store",
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch user profile");
                return res.json();
            })
            .then((d) => setPeerName(d))
            .catch(console.error);
    }, [peerId]);

    /* ────────────────────────────────────────────────────────────
       Helper: fetch one page of history
    ──────────────────────────────────────────────────────────── */
    const fetchPage = async (off: number): Promise<ChatMsg[]> => {
        const qs = new URLSearchParams({
            peer_id: peerId,
            limit: String(PAGE),
            offset: String(off),
        }).toString();
        const res = await fetch(`${API_URL}/api/chat/messages?${qs}`, {
            credentials: "include",
            cache: "no-store",
        });
        if (res.status === 204 || !res.ok) return [];
        return res.json();
    };

    /* ────────────────────────────────────────────────────────────
       Initial load + WebSocket subscription
    ──────────────────────────────────────────────────────────── */
    useEffect(() => {
        if (!peerId || !meId) return;
        let alive = true;

        (async () => {
            setLoading(true);
            const page = await fetchPage(0);
            if (!alive) return;

            idSetRef.current = new Set(page.map((m) => m.id));
            setMsgs(page);
            setOffset(page.length);
            setHasMore(page.length === PAGE);
            setLoading(false);

            subscribeDM(peerId);
        })();

        return () => { alive = false };
    }, [peerId, meId]);

    /* ────────────────────────────────────────────────────────────
       Infinite scroll (load older)
    ──────────────────────────────────────────────────────────── */
    useEffect(() => {
        const el = listRef.current;
        if (!el || !hasMore) return;

        const handler = throttle(() => {
            if (el.scrollTop < 250 && !loadingFirst) {
                (async () => {
                    const older = await fetchPage(offset);
                    if (!older.length) { setHasMore(false); return; }

                    prevScrollHeight.current = el.scrollHeight;
                    const unique = older.filter(m => !idSetRef.current.has(m.id));
                    unique.forEach(m => idSetRef.current.add(m.id));
                    setMsgs(prev => [...unique, ...prev]);
                    setOffset(o => o + unique.length);
                    setHasMore(older.length === PAGE);
                })();
            }
        }, 400);

        el.addEventListener("scroll", handler);
        return () => el.removeEventListener("scroll", handler);
    }, [offset, hasMore, loadingFirst, peerId]);

    /* ────────────────────────────────────────────────────────────
       WebSocket: incoming DM
    ──────────────────────────────────────────────────────────── */
    useEffect(() => {
        if (!peerId) return;
        const unsubscribe = onNewDM(peerId, (incoming: ChatMsg) => {
            if (idSetRef.current.has(incoming.id)) return;
            idSetRef.current.add(incoming.id);

            newMsgRef.current = true;           // flag for the next layout pass
            setMsgs(prev => [...prev, incoming]);
            setOffset(o => o + 1);

            if (incoming.receiver_id === meId) {
                fetch(`${API_URL}/api/chat/mark-read?peer_id=${peerId}`, {
                    method: "POST",
                    credentials: "include",
                }).catch(console.error);
            }
        });
        return () => unsubscribe();
    }, [peerId, onNewDM, meId]);

    /* ────────────────────────────────────────────────────────────
       Scroll & badge logic on msgs update
    ──────────────────────────────────────────────────────────── */
    useLayoutEffect(() => {
        const el = listRef.current;
        if (!el) return;

        /* 1. First load → jump to bottom */
        if (firstLoadRef.current) {
            el.scrollTop = el.scrollHeight;
            firstLoadRef.current = false;
            return;
        }

        /* 2. Just prepended older messages → keep viewport */
        if (prevScrollHeight.current !== null) {
            el.scrollTop = el.scrollHeight - prevScrollHeight.current;
            prevScrollHeight.current = null;
            return;
        }

        /* 3. A new incoming message triggered this render */
        if (newMsgRef.current) {
            const dist = el.scrollHeight - el.scrollTop - el.clientHeight;

            if (dist < 3500) {
                el.scrollTop = el.scrollHeight;
                setJump(false);
            } else {                            // user is up → show badge
                setJump(true);
            }
            newMsgRef.current = false;
        }
    }, [msgs]);

    /* ────────────────────────────────────────────────────────────
       Hide badge when user scrolls back to bottom
    ──────────────────────────────────────────────────────────── */
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;

        const onScroll = () => {
            const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
            if (dist < 100 && showJump) {
                setJump(false);
            }
        };
        el.addEventListener("scroll", onScroll);
        return () => el.removeEventListener("scroll", onScroll);
    }, [showJump]);

    /* ────────────────────────────────────────────────────────────
       Helpers
    ──────────────────────────────────────────────────────────── */
    const formatTime = (iso: string) =>
        new Date(iso.endsWith("Z") ? iso.slice(0, -1) : iso).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

    const formatDate = (iso: string) =>
        new Date(iso.endsWith("Z") ? iso.slice(0, -1) : iso).toLocaleDateString([], {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

    const sendMsg = () => {
        if (!text.trim()) return;
        sendDM(peerId, text.trim());
        setText("");
    };

    const isPeerOnline = online.has(peerId);

    /* ────────────────────────────────────────────────────────────
       Render states
    ──────────────────────────────────────────────────────────── */
    if (!peerName) {
        return (
            <div className={styles.chatBox}>
                <div className={styles.emptyBox}>
                    <Image src="/img/empty.svg" alt="User not found" width={150} height={150} />
                    <p className={styles.emptyStatus}>
                        User not found
                        <br />
                        Try selecting available users
                    </p>
                </div>
            </div>
        );
    }

    if (loadingFirst) return <Loading />;

    /* ────────────────────────────────────────────────────────────
       JSX
    ──────────────────────────────────────────────────────────── */
    let lastDay = "";

    return (
        <>
            {/* HEADER */}
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

            {/* MESSAGES */}
            <div className={styles.messages} ref={listRef}>
                {msgs.length === 0 ? (
                    <div className={styles.emptyBox}>
                        <Image src="/img/empty.svg" alt="No messages" width={150} height={150} />
                        <p className={styles.emptyStatus}>
                            No conversation yet
                            <br />
                            Say Hey
                        </p>
                    </div>
                ) : (
                    msgs.map((m) => {
                        const day = formatDate(m.created_at);
                        const showDivider = day !== lastDay;
                        lastDay = day;

                        const mine = m.sender_id === meId;

                        return (
                            <div key={m.id}>
                                {showDivider && (
                                    <div className={styles.dayDivider} key={`day-${day}-${m.id}`}>
                                        {day}
                                    </div>
                                )}
                                <div
                                    className={`${styles.msg} ${mine ? styles.outgoing : styles.incoming}`}
                                >
                                    {!mine && (
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
                                        <span className={styles.timeRight}>{formatTime(m.created_at)}</span>
                                    </div>
                                    {mine && (
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

            {/* JUMP BADGE */}
            {showJump && (
                <button
                    className={styles.jumpBadge}
                    onClick={() => {
                        const el = listRef.current;
                        if (el) el.scrollTop = el.scrollHeight;
                        setJump(false);
                    }}
                >
                    Scroll to bottom
                </button>
            )}

            {/* INPUT */}
            <div className={styles.inputRow}>
                <button
                    type="button"
                    className={styles.emojiBtn}
                    onClick={() => setShow((v) => !v)}
                >
                    🙂
                </button>
                <input
                    className={styles.input}
                    placeholder="Type a message…"
                    value={text}
                    maxLength={700}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            sendMsg();
                            setShow(false);
                        }
                    }}
                />
                <button
                    className={styles.sendBtn}
                    onClick={() => {
                        sendMsg();
                        setShow(false);
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
