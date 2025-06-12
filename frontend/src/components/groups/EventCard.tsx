"use client";

import { useState } from "react";
import styles from "./style/eventCard.module.css";
import { API_URL } from "@/lib/api_url";
import { useParams } from "next/navigation";

export interface Event {
    id: string;
    group_id: string;
    creator_id: string;
    title: string;
    description: string;
    start_time: string;
    going_count: number;
    not_going_count: number;
    created_at: string;
    going: boolean | null;          // null --> viewer hasn't voted
}

export default function EventCard({
    ev,
    expired,
    onUpdate,
}: {
    ev: Event;
    expired: boolean;
    onUpdate: (going: number, notGoing: number, myChoice: boolean) => void;
}) {

    const { id: groupId } = useParams() as { id: string };
    
    const [myChoice, setMyChoice] = useState<boolean | null>(ev.going);
    const [goingCnt, setGoingCnt] = useState(ev.going_count);
    const [notCnt, setNotCnt] = useState(ev.not_going_count);
    const [busy, setBusy] = useState(false);

    const choose = async (resp: "going" | "not_going") => {
        const wantGoing = resp === "going";
        if (busy || expired) return;
        if ((wantGoing && myChoice === true) || (!wantGoing && myChoice === false)) return;

        setBusy(true);
        const r = await fetch(
            `${API_URL}/api/groups/event-response?group_id=${groupId}`,
            {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event_id: ev.id, response: resp }),
            }
        );
        if (r.ok) {
            const { going, not_going } = await r.json();
            setGoingCnt(going);
            setNotCnt(not_going);
            setMyChoice(wantGoing);
            onUpdate(going, not_going, wantGoing);
        }
        setBusy(false);
    };

    const date = new Date(ev.start_time).toLocaleString(undefined, {
        year: "numeric", month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit",
    });

    return (
        <div className={styles.card}>
            <h4 className={styles.title}>{ev.title}</h4>
            <p className={styles.desc}>{ev.description}</p>

            <div className={styles.counts}>
                <span>{goingCnt} going</span>
                <span>{notCnt} not going</span>
            </div>

            <div className={styles.actionRow}>
                <button
                    className={`${styles.button} ${myChoice === true ? styles.sel : ""}`}
                    onClick={() => choose("going")}
                    disabled={busy || expired}
                >
                    Going
                </button>
                <button
                    className={`${styles.button} ${myChoice === false ? styles.sel : ""}`}
                    onClick={() => choose("not_going")}
                    disabled={busy || expired}
                >
                    Not going
                </button>
                <p className={styles.date}> {expired && "expired at"} {date}</p>
            </div>
        </div>
    );
}
