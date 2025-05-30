"use client";

import {
    useState,
    useEffect,
    useRef,
    FormEvent,
    KeyboardEvent,
} from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import GroupPost from "./GroupPost";
import Loading from "@/components/Loading";
import styles from "./style/groupFeed.module.css";
import { Post } from "./GroupPost";

const PAGE_SIZE = 20;

/* ──────────────────────────────  FEED  ────────────────────────────── */
export default function GroupFeed() {
    const { id: groupId } = useParams() as { id: string };
    const boxRef = useRef<HTMLDivElement>(null);

    const [posts, setPosts] = useState<Post[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingFirst, setLoadingFirst] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    /* ---------- helpers ---------- */
    const fetchPage = async (off: number): Promise<Post[]> => {
        const qs = `group_id=${groupId}&limit=${PAGE_SIZE}&offset=${off}`;
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/groups/posts?${qs}`,
            { credentials: "include", cache: "no-store" }
        );
        if (!res.ok) throw new Error("Failed to load posts");
        return res.json();
    };

    const loadInitialFeed = async () => {
        setLoadingFirst(true);
        try {
            const page = await fetchPage(0);
            if (!page) return;
            setPosts(page);
            setOffset(page.length);
            setHasMore(page.length === PAGE_SIZE);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingFirst(false);
        }
    };

    const loadMorePosts = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const next = await fetchPage(offset);
            if (!next.length) {
                setHasMore(false);
                return;
            }
            setPosts((prev) => [...prev, ...next]);
            setOffset((o) => o + next.length);
            setHasMore(next.length === PAGE_SIZE);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMore(false);
        }
    };

    /* ---------- effects ---------- */
    useEffect(() => {
        loadInitialFeed();
    }, [groupId]);

    useEffect(() => {
        const el = boxRef.current;
        if (!el) return;

        const onScroll = throttle(() => {
            const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 250;
            if (nearBottom) loadMorePosts();
        }, 300);

        el.addEventListener("scroll", onScroll);
        return () => el.removeEventListener("scroll", onScroll);
    }, [loadMorePosts]);

    /* ---------- helpers ---------- */
    const prependPost = (p: Post) => setPosts((prev) => [p, ...prev]);

    /* ---------- UI ---------- */
    if (loadingFirst) return <Loading />;

    return (
        <>
            <PostInput groupId={groupId} onAdd={prependPost} />

            {!posts || posts.length === 0 ? (
                <div className={styles.status}>
                    <p>No posts yet.</p>
                    <Image src="/img/empty.svg" alt="" width={200} height={200} />
                </div>
            ) : (
                <div ref={boxRef} className={styles.feed}>
                    {posts.map((p) => (
                        <GroupPost key={p.post_id} p={p} />
                    ))}
                    {loadingMore && <Loading />}
                    {!hasMore && offset > PAGE_SIZE && (
                        <p className={styles.status}>End of feed</p>
                    )}
                </div>
            )}
        </>
    );
}

/* ─────────────────────  POST INPUT ───────────────────── */
function PostInput({
    groupId,
    onAdd,
}: {
    groupId: string;
    onAdd: (p: Post) => void;
}) {
    const { user } = useUser();
    const [text, setText] = useState("");
    const [image, setImg] = useState<File | null>(null);
    const [loading, setLoad] = useState(false);
    const [errMsg, setErr] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    if (!user) return null;

    /* ---------- handlers ---------- */
    const onPick = (e: React.ChangeEvent<HTMLInputElement>) =>
        setImg(e.target.files?.[0] ?? null);

    const submit = async () => {
        if (!text.trim()) return;

        const fd = new FormData();
        fd.append("group_id", groupId);
        fd.append("body", text.trim());
        if (image) fd.append("image", image);

        setLoad(true);
        try {
            const r = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/groups/create-post`,
                { method: "POST", body: fd, credentials: "include" }
            );
            if (!r.ok) throw new Error((await r.json()).msg || "Could not post");

            const added: Post = await r.json();
            onAdd(added); // prepend to feed
            setText("");
            setImg(null);
            setErr("");

            // reset height
            const ta = document.querySelector(`.${styles.input}`) as HTMLTextAreaElement | null;
            if (ta) ta.style.height = "auto";
        } catch (e: any) {
            setErr(e.message || "Could not post");
        } finally {
            setLoad(false);
        }
    };

    const onSubmit = (e?: FormEvent) => {
        e?.preventDefault();
        submit();
    };

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    const onInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const ta = e.currentTarget;
        ta.style.height = "auto";
        ta.style.height = ta.scrollHeight + "px";
    };

    const avatar = user.profile_pic
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${user.profile_pic}`
        : "/img/default-avatar.png";

    /* ---------- UI ---------- */
    return (
        <form onSubmit={onSubmit} className={styles.postBox}>
            <div className={styles.inputRow}>
                <Image src={avatar} alt="" width={40} height={40} className={styles.avatar} />
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={onKeyDown}
                    onInput={onInput}
                    placeholder="Share your thoughts…"
                    className={styles.input}
                    rows={2}
                    maxLength={1500}
                />
                <button
                    type="submit"
                    disabled={loading}
                    className={styles.postButtonIcon}
                >
                    <Image src="/img/arrow-up.svg" alt="" width={18} height={18} />
                </button>
            </div>

            <div className={styles.actionRow}>
                {errMsg && <span className={styles.error}>{errMsg}</span>}

                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={onPick}
                />
                {image && (
                    <span className={styles.fileName}>
                        {truncateFileName(image.name, 50)}
                    </span>
                )}
                <button
                    type="button"
                    className={styles.imageButton}
                    onClick={() => fileRef.current?.click()}
                >
                    <Image src="/img/upload.svg" alt="" width={25} height={25} />
                </button>
            </div>
        </form>
    );
}

function truncateFileName(name: string, max: number = 30): string {
    if (name.length <= max) return name;
    const dotIndex = name.lastIndexOf(".");
    if (dotIndex <= 0) return name.slice(0, max - 3) + "...";
    const ext = name.slice(dotIndex);
    const base = name.slice(0, max - ext.length - 3);
    return base + "..." + ext;
}

// Throttle helper
export const throttle = (fn: (...a: any[]) => void, wait = 300) => {
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
