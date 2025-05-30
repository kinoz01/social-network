"use client";

import styles from "./style/events.module.css";

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
}

/* ───────── component ───────── */
export default function EventCard({ ev }: { ev: Event }) {
    /* format: e.g. "08 May 2025, 14:30" (uses user locale) */
    const dateStr = new Date(ev.start_time).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className={styles.eventCard}>
            <div className={styles.eventHeader}>
                <span>{ev.title}</span>
            </div>

            {ev.description && (
                <p className={styles.eventDesc}>{ev.description}</p>
            )}

            <div className={styles.eventDates}>
                <span className={styles.startsAt}>
                    Starts on&nbsp;{dateStr}
                </span>

                <div className={styles.counters}>
                    <span className={styles.going}>✅ {ev.going_count}</span>
                    <span className={styles.notGoing}>❌ {ev.not_going_count}</span>
                </div>
            </div>
        </div>
    );
}
