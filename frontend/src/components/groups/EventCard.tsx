"use client";

import styles from "./style/eventCard.module.css";
import { useState } from "react";

/* ───────── types ───────── */
export interface Event {
    id: string;
    group_id: string;
    creator_id: string;
    title: string;
    description: string;
    start_time: string;  // ISO string
    going_count: number;
    not_going_count: number;
    creator_going: boolean;
    created_at: string;
    going: boolean;
}

/* ───────── component ───────── */

export default function EventCard({
    ev,
    onUpdate,
}: {
    ev: Event;
    onUpdate: (going: number, notGoing: number) => void;
}) {
    const [submitting, setSub] = useState(false);

    const send = async (resp: "going" | "not_going") => {
        if (submitting) return;
        setSub(true);
        const r = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/groups/event-response`,
            {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event_id: ev.id, response: resp }),
            }
        );
        if (r.ok) {
            const { going, not_going } = await r.json();
            onUpdate(going, not_going);
        }
        setSub(false);
    };

    const date = new Date(ev.start_time).toLocaleString();

    return (
        <div className={styles.card}>
            <h4 className={styles.title}>{ev.title}</h4>
            <p className={styles.desc}>{ev.description}</p>

            <div className={styles.counts}>
                <span>{ev.going_count} going</span>
                <span>{ev.not_going_count} not going</span>
            </div>

            <div className={styles.actionRow}>
                <button
                    className={`${styles.button} ${ev.going ? styles.sel : ""}`}
                    onClick={() => send("going")}
                    disabled={submitting}
                >
                    Going
                </button>
                <button
                    className={`${styles.button} ${!ev.going ? styles.sel : ""}`}
                    onClick={() => send("not_going")}
                    disabled={submitting}
                >
                    Not going
                </button>
                <p className={styles.date}>{date}</p>
            </div>
        </div>
    );
}