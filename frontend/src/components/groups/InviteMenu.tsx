"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import styles from "./style/inviteMenu.module.css";
import Loading from "@/components/Loading";

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
    const [submitting, setSubmitting] = useState(false);

    /* follower existence flag (null = not checked yet) */
    const [hasFollowers, setHasFollowers] = useState<boolean | null>(null);

    /* feedback flash */
    const [msg, setMsg] = useState("");
    const [cls, setCls] = useState<"" | "ok" | "err">("");

    const flash = (t: string, ok: boolean) => {
        setMsg(t);
        setCls(ok ? "ok" : "err");
        setTimeout(() => {
            setMsg("");
            setCls("");
        }, 3000);
    };

    /* ---------- one-row existence check on mount ---------- */
    useEffect(() => {
        (async () => {
            try {
                const r = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/followers?status=accepted&limit=1`,
                    { credentials: "include" }
                );
                if (r.status === 404) {
                    setHasFollowers(false);
                    return;
                }
                if (!r.ok) throw new Error();
                const list: Follower[] = await r.json();
                setHasFollowers(list.length > 0);
            } catch {
                setHasFollowers(false); // treat error as none
            }
        })();
    }, []);

    /* ---------- live search ---------- */
    const runSearch = async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            return;
        }
        setSearch(true);
        try {
            const r = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/followers?query=${encodeURIComponent(q)}`,
                { credentials: "include" }
            );
            if (r.status === 404) {
                setResults([]);
                return;
            }
            if (!r.ok) throw new Error();

            const list: Follower[] = await r.json();
            setResults(list);

            /* add to cache for pills display */
            setCache((prev) => {
                const m = new Map(prev);
                list.forEach((u) => m.set(u.id, u));
                return m;
            });
        } catch {
            setResults([]);
        } finally {
            setSearch(false);
        }
    };

    /* ---------- toggle single follower ---------- */
    const toggle = (id: string) =>
        setSel((prev) => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });

    /* ---------- send invitation ---------- */
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
            setSel(new Set()); // clear selection
            flash("Sending succeeded", true);
        } catch {
            flash("Sending failed", false);
        } finally {
            setSubmitting(false);
        }
    };

    /* ---------- selected-pills UI ---------- */
    const pills =
        selected.size === 0 ? (
            <p className={styles.placeholder}>
                {hasFollowers === false ? "You have no followers." : "No one selected"}
            </p>
        ) : (
            Array.from(selected).map((id) => {
                const f = cache.get(id);
                if (!f) return null; // should not happen—selected always from results
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
                        <button className={styles.remove} onClick={() => toggle(id)}>
                            ×
                        </button>
                    </div>
                );
            })
        );

    /* ---------- main body ---------- */
    const body = (
        <>
            <h4 className={styles.heading}>INVITE FOLLOWERS</h4>

            <div className={styles.selectedBox}>{pills}</div>

            <input
                className={styles.search}
                placeholder="Search followers…"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    runSearch(e.target.value);
                }}
            />

            {searching && <p className={styles.status}>Searching…</p>}
            {!searching && query && results.length === 0 && (
                <p className={styles.status}>No match</p>
            )}

            <ul className={styles.results}>
                {results.map((f) => {
                    const picked = selected.has(f.id);
                    return (
                        <li
                            key={f.id}
                            className={`${styles.item} ${picked ? styles.checked : ""}`}
                            onClick={() => toggle(f.id)}
                        >
                            <Image
                                src={
                                    f.profile_pic
                                        ? `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${f.profile_pic}`
                                        : "/img/default-avatar.png"
                                }
                                alt=""
                                width={28}
                                height={28}
                                className={styles.avt}
                            />
                            <span className={styles.name}>
                                {f.first_name} {f.last_name}
                            </span>
                            <span className={styles.tick}>{picked ? "✓" : "+"}</span>
                        </li>
                    );
                })}
            </ul>

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

    /* ---------- overlays / containers ---------- */
    if (submitting) {
        const loadingContent = (
            <div className={styles.menu}>
                <Loading />
            </div>
        );

        if (!modal) return loadingContent;

        return (
            <div className={styles.backdrop} onClick={onClose}>
                <div
                    className={`${styles.menu} ${styles.modal}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button className={styles.close} onClick={onClose}>
                        ×
                    </button>
                    {loadingContent}
                </div>
            </div>
        );
    }

    if (!modal) return <div className={styles.menu}>{body}</div>;

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div
                className={`${styles.menu} ${styles.modal}`}
                onClick={(e) => e.stopPropagation()}
            >
                <button className={styles.close} onClick={onClose}>
                    ×
                </button>
                {body}
            </div>
        </div>
    );
}
