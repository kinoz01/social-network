"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import GroupPost from "./GroupPost";
import styles from "./style/groupFeed.module.css";
import Loading from "@/components/Loading";
import { useGroupFeed } from "@/context/GroupFeedContext";
// import { Post } from "./GroupPost";

type Post = Parameters<typeof GroupPost>[0]["p"];
const PAGE_SIZE = 20;

export default function Feed() {
    const { id: groupId } = useParams() as { id: string };
    const { feedVersion } = useGroupFeed();
    const boxRef = useRef<HTMLDivElement>(null);

    const [posts, setPosts] = useState<Post[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingFirst, setLoadingFirst] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Fetch page helper
    const fetchPage = async (off: number) => {
        const qs = `group_id=${groupId}&limit=${PAGE_SIZE}&offset=${off}`;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/posts?${qs}`, {
            credentials: "include",
            cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load posts");
        return (await res.json()) as Post[];
    };

    // Handle initial load and feed refresh
    const loadInitialFeed = async () => {
        setLoadingFirst(true);
        try {
            const page = await fetchPage(0);
            if (!page || !page.length) return         
            setPosts(page);
            setOffset(page.length);
            setHasMore(page.length === PAGE_SIZE);
            
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingFirst(false);
        }
    };

    // Lazy loading handler
    const loadMorePosts = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const next = await fetchPage(offset);
            if (!next || !next.length) {
                setHasMore(false);
                return;
            }
            setPosts(prev => [...prev, ...next]);
            setOffset(o => o + next.length);
            setHasMore(next.length === PAGE_SIZE);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMore(false);
        }
    };

    // Load initial or on feedVersion change
    useEffect(() => {
        loadInitialFeed();
    }, [groupId, feedVersion]);

    // Bind lazy scroll
    useEffect(() => {
        const el = boxRef.current;
        if (!el) return;

        const onScroll = throttle(() => {
            const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 250;
            if (nearBottom) loadMorePosts();
        }, 300);

        el.addEventListener("scroll", onScroll);
        return () => el.removeEventListener("scroll", onScroll);
    }, [loadMorePosts]); // Only rebind if loadMorePosts ref changes

    // UI States
    if (loadingFirst) return <Loading />;
    if (!posts || !posts.length) {
        return (
            <div className={styles.status}>
                <p>No posts yet.</p>
                <Image src="/img/empty.svg" alt="Empty state" width={200} height={200} />
            </div>
        );
    }

    return (
        <div ref={boxRef} className={styles.feed}>
            {posts.map(p => <GroupPost key={p.post_id} p={p} />)}
            {loadingMore && <Loading />}
            {!hasMore && offset > PAGE_SIZE && <p className={styles.status}>End of feed</p>}
        </div>
    );
}

// Throttle helper
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
