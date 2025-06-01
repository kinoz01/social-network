"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import styles from "./style/allMembersMenu.module.css";
import Loading from "@/components/Loading";
import { throttle } from "@/components/utils";
import { API_URL } from "@/lib/api_url";

interface Member {
    id: string;
    first_name: string;
    last_name: string;
    profile_pic: string | null;
    isOwner: boolean;
}

const SLICE = 50;

export default function AllMembersMenu({
    modal = false,
    onClose,
}: {
    modal?: boolean;
    onClose?: () => void;
}) {
    const { id: groupId } = useParams() as { id: string };

    /** list state --------------------------------------------------- */
    const [members, setMembers] = useState<Member[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setMore] = useState(true);
    const [loading, setLoad] = useState(false);

    /** search ------------------------------------------------------- */
    const [q, setQ] = useState("");

    const listRef = useRef<HTMLDivElement>(null);

    /** helpers ------------------------------------------------------ */
    const fetchSlice = async (off = 0, query = ""): Promise<Member[]> => {
        const qs = new URLSearchParams({
            group_id: groupId,
            limit: String(SLICE),
            offset: String(off),
            q: query,
        }).toString();
        const r = await fetch(
            `${API_URL}/api/groups/members?${qs}`,
            { credentials: "include" },
        );
        if (r.status === 204) return [];
        if (!r.ok) throw new Error("fetch error");
        return r.json();
    };

    /** first load + every search change ---------------------------- */
    const runSearch = useCallback(
        async (query: string) => {
            setQ(query);
            setLoad(true);
            try {
                const slice = await fetchSlice(0, query);
                setMembers(slice);
                setOffset(slice.length);
                setMore(slice.length === SLICE);
            } finally {
                setLoad(false);
            }
        },
        [groupId],
    );

    useEffect(() => {
        runSearch("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupId]);

    /** infinite scroll --------------------------------------------- */
    useEffect(() => {
        const el = listRef.current;
        if (!el || !hasMore) return;

        const handler = throttle(() => {
            if (loading) return;
            const near =
                el.scrollHeight - el.scrollTop - el.clientHeight < 200;
            if (near) {
                (async () => {
                    setLoad(true);
                    try {
                        const slice = await fetchSlice(offset, q);
                        setMembers((prev) => [...prev, ...slice]);
                        setOffset((o) => o + slice.length);
                        setMore(slice.length === SLICE);
                    } finally {
                        setLoad(false);
                    }
                })();
            }
        }, 300);

        el.addEventListener("scroll", handler);
        return () => el.removeEventListener("scroll", handler);
    }, [offset, hasMore, loading, q, groupId]);

    /** UI body ------------------------------------------------------ */
    const body = (
        <>
            <h4 className={styles.section}>All Members</h4>

            <input
                className={styles.search}
                placeholder="Search…"
                value={q}
                onChange={(e) => runSearch(e.target.value)}
            />

            <div ref={listRef} className={styles.list}>
                {members.length === 0 && !loading ? (
                    <p className={styles.end}>— user not found —</p>
                ) : (
                    members.map((m) => (
                        <Link key={m.id} href={`/profile/${m.id}`} className={styles.item}>
                            <Image
                                src={
                                    m.profile_pic
                                        ? `${API_URL}/api/storage/avatars/${m.profile_pic}`
                                        : "/img/default-avatar.png"
                                }
                                alt=""
                                width={32}
                                height={32}
                                className={styles.avt}
                            />
                            <span className={styles.name}>
                                {m.first_name} {m.last_name}
                            </span>
                            {m.isOwner && (
                                <svg viewBox="0 0 24 24" className={styles.crown}>
                                    <path
                                        d="M5 6l3.5 3L12 4l3.5 5L19 6l-1 12H6L5 6z"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        fill="currentColor"
                                    />
                                </svg>
                            )}
                        </Link>
                    ))
                )}

                {loading && <Loading />}
                {!hasMore && !loading && offset > SLICE && (
                    <p className={styles.end}>— end —</p>
                )}
            </div>
        </>
    );

    /** plain sidebar ------------------------------------------------ */
    if (!modal) return <aside className={styles.menu}>{body}</aside>;

    /** modal -------------------------------------------------------- */
    return (
        <div className={styles.backdrop} onClick={onClose}>
            <aside
                className={`${styles.menu} ${styles.modal}`}
                onClick={(e) => e.stopPropagation()}
            >
                <button className={styles.close} onClick={onClose}>
                    ×
                </button>
                {body}
            </aside>
        </div>
    );
}
