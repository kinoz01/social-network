"use client";

import { useEffect, useState, useRef } from "react";
import { redirect, useParams } from "next/navigation";
import { useWS, ChatMsg } from "@/context/wsClient";
import Loading from "@/components/Loading";
import Image from "next/image";
import styles from "./style/chat.module.css";
import { API_URL } from "@/lib/api_url";
import Link from "next/link";
import { throttle } from "../../lib/utils";
import { useUser } from "@/context/UserContext";

export const EMOJIS = [
    "😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊", "😋", "😎", "😍", "😘", "😗", "😙", "😚",
    "🙂", "🤗", "🤩", "🤔", "🤨", "😐", "😑", "😶", "🙄", "😏", "😣", "😥", "😮", "🤐", "😯", "😪",
    "😫", "🥱", "😴", "😌", "😛", "😜", "😝", "🤤", "😒", "😓", "😔", "😕", "🙃", "🤑", "😲", "☹️",
    "🙁", "😖", "😞", "😟", "😤", "😢", "😭", "😦", "😧", "😨", "😩", "🤯", "😬", "😰", "😱", "🥵",
    "🥶", "😳", "🤪", "😵", "🥴", "😠", "😡", "🤬", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "😇", "🥳",
    "🥸", "🤠", "🥺", "🤡", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "👍", "👎", "👊", "✊", "🤛",
    "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "🤳", "💪", "🦾", "🦿", "✌️", "🤞", "🤟", "🤘", "👌",
    "🤌", "🤏", "👈", "👉", "👆", "👇", "✋", "🤚", "🖐️", "🖖", "👋", "🤙", "💘", "💝", "💖", "💗",
    "💓", "💞", "💕", "💟", "❣️", "❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "💔", "⚪️",
    "⚫️", "⬜️", "⬛️", "◻️", "◼️", "▫️", "▪️", "⬤", "⚪", "♟️", "♔", "♚", "♕", "♛", "♖", "♜",
    "♗", "♝", "♘", "♞", "♠️", "♥️", "♦️", "☆", "★", "♩", "♪", "♫", "♬", "☁️", "❄️", "☂️", "⚡",
    "💧", "🌊", "🌫️", "🌪️", "🌈", "🌤️", "☀️", "🌞", "🌝", "🌛", "🌜", "🌚", "⭐️", "🌟", "✨", "🔥",
    "💥", "💫", "🪐", "🪴", "🌱", "🌿", "☘️", "🍀", "🎍", "🎋", "🍃"
];

export default function DirectChatBox() {
    const { id: peerId } = useParams() as { id: string };
    const { user } = useUser();
    if (peerId === user?.id) redirect("/chat"); //- don't allow chat with myselef

    const { meId, online, sendDM, dmFeed, markChatRead } = useWS();

    // peer profile
    const [peerName, setPeerName] = useState<{
        first_name: string;
        last_name: string;
        profile_pic: string | null;
    } | null>(null);

    // messages
    const [msgs, setMsgs] = useState<ChatMsg[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingFirst, setLoading] = useState(true);

    // input & refs
    const [text, setText] = useState("");
    const [showEmojis, setShow] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const idSetRef = useRef<Set<string>>(new Set()); //- persistent Set of message IDs (used as sefty to always remove unexpected duplicate messages if any)
    const prevScrollHeight = useRef<number | null>(null);
    const firstLoadRef = useRef(true);
    const newMsgRef = useRef(false);
    const [showJump, setJump] = useState(false);

    const PAGE = 20;

    /* fetch peer profile */
    useEffect(() => {
        if (!peerId) return;
        fetch(
            `${API_URL}/api/users/dmprofiles?user_id=${encodeURIComponent(peerId)}`,
            { credentials: "include", cache: "no-store" }
        )
            .then((r) => (r.ok ? r.json() : null))
            .then(setPeerName)
            .catch(console.error);
    }, [peerId]);

    useEffect(() => {
        if (peerId) markChatRead(peerId);
    }, [peerId]);

    // api history call
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

    // first load
    useEffect(() => {
        if (!peerId || !meId) return;

        (async () => {
            setLoading(true);
            const page = await fetchPage(0);

            idSetRef.current = new Set(page.map((m) => m.id));
            setMsgs(page);
            setOffset(page.length);
            setHasMore(page.length === PAGE);
            setLoading(false);
        })();
    }, [peerId, meId]);

    /* infinite scroll older */
    useEffect(() => {
        const el = listRef.current;
        if (!el || !hasMore) return;

        const handler = throttle(() => {
            if (el.scrollTop < 250 && !loadingFirst) {
                (async () => {
                    const older = await fetchPage(offset);
                    if (!older.length) {
                        setHasMore(false);
                        return;
                    }

                    prevScrollHeight.current = el.scrollHeight; //- store the current scrollHeight (This value is the total height of the chat container before new messages are added)
                    const unique = older.filter((m) => !idSetRef.current.has(m.id));
                    unique.forEach((m) => idSetRef.current.add(m.id));
                    setMsgs((prev) => [...unique, ...prev]);
                    setOffset((o) => o + unique.length);
                    setHasMore(older.length === PAGE);
                })();
            }
        }, 400);

        el.addEventListener("scroll", handler);
        return () => el.removeEventListener("scroll", handler);
    }, [offset, hasMore, loadingFirst, peerId]);

    /* append new DM from global feed */
    useEffect(() => {
        if (!peerId || dmFeed.length === 0) return;
        const last = dmFeed[dmFeed.length - 1];

        const relevant =
            (last.sender_id === peerId && last.receiver_id === meId) ||
            (last.sender_id === meId && last.receiver_id === peerId);

        if (!relevant || idSetRef.current.has(last.id)) return;

        idSetRef.current.add(last.id);
        newMsgRef.current = true;
        setMsgs((prev) => [...prev, last]);
        setOffset((o) => o + 1);

        if (last.receiver_id === meId) { // we received a msg while chat is open -> immediatly mark as read
            setTimeout(() => markChatRead(peerId), 0);
            fetch(`${API_URL}/api/chat/mark-read?peer_id=${peerId}`, {
                method: "POST",
                credentials: "include",
            }).catch(console.error);
        }
    }, [dmFeed, peerId, meId]);

    /* scroll logic */
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;

        if (firstLoadRef.current) {  //- On initial mount, scroll to the bottom of the chat, then disable this logic so it only runs once (firstLoadRef.current = false).
            el.scrollTop = el.scrollHeight; //- scrollTop = 0 being the top, this line effectively scroll to bottom of container
            firstLoadRef.current = false;
            return;
        }

        if (prevScrollHeight.current !== null) { //- run after pagination scroll-up.
            el.scrollTop = el.scrollHeight - prevScrollHeight.current; //- scroll the user back to their old position when loading new page.
            prevScrollHeight.current = null;
            return;
        }

        if (newMsgRef.current) {
            const dist = el.scrollHeight - el.scrollTop - el.clientHeight; //- full scrollable content heigh - current scroll position from the top - visible height of the container

            if (dist < 3500) { //- How far the user is from the bottom of the chat
                el.scrollTop = el.scrollHeight; //- scroll  to bottom  on new msg if under 3500, else show scroll btn
                setJump(false);
            } else {
                setJump(true);
            }
            newMsgRef.current = false;
        }
    }, [msgs]);

    /* hide badge on manual scroll */
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;

        const onScroll = () => {
            const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
            if (dist < 100 && showJump) setJump(false);
        };
        el.addEventListener("scroll", onScroll);
        return () => el.removeEventListener("scroll", onScroll);
    }, [showJump]);

    /* helpers */
    const formatTime = (iso: string) =>
        new Date(iso.endsWith("Z") ? iso.slice(0, -1) : iso).toLocaleTimeString(
            [],
            { hour: "2-digit", minute: "2-digit" }
        );

    const formatDate = (iso: string) =>
        new Date(iso.endsWith("Z") ? iso.slice(0, -1) : iso).toLocaleDateString(
            [],
            { day: "2-digit", month: "short", year: "numeric" }
        );

    const sendMsg = () => {
        if (!text.trim()) return;
        sendDM(peerId, text.trim());
        setText("");
    };

    const isPeerOnline = online.has(peerId);

    /* render */
    if (!peerName) {
        return (
            <div className={styles.emptyBox}>
                <Image
                    src="/img/empty.svg"
                    alt="User not found"
                    width={250}
                    height={250}
                />
                <p className={styles.emptyStatus}>
                    User not found
                    <br />
                    Try selecting available users
                </p>
            </div>
        );
    }

    if (loadingFirst) return <Loading />;

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
                        <Image
                            src="/img/empty.svg"
                            alt="No messages"
                            width={150}
                            height={150}
                        />
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
                                    <div className={styles.dayDivider}>
                                        {day}
                                    </div>
                                )}
                                <div
                                    className={`${styles.msg} ${mine ? styles.outgoing : styles.incoming
                                        }`}
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
                                        <p className={styles.content}>
                                            {m.content}
                                        </p>
                                        <span className={styles.timeRight}>
                                            {formatTime(m.created_at)}
                                        </span>
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
