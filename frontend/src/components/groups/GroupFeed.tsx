"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import GroupPost from "./GroupPost";
import styles from "./style/groupFeed.module.css";
import { useGroupFeed } from "@/context/GroupFeedContext";


type Post = Parameters<typeof GroupPost>[0]["p"];

export default function Feed() {
    const { id: groupId } = useParams() as { id: string };
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoad] = useState(true);
    const [error, setErr] = useState<string | null>(null);
    const { feedVersion } = useGroupFeed();

    useEffect(() => {
        let live = true;
        (async () => {
            try {
                const r = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/groups/posts?group_id=${groupId}&limit=20`,
                    { credentials: "include", cache: "no-store" }
                );
                if (!r.ok) throw new Error("fetch fail");
                const data: Post[] = await r.json();
                live && setPosts(data);
            } catch (e) {
                live && setErr("Couldn't load feed");
                console.error(e);
            } finally {
                live && setLoad(false);
            }
        })();
        return () => { live = false; };
    }, [groupId, feedVersion]);

    if (loading) return <p className={styles.status}>Loading…</p>;
    if (error) return <p className={styles.status}>{error}</p>;
    if (!posts || posts.length === 0) return <p className={styles.status}>No posts yet.</p>;

    return (
        <div className={styles.feed}>
            {posts.map(p => <GroupPost key={p.post_id} p={p} />)}
        </div>
    );
}
