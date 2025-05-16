"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import styles from "./style/inviteMenu.module.css";

interface Follower {
    id: string;
    first_name: string;
    last_name: string;
    profile_pic: string | null;
}

export default function InviteMenu({
    modal = false,
    onClose,
}: {
    modal?: boolean;
    onClose?: () => void;
}) {
    const { id: groupId } = useParams() as { id: string };

    /* ───── state ───── */
    const [query, setQuery] = useState("");
    const [searching, setSearch] = useState(false);
    const [results, setResults] = useState<Follower[]>([]);
    const [cache, setCache] = useState<Map<string, Follower>>(new Map());
    const [selected, setSel] = useState<Set<string>>(new Set());

    /* feedback */
    const [msg, setMsg] = useState("");
    const [cls, setCls] = useState<"" | "ok" | "err">("");

    /* ───── helpers ───── */
    const flash = (t: string, ok: boolean) => {
        setMsg(t); setCls(ok ? "ok" : "err");
        setTimeout(() => { setMsg(""); setCls(""); }, 8000);
    };

    /* initial load of ALL accepted followers */
    useEffect(() => {
        (async () => {
            try {
                const r = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/followers?status=accepted`,
                    { credentials: "include" }
                );
                if (r.status === 404) return;          // user has zero followers
                if (!r.ok) throw new Error();

                const list: Follower[] = await r.json();
                setCache(new Map(list.map(f => [f.id, f])));
            } catch (err) {
                console.warn("Could not pre-load followers", err);
            }
        })();
    }, []);

    /* live search */
    const runSearch = async (q: string) => {
        if (!q.trim()) { setResults([]); return; }
        setSearch(true);
        try {
            const r = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/followers` +
                `?status=accepted&query=${encodeURIComponent(q)}`,
                { credentials: "include" }
            );
            if (r.status === 404) { setResults([]); return; }
            if (!r.ok) throw new Error();
            const list: Follower[] = await r.json();
            setResults(list);
            setCache(prev => {
                const m = new Map(prev); list.forEach(u => m.set(u.id, u)); return m;
            });
        } catch { setResults([]); }
        finally { setSearch(false); }
    };

    /* toggle single */
    const toggle = (id: string) =>
        setSel(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });

    /* select / unselect all currently cached */
    const selectAll = () =>
        setSel(prev =>
            prev.size === cache.size ? new Set() : new Set(cache.keys())
        );

    /* POST */
    const onSubmit = async (e?: FormEvent) => {
        e?.preventDefault();
        if (selected.size === 0) return;
        try {
            const r = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/groups/invite`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        group_id: groupId,
                        invitee_ids: Array.from(selected)
                    }),
                }
            );
            if (!r.ok) throw new Error();
            setSel(new Set());
            flash("Sending succeeded", true);
        } catch {
            flash("Sending failed", false);
        }
    };

    /* ───── UI pieces ───── */
    const pills =
        cache.size === 0 ? (
            <p className={styles.placeholder}>You have no followers.</p>
        ) : selected.size === 0 ? (
            <p className={styles.placeholder}>No one selected</p>
        ) : (
            Array.from(selected).map(id => {
                const f = cache.get(id);
                if (!f) return null;
                return (
                    <div key={id} className={styles.selItem}>
                        <Image
                            src={
                                f.profile_pic
                                    ? `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${f.profile_pic}`
                                    : "/img/default-avatar.png"
                            }
                            alt=""
                            width={24}
                            height={24}
                            className={styles.avt}
                        />
                        <span className={styles.selName}>{f.first_name}</span>
                        <button className={styles.remove} onClick={() => toggle(id)}>×</button>
                    </div>
                );
            })
        );

    const body = (
        <>
            <h4 className={styles.heading}>INVITE FOLLOWERS</h4>

            <div className={styles.selectedBox}>{pills}</div>

            {/* search */}
            <input
                className={styles.search}
                placeholder="Search followers…"
                value={query}
                onChange={e => { setQuery(e.target.value); runSearch(e.target.value); }}
            />

            {/* results */}
            {searching && <p className={styles.status}>Searching…</p>}
            {!searching && query && results.length === 0 &&
                <p className={styles.status}>No match</p>}

            <ul className={styles.results}>
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
                                alt=""
                                width={28}
                                height={28}
                                className={styles.avt}
                            />
                            <span className={styles.name}>{f.first_name} {f.last_name}</span>
                            <span className={styles.tick}>{picked ? "✓" : "+"}</span>
                        </li>
                    );
                })}
            </ul>

            {/* persistent feedback + actions */}
            <div className={`${styles.status} ${cls && styles[cls]}`}>{msg}&nbsp;</div>

            <div className={styles.actions}>
                <button
                    type="button"
                    className={styles.selectAll}
                    onClick={selectAll}
                    disabled={cache.size === 0}
                >
                    {selected.size === cache.size ? "Unselect all" : "Select all"}
                </button>
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

    /* sidebar vs modal */
    if (!modal) return <div className={styles.menu}>{body}</div>;

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div
                className={`${styles.menu} ${styles.modal}`}
                onClick={e => e.stopPropagation()}
            >
                <button className={styles.close} onClick={onClose}>×</button>
                {body}
            </div>
        </div>
    );
}
