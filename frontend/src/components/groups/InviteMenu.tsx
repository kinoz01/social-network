"use client";

import { useState, useEffect, FormEvent, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import styles from "./style/inviteMenu.module.css";
import Loading from "@/components/Loading";

/* ───────── helpers ───────── */
const SLICE = 50;

/* ───────── types ───────── */
interface Follower {
    id: string;
    first_name: string;
    last_name: string;
    profile_pic: string | null;
}

/* ───────── component ───────── */
export default function InviteMenu({
    modal = false,
    onClose,
}: {
    modal?: boolean;
    onClose?: () => void;
}) {
    const { id: groupId } = useParams() as { id: string };

    /* search state */
    const [query, setQuery] = useState("");
    const [results, setRes] = useState<Follower[]>([]);
    const [offset, setOff] = useState(0);
    const [hasMore, setMore] = useState(true);
    const [searching, setSearching] = useState(false);
    const [loadingMore, setLoadMore] = useState(false);

    /* selection & cache */
    const [cache, setCache] = useState<Map<string, Follower>>(new Map());
    const [selected, setSel] = useState<Set<string>>(new Set());

    /* misc ui */
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState("");          // flash message
    const [cls, setCls] = useState<"" | "ok" | "err">("");

    const listRef = useRef<HTMLUListElement>(null);

    const flash = (t: string, ok: boolean) => {
        setMsg(t); setCls(ok ? "ok" : "err");
        setTimeout(() => { setMsg(""); setCls(""); }, 8000);
    };

    /* ───────── fetch helpers ───────── */
    const fetchSlice = async (q: string, off: number) => {
        const qs =
            `query=${encodeURIComponent(q)}&limit=${SLICE}&offset=${off}`;
        const r = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/followers?${qs}`,
            { credentials: "include" }
        );
        if (r.status === 404) return [];
        if (!r.ok) throw new Error();
        return (await r.json()) as Follower[];
    };

    /* first slice on every keystroke */
    const runSearch = useCallback(
        async (q: string) => {
            setQuery(q);
            if (!q.trim()) {
                setRes([]); setOff(0); setMore(true);
                return;
            }
            setSearching(true);
            try {
                const slice = await fetchSlice(q, 0);
                setRes(slice);
                setOff(slice.length);
                setMore(slice.length === SLICE);

                /* cache for pills */
                setCache(prev => {
                    const m = new Map(prev);
                    slice.forEach(u => m.set(u.id, u));
                    return m;
                });
            } finally { setSearching(false); }
        },
        []
    );

    /* next slices via scroll */
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore || !query.trim()) return;
        setLoadMore(true);
        try {
            const slice = await fetchSlice(query, offset);
            setRes(prev => [...prev, ...slice]);
            setOff(o => o + slice.length);
            setMore(slice.length === SLICE);

            setCache(prev => {
                const m = new Map(prev);
                slice.forEach(u => m.set(u.id, u));
                return m;
            });
        } finally { setLoadMore(false); }
    }, [loadingMore, hasMore, query, offset]);

    /* scroll listener */
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        const onScroll = throttle(() => {
            const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 250;
            if (nearBottom) loadMore();
        }, 300);
        el.addEventListener("scroll", onScroll);
        return () => el.removeEventListener("scroll", onScroll);
    }, [loadMore]);

    /* ───────── selection helpers ───────── */
    const toggle = (id: string) =>
        setSel(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });

    /* ───────── invite POST ───────── */
    const onSubmit = async (e?: FormEvent) => {
        e?.preventDefault();
        if (selected.size === 0) return;

        setSubmitting(true);
        try {
            const r = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/groups/invite`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        group_id: groupId,
                        invitee_ids: Array.from(selected),
                    }),
                }
            );
            if (!r.ok) throw new Error();
            setSel(new Set());
            flash("Sending succeeded", true);
        } catch { flash("Sending failed", false); }
        finally { setSubmitting(false); }
    };

    /* ───────── pills UI ───────── */
    const pills =
        selected.size === 0 ? (
            <p className={styles.placeholder}>No one selected</p>
        ) : (
            Array.from(selected).map(id => {
                const f = cache.get(id); if (!f) return null;
                return (
                    <div key={id} className={styles.selItem}>
                        <Image
                            src={f.profile_pic
                                ? `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${f.profile_pic}`
                                : "/img/default-avatar.png"}
                            alt="" width={24} height={24} className={styles.avt} />
                        <span className={styles.selName}>{f.first_name}</span>
                        <button className={styles.remove} onClick={() => toggle(id)}>×</button>
                    </div>
                );
            })
        );

    /* ───────── main body ───────── */
    const body = (
        <>
            <h4 className={styles.heading}>INVITE FOLLOWERS</h4>

            <div className={styles.selectedBox}>{pills}</div>

            <input
                className={styles.search}
                placeholder="Search followers…"
                value={query}
                onChange={e => runSearch(e.target.value)}
            />

            {searching && <Loading />}
            {!searching && query && results.length === 0 && (
                <p className={styles.status}>No match</p>
            )}

            <ul ref={listRef} className={styles.results}>
                {results.map(f => {
                    const picked = selected.has(f.id);
                    return (
                        <li key={f.id}
                            className={`${styles.item} ${picked ? styles.checked : ""}`}
                            onClick={() => toggle(f.id)}>
                            <Image
                                src={f.profile_pic
                                    ? `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${f.profile_pic}`
                                    : "/img/default-avatar.png"}
                                alt="" width={28} height={28} className={styles.avt} />
                            <span className={styles.name}>{f.first_name} {f.last_name}</span>
                            <span className={styles.tick}>{picked ? "✓" : "+"}</span>
                        </li>
                    );
                })}
            </ul>

            {loadingMore && <Loading />}
            {!hasMore && !loadingMore && offset > SLICE && (
                <p className={styles.loadingText}>— no more results —</p>
            )}

            <div className={`${styles.status} ${cls && styles[cls]}`}>{msg}&nbsp;</div>

            <div className={styles.actions}>
                <button
                    className={styles.send}
                    disabled={selected.size === 0}
                    onClick={onSubmit}
                >
                    Send invite
                </button>
            </div>
        </>
    );

    /* ───────── modal / sidebar containers ───────── */
    if (submitting) {
        const loadingContent = (
            <div className={styles.menu}>
                <Loading />
            </div>
        );
        if (!modal) return loadingContent;
        return (
            <div className={styles.backdrop} onClick={onClose}>
                <div className={`${styles.menu} ${styles.modal}`}
                    onClick={e => e.stopPropagation()}>
                    <button className={styles.close} onClick={onClose}>×</button>
                    {loadingContent}
                </div>
            </div>
        );
    }

    if (!modal) return <div className={styles.menu}>{body}</div>;

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={`${styles.menu} ${styles.modal}`}
                onClick={e => e.stopPropagation()}>
                <button className={styles.close} onClick={onClose}>×</button>
                {body}
            </div>
        </div>
    );
}

/* simple throttle */
const throttle = (fn: (...a: any[]) => void, wait = 300) => {
    let waiting = false, saved: any[] | null = null;
    const timer = () => {
        if (!saved) { waiting = false; return; }
        fn(...saved); saved = null; setTimeout(timer, wait);
    };
    return (...args: any[]) => {
        if (waiting) { saved = args; return; }
        fn(...args); waiting = true; setTimeout(timer, wait);
    };
};
