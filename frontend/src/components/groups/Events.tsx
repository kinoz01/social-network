"use client";

import { useEffect, useState, FormEvent } from "react";
import EventCard, { Event } from "./EventCard";
import styles from "./style/events.module.css";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";

export default function Events() {
    const { id: groupId } = useParams() as { id: string };
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoad] = useState(true);

    /* ─ fetch list ─ */
    useEffect(() => {
        const fetchList = async () => {
            const r = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/groups/events?group_id=${groupId}`,
                { credentials: "include", cache: "no-store" }
            );
            if (r.ok) {
                setEvents(await r.json());
            }
            setLoad(false);
        };
        fetchList();
    }, [groupId]);

    /* ─ form state ─ */
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [start, setStart] = useState("");
    const [going, setGoing] = useState(true);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !start) return;

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
        if (!r.ok) return;
        const ev: Event = await r.json();
        setEvents((p) => [...p, ev]);
        // reset
        setTitle("");
        setDesc("");
        setStart("");
        setGoing(true);
    };

    return (
        <div className={styles.events}>
            {/* ───────── creator prompt ───────── */}
            <form className={styles.creator} onSubmit={submit}>
                <input
                    className={styles.inputTitle}
                    placeholder="Event title..."
                    value={title}
                    maxLength={100}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <textarea
                    className={styles.inputDesc}
                    placeholder="Short Description..."
                    value={desc}
                    maxLength={500}
                    onChange={(e) => setDesc(e.target.value)}
                    required
                />
                <div className={styles.metaRow}>
                    <input
                        type="datetime-local"
                        className={styles.inputDate}
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
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

                    <button type="submit" className={styles.button}>
                        Create
                    </button>
                </div>
            </form>

            {/* ───────── list ───────── */}
            {loading ? (
                <Loading />
            ) : (
                events.map((ev) => <EventCard key={ev.id} ev={ev} />)
            )}
        </div>
    );
}
