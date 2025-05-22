"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import Image from "next/image";
import styles from "./style/createGroup.module.css";
import Loading from "@/components/Loading";

interface Follower {
    id: string;
    first_name: string;
    last_name: string;
    profile_pic: string | null;
}
interface Props {
    onClose: () => void;
}
interface FormDataState {
    groupPic: File | null;
    groupName: string;
    description: string;
    invitees: Set<string>;
    inviteAllBool: boolean;
}

export default function CreateGroupModal({ onClose }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* -------------------- ui state -------------------- */
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState("");

    const [formData, setFormData] = useState<FormDataState>({
        groupPic: null,
        groupName: "",
        description: "",
        invitees: new Set(),
        inviteAllBool: false,
    });

    /* ------------------ image picker ------------------ */
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) {
            setPreviewUrl(null);
            setFormData((p) => ({ ...p, groupPic: null }));
            return;
        }
        if (!f.type.startsWith("image/")) {
            setErrorMsg("Unsupported image format.");
            return;
        }
        setFormData((p) => ({ ...p, groupPic: f }));
        setPreviewUrl(URL.createObjectURL(f));
    };

    /* ------------------------------------------------------------------ */
    /* follower search + selection -------------------------------------- */
    /* ------------------------------------------------------------------ */
    /** list of every follower ever fetched **/
    const [allFollowers, setAllFollowers] = useState<Map<string, Follower>>(new Map());

    /** current search results list */
    const [results, setResults] = useState<Follower[]>([]);
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [hasFollowers, setHasFollowers] = useState<boolean | null>(null);

    /** fetch followers whose name matches `q` */
    const runSearch = async (q: string) => {
        try {
            setSearching(true);

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/followers` +
                `?status=accepted&query=${encodeURIComponent(q)}`,
                { credentials: "include" }
            );
            /* -------------- 404 means "no match" - clear the list ------------------- */
            if (res.status === 404) {
                setResults([]);
                if (hasFollowers === null) setHasFollowers(false);   // first check
                return;                                              // ← skip .json()
            }

            if (!res.ok) throw new Error("search failed");

            const list: Follower[] = await res.json();
            setResults(list);

            /* remember them so "invite all" knows the full set */
            setAllFollowers(prev => {
                const next = new Map(prev);
                list.forEach(f => next.set(f.id, f));
                return next;
            });
        } catch (err) {
            console.error(err);
            setResults([]);               // keep UI in sync on other errors
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        if (query.trim() === '') {
            setResults([]);
            return;
        }
        runSearch(query.trim());
    }, [query]);

    /* select / unselect one follower */
    const toggleInvitee = (id: string) =>
        setFormData(prev => {
            const invitees = new Set(prev.invitees);
            invitees.has(id) ? invitees.delete(id) : invitees.add(id);
            return { ...prev, invitees, inviteAllBool: false };
        });

    /* invite all OR unselect all */
    const toggleInviteAll = () => {
        setFormData(prev => {
            const all = new Set(allFollowers.keys());
            const willSelectAll = !prev.inviteAllBool;

            return {
                ...prev,
                inviteAllBool: willSelectAll,
                invitees: willSelectAll ? all : new Set()
            };
        });
    };

    /* ---------------- submit ---------------- */
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        if (!formData.groupName.trim()) {
            setErrorMsg("Group name required.");
            return;
        }

        const body = new FormData();
        body.append("group_name", formData.groupName);
        body.append("description", formData.description);
        if (formData.groupPic) body.append("group_pic", formData.groupPic);
        if (formData.inviteAllBool) {
            body.append("invitee_ids", "ALL");
        } else {
            body.append("invitee_ids", JSON.stringify(Array.from(formData.invitees)));
        }

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/groups/create`,
                { method: "POST", body, credentials: "include" }
            );
            if (!res.ok) throw new Error((await res.json()).msg);
            onClose(); // success
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "Failed to create group.");
        }
    };

    // Prevent background scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        // Restore scroll when modal unmounts
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    useEffect(() => {
        /* fire once to know whether the user has any followers at all */
        const checkFollowers = async () => {
            try {
                /* only ask for a single row to minimise payload */
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/followers?status=accepted&limit=1`,
                    { credentials: 'include' }
                );
                if (!res.ok) throw new Error();
                const list: Follower[] = await res.json();
                setHasFollowers(list.length > 0);   // true or false
            } catch {
                setHasFollowers(false);             // treat errors as “none”
            }
        };
        checkFollowers();
    }, []);

    /* ---------------- render ---------------- */
    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} type="button" onClick={onClose}>
                    ×
                </button>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <p className={styles.avatarLabel}>Choose Group Image</p>
                    <div
                        className={styles.avatarCircle}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {previewUrl ? (
                            <img src={previewUrl} alt="preview" className={styles.avatarImg} />
                        ) : (
                            <span className={styles.plusIcon}>＋</span>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => { setErrorMsg(""), handleFileChange(e) }}
                    />

                    <label className={styles.label}>
                        Group Name
                        <input
                            className={styles.input}
                            value={formData.groupName}
                            onChange={(e) => {
                                setErrorMsg("")
                                setFormData((p) => ({ ...p, groupName: e.target.value }))
                            }}
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
                            onChange={(e) => {
                                setErrorMsg(""),
                                    setFormData((p) => ({ ...p, description: e.target.value }))
                            }}
                            rows={3}
                            maxLength={150}
                            placeholder="A short description of the group"
                            required
                        />
                    </label>

                    <div className={styles.label}>
                        Invited
                        <div className={styles.selectedBox /* give this a fixed height and overflow‑y: auto */}>
                            {formData.inviteAllBool ? (
                                <p className={styles.loadingText}>You invited all your followers.</p>
                            ) : formData.invitees.size === 0 ? (
                                <p className={styles.loadingText}>
                                    {hasFollowers === false ? 'You have no followers.' : 'No one invited yet.'}
                                </p>
                            ) : (
                                Array.from(formData.invitees).map(id => {
                                    const f = allFollowers.get(id)!;   // always defined if we added correctly
                                    return (
                                        <div key={id} className={styles.invitedRow}>
                                            <Image
                                                src={
                                                    f.profile_pic
                                                        ? `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${f.profile_pic}`
                                                        : '/img/default-profile.png'
                                                }
                                                alt={f.first_name}
                                                width={28}
                                                height={28}
                                                className={styles.followerAvatar}
                                            />
                                            <span className={styles.followerName}>{f.first_name} {f.last_name}</span>
                                            <button
                                                type="button"
                                                className={styles.removeBtn}
                                                onClick={() => toggleInvitee(id)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* -------- Search box + live results -------- */}
                    <label className={styles.label}>
                        Search followers
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="Start typing a name…"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                    </label>

                    {searching && <Loading />}
                    {!searching && query.trim() !== '' && results.length === 0 && (
                        <p className={styles.loadingText}>User not found.</p>
                    )}
                    {!searching && results.length > 0 && (
                        <div className={styles.resultsBox}>
                            {results.map(f => {
                                const selected = formData.invitees.has(f.id);
                                return (
                                    <div
                                        key={f.id}
                                        className={styles.resultRow}
                                        onClick={() => toggleInvitee(f.id)}
                                    >
                                        <Image
                                            src={
                                                f.profile_pic
                                                    ? `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${f.profile_pic}`
                                                    : '/img/default-profile.png'
                                            }
                                            alt={f.first_name}
                                            width={32}
                                            height={32}
                                            className={styles.followerAvatar}
                                        />
                                        <span className={styles.followerName}>{f.first_name} {f.last_name}</span>
                                        <span>
                                            {selected ? '✓' : '+'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* -------- Invite‑all toggle -------- */}
                    {hasFollowers && (
                        <div style={{ textAlign: 'right', marginTop: '0.25rem' }}>
                            <span className={styles.inviteAllLink} onClick={toggleInviteAll}>
                                {formData.inviteAllBool ? 'Unselect all' : 'Invite all followers'}
                            </span>
                        </div>
                    )}

                    {errorMsg && <p className={styles.error}>{errorMsg}</p>}

                    <div className={styles.actionsRow}>
                        <button type="submit" className={styles.primaryBtn}>
                            Create Group
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
