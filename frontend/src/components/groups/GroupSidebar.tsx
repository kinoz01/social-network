"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";  // ✅ Import useParams
import Image from "next/image";
import styles from "./style/groupLayout.module.css";
import LoadingSpinner from "@/components/Loading";

interface Info {
    id: string;
    group_name: string;
    description: string;
    group_pic: string;
    members: number;
}

export function GroupSidebar() {
    const params = useParams();
    const id = params.id as string;  // ✅ Extract group ID

    const [data, setData] = useState<Info | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;  // Guard if no ID

        let isMounted = true;

        (async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/groupInfo?id=${id}`, {
                    credentials: "include",
                    cache: "no-store",
                });
                if (!res.ok) throw new Error("Failed to fetch group info");
                const info: Info = await res.json();
                if (isMounted) setData(info);
            } catch (err) {
                if (isMounted) setError("Could not load group");
                console.error(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        })();

        return () => { isMounted = false; };
    }, [id]);

    if (loading) return <LoadingSpinner />;
    if (error || !data) return <p className={styles.error}>{error}</p>;

    return (
        <>
            <div className={styles.header}>
                <Image
                    src={data.group_pic || "/img/default-group.jpg"}
                    alt="group avatar"
                    width={160}
                    height={160}
                    className={styles.avatar}
                />
                <h2 className={styles.name}>{data.group_name}</h2>
                <p className={styles.memberCount}>{data.members} Members</p>
                <p className={styles.about}>{data.description}</p>
            </div>

            <nav className={styles.menu}>
                <button className={styles.menuItem}>
                    <Image src="/img/menu-posts.svg" alt="" width={22} height={22} />
                    <span className={styles.label}>Posts</span>
                </button>
                <button className={styles.menuItem}>
                    <Image src="/img/menu-chat.svg" alt="" width={22} height={22} />
                    <span className={styles.label}>Chat</span>
                </button>
                <button className={styles.menuItem}>
                    <Image src="/img/menu-events.svg" alt="" width={22} height={22} />
                    <span className={styles.label}>Events</span>
                </button>
                <button className={styles.menuItem}>
                    <Image src="/img/menu-invite.svg" alt="" width={22} height={22} />
                    <span className={styles.label}>Invite</span>
                </button>
            </nav>
        </>
    );
}
