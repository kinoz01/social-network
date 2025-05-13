"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import styles from "./style/requestsMenu.module.css";
import { useGroupSync } from "@/context/GroupSyncContext";

/* ────────────────── types ────────────────── */
type Req = {
    id: string;           // row id (group_requests.id)
    user_id: string;
    first_name: string;
    last_name: string;
    profile_pic: string | null;
};

/* ────────────────── data hook ────────────── */
function useRequests(groupId: string) {
    const { version, refresh } = useGroupSync();
    const [list, setList] = useState<Req[]>([]);
    const [loading, setLoad] = useState(true);

    /* fetch wrapper (memoised so it can be a dep) */
    const fetchRequests = useCallback(async () => {
        try {
            setLoad(true);
            const r = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/groups/requests?group_id=${groupId}`,
                { credentials: "include", cache: "no-store" }
            );
            if (!r.ok) throw new Error();
            setList(await r.json());
        } catch {
            setList([]);               // hide on error
        } finally {
            setLoad(false);
        }
    }, [groupId]);

    /* initial + whenever the version changes */
    useEffect(() => { fetchRequests(); }, [fetchRequests, version]);

    /* optimistic action + bump version */
    const act = async (route: "accept" | "refuse", id: string) => {
        setList(prev => prev.filter(x => x.id !== id));      // optimistic

        const endpoint =
            route === "accept"
                ? "/api/groups/accept-request"
                : "/api/groups/refuse-request";

        fetch(
            `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ request_id: id })
            }
        ).catch(() => console.warn(`${route} failed`));

        refresh();                     
    };

    return { list, loading, act };
}

/* ────── visual list (used by sidebar & modal) ────── */
function RequestsList({
    list,
    onAct,
}: {
    list: Req[];
    onAct: (route: "accept" | "refuse", id: string) => void;
}) {
    return (
        <>
            <h4 className={styles.heading}>JOIN&nbsp;REQUESTS</h4>

            <ul className={styles.list}>
                {list.map(r => (
                    <li key={r.id} className={styles.item}>
                        <Image
                            src={
                                r.profile_pic
                                    ? `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${r.profile_pic}`
                                    : "/img/default-avatar.png"
                            }
                            alt=""
                            width={36}
                            height={36}
                            className={styles.avt}
                        />
                        <span className={styles.name}>
                            {r.first_name} {r.last_name}
                        </span>

                        <div className={styles.buttons}>
                            <button
                                className={styles.iconButton}
                                onClick={() => onAct("accept", r.id)}
                                title="Accept"
                            >
                                <Image src="/img/accept.svg" alt="" width={20} height={20} />
                            </button>

                            <button
                                className={styles.iconButton}
                                onClick={() => onAct("refuse", r.id)}
                                title="Refuse"
                            >
                                <Image src="/img/refuse.svg" alt="" width={20} height={20} />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </>
    );
}

/* ─────────────── sidebar variant ─────────────── */
export default function RequestsMenu() {
    const { id: groupId } = useParams() as { id: string };
    const { list, loading, act } = useRequests(groupId);

    if (!list || loading || list.length === 0) return null;   // nothing to show

    return (
        <div className={styles.menu}>
            <RequestsList list={list} onAct={act} />
        </div>
    );
}

/* ─────────────── modal variant (optional) ────── */
export function RequestsModal({ trigger }: { trigger: React.ReactNode }) {
    const { id: groupId } = useParams() as { id: string };
    const { list, loading, act } = useRequests(groupId);
    const [open, setOpen] = useState(false);

    if (loading) return null;

    return (
        <>
            <span onClick={() => setOpen(true)} style={{ display: "inline-block" }}>
                {trigger}
            </span>

            {open && (
                <div className={styles.backdrop} onClick={() => setOpen(false)}>
                    <div
                        className={`${styles.menu} ${styles.modal}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className={styles.close} onClick={() => setOpen(false)}>
                            ×
                        </button>

                        {list.length === 0 ? (
                            <p className={styles.empty}>No pending requests</p>
                        ) : (
                            <RequestsList list={list} onAct={act} />
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
