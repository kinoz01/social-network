"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import Image from "next/image";
import styles from "../style/createGroup.module.css";
import LoadingSpinner from "@/components/Loading";

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
    const [followers, setFollowers] = useState<Follower[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [offset, setOffset] = useState(0);
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

    /* ---------- followers lazy-scroll ---------- */
    const limit = 1;
    const fetchFollowers = async () => {
        setLoadingMore(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/followers?status=accepted&offset=${offset}&limit=${limit}`,
                { credentials: "include" }
            );
            if (!res.ok) throw new Error("Load followers failed");
            const data: Follower[] = (await res.json()) ?? [];

            setFollowers(prev => {
                const seen = new Set(prev.map(f => f.id));
                return [...prev, ...data.filter(d => !seen.has(d.id))];
            });

            setHasMore(data.length !== 0); // stop when backend returns 0
            setOffset(prev => prev + data.length);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMore(false);
        }
    };

    /* first load after DOM */
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchFollowers();
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    /* Add scroll listener once */
    const listRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        const handle = () => {
            if (loadingMore || !hasMore) return;
            const nearBottom =
                el.scrollTop + el.clientHeight >= el.scrollHeight - 16;
            if (nearBottom) fetchFollowers();
        };
        el.addEventListener("scroll", handle);
        return () => el.removeEventListener("scroll", handle);
    }, [loadingMore]);


    /* ---------------- invite select helpers ---------------- */
    const toggleInvitee = (id: string) =>
        setFormData((prev) => {
            const invitees = new Set(prev.invitees);
            invitees.has(id) ? invitees.delete(id) : invitees.add(id);

            const allSelected = invitees.size === followers.length;

            return {
                ...prev,
                invitees,
                inviteAllBool: allSelected,
            };
        });

    const inviteAll = () => {
        setFormData((prev) => {
            const allInvited = prev.invitees.size === followers.length;
            return {
                ...prev,
                inviteAllBool: !allInvited, // flip on/off
                invitees: allInvited ? new Set() : new Set(followers.map((f) => f.id)),
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
                        Invite Followers
                        <div className={styles.followersBox} ref={listRef} >
                            {followers.map((f) => (
                                <div className={styles.followerRow} key={f.id} onClick={() => toggleInvitee(f.id)} >
                                    <Image
                                        src={
                                            f.profile_pic
                                                ? `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${f.profile_pic}`
                                                : "/img/default-profile.png"
                                        }
                                        alt={f.first_name}
                                        width={32}
                                        height={32}
                                        className={styles.followerAvatar}
                                    />
                                    <span className={styles.followerName}>
                                        {f.first_name} {f.last_name}
                                    </span>
                                    <input
                                        type="checkbox"
                                        className={styles.checkbox}
                                        checked={formData.invitees.has(f.id)}
                                        onChange={() => toggleInvitee(f.id)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            ))}

                            {loadingMore && (
                                <div><LoadingSpinner /></div>
                            )}
                            {!hasMore && followers.length === 0 && (
                                <p className={styles.loadingText}>You don't have any followers</p>
                            )}
                        </div>
                    </div>

                    {followers.length > 0 && (
                        <div style={{ textAlign: "right", marginTop: "-0.6rem" }}>
                            <span className={styles.inviteAllLink} onClick={inviteAll}>
                                {formData.invitees.size === followers.length ? 'Unselect all' : 'Invite all your followers'}
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
