"use client";
import { useEffect, useState, useRef, FormEvent } from "react";
import EventCard, { Event } from "./EventCard";
import styles from "./style/events.module.css";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";

const PAGE = 20;

export default function Events() {
    const { id: groupId } = useParams() as { id: string };

    /* list & paging */
    const boxRef = useRef<HTMLDivElement>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [offset, setOff] = useState(0);
    const [hasMore, setMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoad] = useState(false);

    const fetchPage = async (off: number) => {
        const qs = `group_id=${groupId}&limit=${PAGE}&offset=${off}`;
        const r = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/groups/get-events?${qs}`,
            { credentials: "include", cache: "no-store" }
        );
        if (!r.ok) throw new Error();
        return r.json() as Promise<Event[]>;
    };

    /* initial & on-group change */
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const first = await fetchPage(0);
                if (!first) return;

                setEvents(first);
                setOff(first.length);
                setMore(first.length === PAGE);
            } finally {
                setLoading(false);
            }
        })();
    }, [groupId]);

    /* lazy scroll */
    useEffect(() => {
        const el = boxRef.current;
        if (!el) return;
        const onScroll = () => {
            if (!hasMore || loadingMore) return;
            if (el.scrollHeight - el.scrollTop - el.clientHeight > 100) return;
            (async () => {
                setLoad(true);
                try {
                    const next = await fetchPage(offset);
                    setEvents(prev => [...prev, ...next]);
                    setOff(o => o + next.length);
                    setMore(next.length === PAGE);
                } finally {
                    setLoad(false);
                }
            })();
        };
        el.addEventListener("scroll", onScroll);
        return () => el.removeEventListener("scroll", onScroll);
    }, [hasMore, loadingMore, offset]);

    /* creator form */
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [start, setStart] = useState("");
    const [going, setGoing] = useState(true);
    const [errMsg, setErr] = useState("");

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setErr("");

        if (!title.trim() || !start) {
            setErr("Title and date are required.");
            return;
        }
        const payload = {
            group_id: groupId,
            title,
            description: desc,
            start_time: new Date(start).toISOString(),
            going,
        };
        const r = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/groups/create-event`,
            {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );
        if (!r.ok) {
            const { msg } = await r.json().catch(() => ({ msg: "Failed to create event." }));
            setErr(msg);
            return;
        }
        const ev: Event = await r.json();
        setEvents(prev => [ev, ...prev]);
        setOff(o => o + 1);
        setTitle(""); setDesc(""); setStart(""); setGoing(true);
    };

    /* ───────── UI ───────── */
    return (
        <div className={styles.events} ref={boxRef}>
            {/* creator */}
            <form className={styles.creator} onSubmit={submit}>
                <input
                    className={styles.inputTitle}
                    placeholder="Event title…"
                    value={title}
                    maxLength={80}
                    onChange={e => setTitle(e.target.value)}
                    required
                />
                <textarea
                    className={styles.inputDesc}
                    placeholder="Short description…"
                    value={desc}
                    maxLength={200}
                    onChange={e => setDesc(e.target.value)}
                    required
                />
                <div className={styles.metaRow}>
                    <input
                        type="datetime-local"
                        className={styles.inputDate}
                        value={start}
                        onChange={e => setStart(e.target.value)}
                        required
                    />

                    <div className={styles.toggleWrap}>
                        <button
                            type="button"
                            className={`${styles.toggle} ${going ? styles.sel : ""}`}
                            onClick={() => setGoing(true)}
                        >
                            Going
                        </button>
                        <button
                            type="button"
                            className={`${styles.toggle} ${!going ? styles.sel : ""}`}
                            onClick={() => setGoing(false)}
                        >
                            Not going
                        </button>
                    </div>

                    <button type="submit" className={styles.button}>Create</button>
                </div>

                {/* ─ error banner just under Create button ─ */}
                {errMsg && <div className={styles.error}>{errMsg}</div>}
            </form>

            {/* list */}
            {loading ? (
                <Loading />
            ) : !events || events.length === 0 ? (
                <div className={styles.empty}>
                    <img src="/img/empty.svg" alt="empty" width={160} height={160} />
                    <p>No events available</p>
                </div>
            ) : (
                <div className={styles.feed}>
                    {events.map(ev => (
                        <EventCard
                            key={ev.id}
                            ev={ev}
                            onUpdate={(g, ng) =>
                                setEvents(prev =>
                                    prev.map(p => p.id === ev.id
                                        ? { ...p, going_count: g, not_going_count: ng, going: !p.going }
                                        : p))
                            }
                        />
                    ))}
                    {loadingMore && <Loading />}
                </div>
            )}
        </div>
    );
}