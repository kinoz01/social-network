"use client";

import { useEffect, useRef, useState, FormEvent, useCallback } from "react";
import Image from "next/image";
import styles from "./style/createGroup.module.css";
import Loading from "@/components/Loading";
import { API_URL } from "@/lib/api_url";
import { throttle } from "../../lib/utils";


/* ───────── helpers ───────── */
const SLICE = 50;

/* ───────── types ───────── */
interface Follower {
    id: string;
    first_name: string;
    last_name: string;
    profile_pic: string | null;
}
interface Props { onClose: () => void; }
interface FormDataState {
    groupPic: File | null;
    groupName: string;
    description: string;
    invitees: Set<string>;
}

/* ───────── component ───────── */
export default function CreateGroupModal({ onClose }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    /* preview + error */
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState("");

    /* form data */
    const [formData, setFormData] = useState<FormDataState>({
        groupPic: null, groupName: "", description: "", invitees: new Set(),
    });

    /* ---------------- follower search state ---------------- */
    const [allFollowers, setAll] = useState<Map<string, Follower>>(new Map());
    const [results, setRes] = useState<Follower[]>([]);
    const [query, setQuery] = useState("");
    const [offset, setOff] = useState(0);
    const [hasMore, setMore] = useState(true);
    const [searching, setSearching] = useState(false);
    const [loadingMore, setLoadMore] = useState(false);
    const [hasFollowers, setHasFollowers] = useState<boolean | null>(null);

    /* ---------------- image picker ---------------- */
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) { setPreviewUrl(null); setFormData(p => ({ ...p, groupPic: null })); return; }
        if (!f.type.startsWith("image/")) { setErrorMsg("Unsupported image format."); return; }
        setPreviewUrl(URL.createObjectURL(f));
        setFormData(p => ({ ...p, groupPic: f }));
    };

    /* ---------------- fetch helpers ---------------- */
    const fetchSlice = async (q: string, off: number) => {
        const qs = `query=${encodeURIComponent(q)}&limit=${SLICE}&offset=${off}`;
        const r = await fetch(`${API_URL}/api/followers?${qs}`,
            { credentials: "include" });
        if (r.status === 204) return [];
        if (!r.ok) throw new Error();
        return (await r.json()) as Follower[];
    };

    /* first slice when query changes */
    const runSearch = useCallback(async (q: string) => {
        setQuery(q);
        if (!q.trim()) { setRes([]); setOff(0); setMore(true); return; }

        setSearching(true);
        try {
            const slice = await fetchSlice(q, 0);
            setRes(slice); setOff(slice.length); setMore(slice.length === SLICE);
            setAll(prev => { const m = new Map(prev); slice.forEach(f => m.set(f.id, f)); return m; });
        } finally { setSearching(false); }
    }, []);

    /* next slices via scroll */
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore || !query.trim()) return;
        setLoadMore(true);
        try {
            const slice = await fetchSlice(query, offset);
            setRes(prev => [...prev, ...slice]);
            setOff(o => o + slice.length);
            setMore(slice.length === SLICE);
            setAll(prev => { const m = new Map(prev); slice.forEach(f => m.set(f.id, f)); return m; });
        } finally { setLoadMore(false); }
    }, [loadingMore, hasMore, query, offset]);

    /* attach scroll listener once */
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        const onScroll = throttle(() => {
            if (el.scrollHeight - el.scrollTop - el.clientHeight < 250) loadMore();
        }, 300);
        el.addEventListener("scroll", onScroll);
        return () => el.removeEventListener("scroll", onScroll);
    }, [loadMore]);

    /* trigger search when typing */
    useEffect(() => { runSearch(query.trim()); }, [query, runSearch]);

    /* follower existence check once */
    useEffect(() => {
        (async () => {
            try {
                const r = await fetch(
                    `${API_URL}/api/followers?status=accepted&limit=1`,
                    { credentials: "include" });
                if (!r.ok) throw new Error();
                const list: Follower[] = await r.json();
                setHasFollowers(list.length > 0);
            } catch { setHasFollowers(false); }
        })();
    }, []);

    /* invite toggle */
    const toggleInvitee = (id: string) =>
        setFormData(prev => {
            const inv = new Set(prev.invitees);
            inv.has(id) ? inv.delete(id) : inv.add(id);
            return { ...prev, invitees: inv };
        });

    /* submit */
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        if (!formData.groupName.trim()) { setErrorMsg("Group name required."); return; }

        const body = new FormData();
        body.append("group_name", formData.groupName);
        body.append("description", formData.description);
        if (formData.groupPic) body.append("group_pic", formData.groupPic);
        body.append("invitee_ids", JSON.stringify(Array.from(formData.invitees)));

        try {
            const r = await fetch(`${API_URL}/api/groups/create`,
                { method: "POST", body, credentials: "include" });
            if (!r.ok) throw new Error((await r.json()).msg);
            onClose();
        } catch (err: any) { setErrorMsg(err.message || "Failed to create group."); }
    };

    /* stop bg scroll */
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    /* ---------------- JSX ---------------- */
    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>×</button>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* avatar picker */}
                    <p className={styles.avatarLabel}>Choose Group Image</p>
                    <div className={styles.avatarCircle}
                        onClick={() => fileInputRef.current?.click()}>
                        {previewUrl
                            ? <img src={previewUrl} alt="preview" className={styles.avatarImg} />
                            : <span className={styles.plusIcon}>＋</span>}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" hidden
                        onChange={e => { setErrorMsg(""); handleFileChange(e); }} />

                    {/* name + desc */}
                    <label className={styles.label}>
                        Group Name
                        <input
                            className={styles.input}
                            value={formData.groupName}
                            onChange={(e) =>
                                setFormData((p) => ({ ...p, groupName: e.target.value }))
                            }
                            maxLength={40}
                            required
                            placeholder="Group name with no special characters"
                        />
                    </label>

                    <label className={styles.label}>
                        Description
                        <textarea
                            className={styles.textarea}
                            value={formData.description}
                            onChange={(e) =>
                                setFormData((p) => ({ ...p, description: e.target.value }))
                            }
                            rows={3}
                            maxLength={150}
                            placeholder="A short description of the group"
                            required
                        />
                    </label>

                    {/* invite pills */}
                    <div className={styles.label}>
                        Invited
                        <div className={styles.selectedBox}>
                            {formData.invitees.size === 0 ? (
                                <p className={styles.loadingText}>
                                    {hasFollowers === false ? "You have no followers." : "No one invited yet."}
                                </p>
                            ) : (
                                Array.from(formData.invitees).map(id => {
                                    const f = allFollowers.get(id)!;
                                    return (
                                        <div key={id} className={styles.invitedRow}>
                                            <Image src={f.profile_pic
                                                ? `${API_URL}/api/storage/avatars/${f.profile_pic}`
                                                : "/img/default-profile.png"}
                                                alt={f.first_name} width={28} height={28}
                                                className={styles.followerAvatar} />
                                            <span className={styles.followerName}>
                                                {f.first_name} {f.last_name}
                                            </span>
                                            <button type="button" className={styles.removeBtn}
                                                onClick={() => toggleInvitee(id)}>×</button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* search box */}
                    <label className={styles.label}>
                        Search followers
                        <input type="text" className={styles.input}
                            placeholder="Start typing a name…"
                            value={query}
                            onChange={e => setQuery(e.target.value)} />
                    </label>

                    {/* search results with lazy scroll */}
                    {searching && <Loading />}
                    {!searching && query.trim() && results.length === 0 && (
                        <p className={styles.loadingText}>User not found.</p>
                    )}

                    {!searching && results.length > 0 && (
                        <div ref={listRef} className={styles.resultsBox}>
                            {results.map(f => {
                                const picked = formData.invitees.has(f.id);
                                return (
                                    <div key={f.id} className={styles.resultRow}
                                        onClick={() => toggleInvitee(f.id)}>
                                        <Image src={f.profile_pic
                                            ? `${API_URL}/api/storage/avatars/${f.profile_pic}`
                                            : "/img/default-profile.png"}
                                            alt={f.first_name} width={32} height={32}
                                            className={styles.followerAvatar} />
                                        <span className={styles.followerName}>
                                            {f.first_name} {f.last_name}
                                        </span>
                                        <span>{picked ? "✓" : "+"}</span>
                                    </div>);
                            })}
                            {loadingMore && <Loading />}
                            {!hasMore && !loadingMore && offset > SLICE && (
                                <p className={styles.loadingText}>— no more results —</p>
                            )}
                        </div>
                    )}

                    {errorMsg && <p className={styles.error}>{errorMsg}</p>}

                    <div className={styles.actionsRow}>
                        <button type="submit" className={styles.primaryBtn}>Create Group</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
