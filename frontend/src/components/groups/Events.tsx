"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import EventCard, { Event } from "./EventCard";
import styles from "./style/events.module.css";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";

const PAGE_SIZE = 20;

export default function Events() {
    const { id: groupId } = useParams() as { id: string };

    /* ───────────── list / paging state ───────────── */
    const boxRef = useRef<HTMLDivElement>(null);

    const [events, setEvents] = useState<Event[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadMore] = useState(false);

    /* helper to fetch one page */
    const fetchPage = async (off: number) => {
        const qs = `group_id=${groupId}&limit=${PAGE_SIZE}&offset=${off}`;
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/groups/get-events?${qs}`,
            { credentials: "include", cache: "no-store" }
        );
        if (!res.ok) throw new Error("Failed to load events");
        return res.json() as Promise<Event[]>;
    };

    /* initial page / when group changes */
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const first = await fetchPage(0);
                if (!first || first.length === 0) return

                setEvents(first);
                setOffset(first.length);
                setMore(first.length === PAGE_SIZE);
            } finally {
                setLoading(false);
            }
        })();
    }, [groupId]);

    /* infinite scroll */
    useEffect(() => {
        const container = boxRef.current;
        if (!container) return;

        const onScroll = () => {
            if (!hasMore || loadingMore) return;
            if (container.scrollHeight - container.scrollTop - container.clientHeight > 120) return;

            (async () => {
                setLoadMore(true);
                try {
                    const next = await fetchPage(offset);
                    setEvents(prev => [...prev, ...next]);
                    setOffset(o => o + next.length);
                    setMore(next.length === PAGE_SIZE);
                } finally {
                    setLoadMore(false);
                }
            })();
        };

        container.addEventListener("scroll", onScroll);
        return () => container.removeEventListener("scroll", onScroll);
    }, [hasMore, loadingMore, offset]);

    /* ───────────── creator-form state ───────────── */
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [start, setStart] = useState("");
    const [going, setGoing] = useState(true);
    const [errMsg, setErr] = useState("");

    /* create-event submit */
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

        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/groups/create-event`,
            {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );

        if (!res.ok) {
            const { msg } = await res.json().catch(() => ({ msg: "Failed to create event." }));
            setErr(msg);
            return;
        }

        const ev: Event = await res.json();
        /* prepend new event & update paging offset */
        setEvents(prev => [ev, ...prev]);
        setOffset(o => o + 1);

        /* reset form */
        setTitle("");
        setDesc("");
        setStart("");
        setGoing(true);
    };

    /* ─────────────────── render ─────────────────── */
    return (
        <div className={styles.events} ref={boxRef}>
            {/* ── creator form ── */}
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

                {errMsg && <div className={styles.error}>{errMsg}</div>}
            </form>

            {/* ── list / states ── */}
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
                            onUpdate={(goingCnt, notCnt, myChoice) =>
                                setEvents(prev =>
                                    prev.map(p => p.id === ev.id ? { ...p, going_count: goingCnt, not_going_count: notCnt, going: myChoice } : p)
                                )
                            }
                        />
                    ))}

                    {loadingMore && <Loading />}
                    {!hasMore && events.length > PAGE_SIZE && (
                        <p className={styles.end}>No more events</p>
                    )}
                </div>
            )}
        </div>
    );
}
