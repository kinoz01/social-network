// src/components/groups/RequestsMenu.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import styles from "./style/requestsMenu.module.css";
import { useGroupSync } from "@/context/GroupSyncContext";
import { API_URL } from "@/lib/api_url";

/* ─────────── types ─────────── */
type Req = {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    profile_pic: string | null;
};

/* ─────────── data hook ─────────── */
function useRequests(groupId: string) {
    const { version, refresh } = useGroupSync();
    const [list, setList] = useState<Req[]>([]);
    const [loading, setLoad] = useState(true);

    /* 1. fetch from backend */
    const fetchRequests = useCallback(async () => {
        try {
            setLoad(true);
            const r = await fetch(
                `${API_URL}/api/groups/requests?group_id=${groupId}`,
                { credentials: "include", cache: "no-store" }
            );
            if (r.ok) setList(await r.json());
            else setList([]);
        } catch {
            setList([]);
        } finally {
            setLoad(false);
        }
    }, [groupId]);

    /* 2. run on mount and whenever GroupSync version bumps */
    useEffect(() => { fetchRequests(); }, [fetchRequests, version]);

    /* 3. optimistic accept / refuse */
    const act = async (route: "accept" | "refuse", id: string) => {
        setList(prev => prev.filter(x => x.id !== id));   // optimistic

        const endpoint =
            route === "accept"
                ? "/api/groups/accept-request"
                : "/api/groups/refuse-request";

        try {
            await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ request_id: id }),
            });
        } catch {
            console.warn(`${route} failed — will resync`);
        } finally {
            refresh();     // triggers members refresh + refetch here
        }
    };

    return { list, loading, act };
}


/* ─────────── shared list UI ─────────── */
function RequestsList({
    list,
    onAct,
}: {
    list: Req[];
    onAct: (route: "accept" | "refuse", id: string) => void;
}) {
    return (
        <>
            <h4 className={styles.heading}>JOIN REQUESTS</h4>
            <ul className={styles.list}>
                {list.map((r) => (
                    <li
                        key={r.id}
                        className={styles.item}
                        onClick={() => (window.location.href = `/profile/${r.user_id}`)}
                        style={{ cursor: "pointer" }}
                    >
                        <Image
                            src={
                                r.profile_pic
                                    ? `${API_URL}/api/storage/avatars/${r.profile_pic}`
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
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAct("accept", r.id);
                                }}
                                title="Accept"
                            >
                                <Image src="/img/accept.svg" alt="Accept" width={20} height={20} />
                            </button>
                            <button
                                className={styles.iconButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAct("refuse", r.id);
                                }}
                                title="Refuse"
                            >
                                <Image src="/img/refuse.svg" alt="Refuse" width={20} height={20} />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </>
    );
}

/* ─────────── sidebar variant (default export) ─────────── */
export default function RequestsMenu() {
    const { id } = useParams() as { id: string };
    const { list, loading, act } = useRequests(id);

    if (loading || !list || list.length === 0) return null;
    return (
        <div className={styles.menu}>
            <RequestsList list={list} onAct={act} />
        </div>
    );
}

/* ─────────── modal variant (Invite-style) ─────────── */
export function RequestsModal({
    modal = false,
    onClose,
}: {
    modal?: boolean;
    onClose?: () => void;
}) {
    const { id } = useParams() as { id: string };
    const { list, loading, act } = useRequests(id);

    if (loading) return null;

    /* sidebar vs modal */
    if (!modal) return <RequestsMenu />;   // defensive fallback

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
            >
                <button className={styles.close} onClick={onClose}>×</button>
                {!list || list.length === 0 ? (
                    <p className={styles.empty}>No pending requests</p>
                ) : (
                    <RequestsList list={list} onAct={act} />
                )}
            </div>
        </div>
    );
}
