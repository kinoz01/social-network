"use client";

import { throttle } from "@/components/utils";
import styles from "../posts.module.css";
import { BackIcon } from "@/components/icons";
import Loading from "@/components/Loading";
import Image from "next/image";
import React, {
    useState, useEffect, useRef
} from "react";
import { User } from "@/components/types";
import { API_URL } from "@/lib/api_url";

const SLICE = 50;

/* ------------ props ------------ */
type Props = {
    onBack: () => void;
    onUserCHange: (ids: string[]) => void;
    userID: string;
};

/* ------------ component ------------ */
export default function ShowUsers({ onBack, onUserCHange }: Props) {
    /* selection ------------------------------------------------ */
    const [picked, setPicked] = useState<Map<string, string>>(new Map());

    /* push IDs to parent */
    useEffect(() => {
        onUserCHange([...picked.keys()]);
    }, [picked, onUserCHange]);

    const toggle = (u: User) =>
        setPicked(prev => {
            const m = new Map(prev);
            m.has(u.id) ? m.delete(u.id) : m.set(u.id, `${u.first_name} ${u.last_name}`);
            return m;
        });
    const remove = (id: string) =>
        setPicked(prev => {
            const m = new Map(prev);
            m.delete(id);
            return m;
        });

    /* search / paging ----------------------------------------- */
    const [query, setQuery] = useState("");
    const [offset, setOff] = useState(0);
    const [hasMore, setMore] = useState(true);
    const [loading, setLoad] = useState(false);
    const [data, setData] = useState<User[]>([]);
    const listRef = useRef<HTMLUListElement>(null);

    const fetchSlice = async (q: string, off: number) => {
        const qs = `query=${encodeURIComponent(q)}&limit=${SLICE}&offset=${off}`;
        const r = await fetch(`${API_URL}/api/followers?${qs}`, {
            credentials: "include",
        });
        if (r.status === 204) return [];
        if (!r.ok) throw new Error();
        return (await r.json()) as User[];
    };

    const runSearch = async (q: string) => {
        setQuery(q); setOff(0); setMore(true); setData([]);
        if (!q.trim()) return;
        setLoad(true);
        try {
            const slice = await fetchSlice(q, 0);
            setData(slice);
            setOff(slice.length);
            setMore(slice.length === SLICE);
        } finally { setLoad(false); }
    };

    const loadMore = async () => {
        if (!hasMore || loading || !query.trim()) return;
        setLoad(true);
        try {
            const slice = await fetchSlice(query, offset);
            setData(prev => [...prev, ...slice]);
            setOff(o => o + slice.length);
            setMore(slice.length === SLICE);
        } finally { setLoad(false); }
    };

    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        const h = throttle(() => {
            const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
            if (nearBottom) loadMore();
        }, 250);
        el.addEventListener("scroll", h);
        return () => el.removeEventListener("scroll", h);
    }, [loadMore]);

    /* ui ------------------------------------------------------- */
    return (
        <div className={styles.postAud}>
            <div className={styles.header}>
                <button type="button" className={styles.backBtn} onClick={onBack}>
                    <BackIcon />
                </button>
                <span className={styles.title}>User List</span>
            </div>

            <div className={styles.listUsers}>
                <label>Who can view your post:</label>
                {picked.size === 0 && <p className={styles.placeholder}>No one selected</p>}
                {[...picked].map(([id, name]) => (
                    <div key={id} className={styles.chip}>
                        <p className={styles.chipLabel}>{name}</p>
                        <button
                            type="button"
                            className={styles.removeBtn}
                            onClick={() => remove(id)}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            <input
                className={styles.search}
                value={query}
                placeholder="Start typing to search…"
                onChange={e => runSearch(e.target.value)}
            />

            {loading && offset === 0 && <Loading />}
            {!loading && query && data.length === 0 && (
                <p className={styles.status}>No match</p>
            )}

            <ul ref={listRef} className={styles.results}>
                {data.map(u => {
                    const active = picked.has(u.id);
                    return (
                        <li
                            key={u.id}
                            className={`${styles.item} ${active ? styles.checked : ""}`}
                            onClick={() => toggle(u)}
                        >
                            <Image
                                className={styles.userIcon}
                                src={
                                    u.profile_pic
                                        ? `${API_URL}/api/storage/avatars/${u.profile_pic}`
                                        : "/img/default-avatar.png"
                                }
                                alt=""
                                width={30}
                                height={30}
                            />
                            <span className={styles.name}>{u.first_name} {u.last_name}</span>
                            <span className={styles.tick}>{active ? "✓" : "+"}</span>
                        </li>
                    );
                })}
            </ul>

            {loading && offset > 0 && <Loading />}
            {!hasMore && !loading && offset > SLICE && (
                <p className={styles.loadingText}>— no more results —</p>
            )}
        </div>
    );
}
