"use client";

import {
    useEffect,
    useRef,
    useState,
    FormEvent,
    ChangeEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import Loading from "@/components/Loading";
import styles from "./style/comments.module.css";
import { createPortal } from "react-dom";
import { useUser } from "@/context/UserContext";
import  TimeAgo  from "./TimeAgo";

/* ───────── types ───────── */
export type CommentT = {
    comment_id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    profile_pic: string | null;
    content: string;
    img_comment: string | null;
    created_at: string; // ISO
};

const PAGE = 20;

/* ─────── helper ─────── */
const fetchComments = async (
    postId: string,
    offset: number
): Promise<CommentT[]> => {
    const qs = `post_id=${postId}&limit=${PAGE}&offset=${offset}`;
    const r = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/groups/comments?${qs}`,
        { credentials: "include", cache: "no-store" }
    );
    if (!r.ok) throw new Error("fetch comments");
    return r.json();
};

/* ───── component ───── */
export default function PostComments({
    postId,
    onClose,
}: {
    postId: string;
    onClose: () => void;
}) {
    /* refs & state (always run in the same order!) */
    const listRef = useRef<HTMLDivElement>(null);

    const [items, setItems] = useState<CommentT[]>([]);
    const [offset, setOff] = useState(0);
    const [hasMore, setMore] = useState(true);
    const [loadingFirst, setFirst] = useState(true);
    const [loadingMore, setLoad] = useState(false);

    const [text, setText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const [error, setError] = useState("");
    const { user } = useUser();
    if (!user) return null;

    /* ─ first page ─ */
    useEffect(() => {
        let live = true;
        (async () => {
            try {
                const page = await fetchComments(postId, 0);
                if (!page || !live) return;
                setItems(page);
                setOff(page.length);
                setMore(page.length === PAGE);
            } catch (e) {
                console.error(e);
            } finally {
                live && setFirst(false);
            }
        })();
        return () => {
            live = false;
        };
    }, [postId]);

    /* ─ lazy-scroll ─ */
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;

        const onScroll = async () => {
            if (!hasMore || loadingMore) return;
            if (el.scrollHeight - el.scrollTop - el.clientHeight > 250) return;

            setLoad(true);
            try {
                const next = await fetchComments(postId, offset);
                if (!next || !next.length) {
                    setMore(false);
                    return;
                }
                setItems((prev) => {
                    const map = new Map(prev.map(item => [item.comment_id, item]));
                    next.forEach(item => map.set(item.comment_id, item));
                    return Array.from(map.values());
                });
                setOff((o) => o + next.length);
                setMore(next.length === PAGE);
            } catch (e) {
                console.error(e);
            } finally {
                setLoad(false);
            }
        };

        el.addEventListener("scroll", onScroll);
        return () => el.removeEventListener("scroll", onScroll);
    }, [offset, hasMore, loadingMore, postId]);

    /* ─ send comment ─ */
    const send = async (e?: FormEvent) => {
        e?.preventDefault();
        if (!text.trim() && !file) return;

        const fd = new FormData();
        fd.append("post_id", postId);
        fd.append("content", text.trim());
        if (file) fd.append("image", file);

        try {
            const r = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/groups/create-comment`,
                { method: "POST", body: fd, credentials: "include" }
            );
            if (!r.ok) throw new Error((await r.json()).msg || "Something went wrong");
            const added: CommentT = await r.json();
            setItems((prev) => [added, ...prev]);
            setText("");
            setFile(null);
            setError("");
        } catch (e: any) {
            setError(e.message);
            console.error(e);
        }
    };

    /* ──────── UI ──────── */
    const modal = (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.card} onClick={(e) => e.stopPropagation()}>
                <button className={styles.close} onClick={onClose}>
                    ×
                </button>

                <h3 className={styles.title}>Comments</h3>

                {/* list */}
                <div ref={listRef} className={styles.listBox}>
                    {loadingFirst ? (
                        <Loading />
                    ) : items.length === 0 ? (
                        <div className={styles.empty}>
                            <Image src="/img/empty.svg" alt="empty" width={150} height={150} />
                            <p>No comments yet</p>
                        </div>
                    ) : (
                        items.map((c) => (
                            <div key={c.comment_id} className={styles.item}>
                                <div className={styles.bubble}>
                                    <div className={styles.headerRow}>
                                        <Link href={`/profile/${c.user_id}`} className={styles.linkWrapper}>
                                            <Image
                                                src={c.profile_pic ? `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${c.profile_pic}` : "/img/default-avatar.png"}
                                                alt=""
                                                width={40}
                                                height={40}
                                                className={styles.avt}
                                            />
                                        </Link>
                                        <Link href={`/profile/${c.user_id}`} className={styles.nameLink}>
                                            <span className={styles.name}>
                                                {c.first_name} {c.last_name}
                                            </span>
                                        </Link>
                                        <TimeAgo dateStr={c.created_at} />
                                    </div>
                                    <p>{c.content}</p>
                                    {c.img_comment && (
                                        <Image
                                            src={`${process.env.NEXT_PUBLIC_API_URL}/api/storage/groups_comments/${c.img_comment}`}
                                            alt=""
                                            width={200}
                                            height={200}
                                            className={styles.img}
                                        />
                                    )}
                                </div>
                            </div>
                        ))
                    )}

                    {loadingMore && <Loading />}
                    {!hasMore && offset > PAGE && <p className={styles.end}>No More Comments</p>}
                </div>

                {/* composer */}
                <form className={styles.inputRow} onSubmit={send}>
                    <Image
                        src={
                            user.profile_pic
                                ? `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${user.profile_pic}`
                                : `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/avatar.webp`
                        }
                        alt=""
                        width={32}
                        height={32}
                        className={styles.avatar}
                        unoptimized
                    />
                    <textarea
                        className={styles.text}
                        rows={3}
                        placeholder="Write a comment…"
                        value={text}
                        maxLength={500}
                        onChange={(e) => setText(e.target.value)}
                        onInput={(e) => {
                            const ta = e.currentTarget;
                            ta.style.height = "auto"; // reset height
                            ta.style.height = Math.min(ta.scrollHeight, 140) + "px"; // max 140px
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                send(e as any);
                            }
                        }}
                    />

                    <input
                        hidden
                        ref={fileInput}
                        type="file"
                        accept="image/*"
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setFile(e.target.files?.[0] ?? null)
                        }
                    />
                    <div className={styles.btnGroup}>
                        <button
                            type="button"
                            className={styles.imgBtn}
                            onClick={() => fileInput.current?.click()}
                        >
                            <Image src="/img/upload.svg" alt="" width={30} height={30} />
                        </button>

                        <button
                            type="submit"
                            className={styles.send}
                            disabled={!text.trim() && !file}
                        >
                            <Image src="/img/arrow-up.svg" alt="" width={18} height={18} />
                        </button>
                    </div>
                </form>
                <div className={styles.errorSlot}>
                    {error && error}
                </div>
            </div>
        </div >
    );

    return createPortal(modal, document.body);
}
