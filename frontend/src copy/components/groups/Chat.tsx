"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import styles from "./style/chat.module.css";
import { useWS } from "@/context/wsClient";
import Loading from "../Loading";
import Image from "next/image";
import { API_URL } from "@/lib/api_url";
import { throttle } from "../utils";


interface ChatMsg {
    id: string; sender_id: string; first_name: string; last_name: string;
    profile_pic: string | null; content: string; created_at: string;
}

const PAGE = 20;
const EMOJIS = [
    "😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊", "😋", "😎", "😍", "😘", "😗", "😙", "😚", "🙂", "🤗", "🤩", "🤔", "🤨", "😐", "😑", "😶", "🙄", "😏", "😣", "😥", "😮", "🤐", "😯", "😪", "😫", "🥱",
    "😴", "😌", "😛", "😜", "😝", "🤤", "😒", "😓", "😔", "😕", "🙃", "🤑", "😲", "☹️", "🙁", "😖", "😞", "😟", "😤", "😢", "😭", "😦", "😧", "😨", "😩", "🤯", "😬", "😰", "😱", "🥵", "🥶", "😳", "🤪", "😵", "🥴",
    "😠", "😡", "🤬", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "😇", "🥳", "🥸", "🤠", "🥺", "🤡", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "👍", "👎", "👊", "✊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏",
    "🤳", "💪", "🦾", "🦿", "🖕", "✌️", "🤞", "🤟", "🤘", "👌", "🤌", "🤏", "👈", "👉", "👆", "👇", "✋", "🤚", "🖐️", "🖖", "👋", "🤙", "💘", "💝", "💖", "💗", "💓", "💞", "💕", "💟", "❣️", "❤️", "🧡", "💛", "💚",
    "💙", "💜", "🤎", "🖤", "🤍", "💔", "⚪️", "⚫️", "⬜️", "⬛️", "◻️", "◼️", "▫️", "▪️", "⬤", "⚪", "♟️", "♔", "♚", "♕", "♛", "♖", "♜", "♗", "♝", "♘", "♞", "♠️", "♥️", "♦️", "☆", "★", "♩", "♪", "♫", "♬",
    "☁️", "❄️", "☂️", "⚡", "💧", "🌊", "🌫️", "🌪️", "🌈", "🌤️", "☀️", "🌞", "🌝", "🌛", "🌜", "🌚", "⭐️", "🌟", "✨", "⚡️", "🔥", "💥", "💫", "🪐", "🪴", "🌱", "🌿", "☘️", "🍀", "🎍", "🎋", "🍃"
] as const;

export default function Chat() {
    const { id: groupId } = useParams() as { id: string };
    const { socket, send } = useWS();

    const [msgs, setMsgs] = useState<ChatMsg[]>([]);
    const [offset, setOff] = useState(0);
    const [hasMore, setHM] = useState(true);
    const [text, setText] = useState("");
    const [showEmojis, setEmojis] = useState(false);
    const [loadingFirst, setLoadingFirst] = useState(true);

    const idSetRef = useRef<Set<string>>(new Set());
    const listRef = useRef<HTMLDivElement>(null);
    const prevH = useRef<number | null>(null);


    /* fetch page helper -------------------------------------------*/
    const fetchPage = async (o: number) => {
        const qs = `group_id=${groupId}&limit=${PAGE}&offset=${o}`;
        const r = await fetch(
            `${API_URL}/api/groups/chat?${qs}`,
            { credentials: "include", cache: "no-store" });
        if (!r.ok) return [];
        return await r.json() as ChatMsg[];
    };

    /* initial load ------------------------------------------------*/
    useEffect(() => {
        (async () => {
            if (!groupId) return;
            setLoadingFirst(true);                                       
            const pageRaw = await fetchPage(0);
            const page = Array.isArray(pageRaw) ? pageRaw : [];          
            idSetRef.current = new Set(page.map(m => m.id));
            setMsgs(page);
            setOff(page.length);
            setHM(page.length === PAGE);
            setLoadingFirst(false);                                      
        })();
    }, [groupId]);

    /* scroll-up lazy loader ---------------------------------------*/
    useEffect(() => {
        const box = listRef.current; if (!box || !hasMore) return;
        const onScroll = throttle(async () => {
            if (box.scrollTop < 150) {
                const older = await fetchPage(offset);
                if (!older.length) { setHM(false); return; }
                prevH.current = box.scrollHeight;
                const unique = older.filter(m => !idSetRef.current.has(m.id));
                unique.forEach(m => idSetRef.current.add(m.id));
                setMsgs(p => [...unique, ...p]);
                setOff(o => o + unique.length);
                setHM(older.length === PAGE);
            }
        }, 300);
        box.addEventListener("scroll", onScroll);
        return () => box.removeEventListener("scroll", onScroll);
    }, [offset, hasMore, groupId]);

    /* live WS messages -------------------------------------------*/
    useEffect(() => {
        if (!socket) return;
        const h = (ev: MessageEvent) => {
            let d: any; try { d = JSON.parse(ev.data); } catch { return; }
            if (d.groupId !== groupId || d.type !== "chatMessage") return;
            if (idSetRef.current.has(d.message.id)) return;
            idSetRef.current.add(d.message.id);
            setMsgs(p => [...p, d.message]);
            setOff(o => o + 1);
        };
        socket.addEventListener("message", h);
        send({ type: "subscribeChat", groupId });
        return () => socket.removeEventListener("message", h);
    }, [groupId, send]);


    /* scroll restore / auto-bottom -------------------------------*/
    useLayoutEffect(() => {
        const box = listRef.current; if (!box) return;
        if (prevH.current !== null) {
            box.scrollTop = box.scrollHeight - prevH.current;
            prevH.current = null;
        } else {
            box.scrollTop = box.scrollHeight;
        }
    }, [msgs]);

    /* helpers */
    const t = (iso: string) =>  {
        const dateStr = iso.endsWith('Z') ? iso.slice(0, -1) : iso;
        return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    const d = (iso: string) => {
        const dateStr = iso.endsWith('Z') ? iso.slice(0, -1) : iso;
        return new Date(dateStr).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
    }

    const sendMsg = () => {
        if (!text.trim()) return;
        send({ type: "chatMessage", groupId, content: text.trim() }); setText("");
    };

    if (!groupId) return null;
    let lastDay = "";

    if (loadingFirst) {
        return <Loading />;
    }

    if (!msgs || msgs.length === 0) {
        return (
            <div className={styles.emptyBox}>
                <Image src="/img/empty.svg" alt="Empty chat" width={180} height={180} />
                <p className={styles.status}>No messages yet — be the first!</p>
                <div className={styles.inputRow}>
                    <button className={styles.emojiBtn} onClick={() => setEmojis(!showEmojis)}>🙂</button>
                    <input className={styles.input} placeholder="Type a message…"
                        value={text} onChange={e => setText(e.target.value)}
                        maxLength={700}
                        onKeyDown={e => { e.key === "Enter" && sendMsg(); setEmojis(false); }} />
                    <button className={styles.sendBtn} onClick={() => { sendMsg(); setEmojis(false); }}>Send</button>
                    {showEmojis && (
                        <div className={styles.emojiPicker}>
                            {EMOJIS.map(e => (
                                <button key={e} className={styles.emojiItem}
                                    onClick={() => setText(t => t + e)}>{e}</button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return (
        <div className={styles.chatBox}>
            <div className={styles.messages} ref={listRef}>
                {msgs.map(m => {
                    const day = d(m.created_at);
                    const div = day !== lastDay ?
                        <div key={`day-${day}-${m.id}`} className={styles.dayDivider}>{day}</div> : null;
                    lastDay = day;
                    return (
                        <div key={m.id}>
                            {div}
                            <div className={styles.msg}>
                                <img src={m.profile_pic
                                    ? `${API_URL}/api/storage/avatars/${m.profile_pic}`
                                    : "/img/default-avatar.png"} className={styles.avatar} />
                                <div className={styles.bubble}>
                                    <span className={styles.name}>{m.first_name} {m.last_name}
                                        <span className={styles.time}> {t(m.created_at)}</span>
                                    </span>
                                    <p className={styles.content}>{m.content}</p>
                                </div>
                            </div>
                        </div>);
                })}
            </div>

            <div className={styles.inputRow}>
                <button
                    type="button"
                    className={styles.emojiBtn}
                    onClick={() => setEmojis(p => !p)}
                >🙂</button>

                <input className={styles.input} placeholder="Type a message…"
                    value={text} onChange={e => setText(e.target.value)}
                    maxLength={700}
                    onKeyDown={e => { e.key === "Enter" && sendMsg(); setEmojis(false) }} />

                <button className={styles.sendBtn} onClick={() => { sendMsg(); setEmojis(false) }}>Send</button>

                {showEmojis && (
                    <div className={styles.emojiPicker}>
                        {EMOJIS.map(e => (
                            <button
                                key={e}
                                className={styles.emojiItem}
                                onClick={() => { setText(t => t + e); }}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                )}
            </div>

        </div>);
}