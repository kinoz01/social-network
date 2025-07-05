"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import styles from "./style/groupMenu.module.css";
import Loading from "@/components/Loading";
import { useGroupSync } from "@/context/GroupSyncContext";
import InviteMenu from "@/components/groups/InviteMenu";
import { RequestsModal } from "@/components/groups/RequestsMenu";
import AllMembersMenu from "@/components/groups/AllMembersMenu";
import { API_URL } from "@/lib/api_url";


interface Info {
    id: string;
    group_name: string;
    description: string;
    group_pic: string;
    members: number;
    isOwner: boolean;
}

export default function GroupMenu() {
    const id = useParams().id as string;

    const [data, setData] = useState<Info | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { version } = useGroupSync();
    const [inviteOpen, setInviteOpen] = useState(false);
    const [requestsOpen, setRequestsOpen] = useState(false);
    const [allMembersOpen, setAllMembersOpen] = useState(false);

    useEffect(() => {
        if (!id) return;

        let isMounted = true;

        (async () => {
            try {
                const res = await fetch(`${API_URL}/api/groups/groupInfo?group_id=${id}`, {
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

        return () => {
            isMounted = false;
        };
    }, [id, version]);

    if (loading) return <Loading />;
    if (error || !data) return <p className={styles.error}>{error}</p>;

    return (
        <>
            <h2 className={styles.nameTitle}>{data.group_name}</h2>
            <div className={styles.groupMenu}>
                <div className={styles.header}>
                    <Image
                        src={data.group_pic
                            ? `${API_URL}/api/storage/groups_avatars/${data.group_pic}`
                            : "/img/default-group.jpg"}
                        alt="group avatar"
                        width={160}
                        height={160}
                        className={styles.avatar}
                        unoptimized
                    />
                    <h2 className={styles.name}>{data.group_name}</h2>
                    <p className={styles.memberCount}>{data.members} Member{data.members > 1 ? "s" : ""}</p>
                    <p className={styles.about}>{data.description}</p>
                </div>

                <nav className={styles.menu}>
                    <Link href={`/groups/${id}`} className={styles.menuItem} title="Posts">
                        <Image src="/img/menu-posts.svg" alt="" width={22} height={22} />
                        <span className={styles.label}>Posts</span>
                    </Link>
                    <Link href={`/groups/${id}/chat`} className={styles.menuItem} title="Chat">
                        <Image src="/img/menu-chat.svg" alt="" width={22} height={22} />
                        <span className={styles.label}>Chat</span>
                    </Link>
                    <Link href={`/groups/${id}/events`} className={styles.menuItem} title="Events">
                        <Image src="/img/menu-events.svg" alt="" width={22} height={22} />
                        <span className={styles.label}>Events</span>
                    </Link>
                    <button
                        className={`${styles.menuItem} ${styles.responsiveOnly}`}
                        onClick={() => setInviteOpen(true)}
                        title="Invite Members"
                    >
                        <Image src="/img/menu-invite.svg" alt="" width={22} height={22} />
                        <span className={styles.label}>Invite</span>
                    </button>
                    {data.isOwner && (
                        <button
                            className={`${styles.menuItem} ${styles.responsiveOnly}`}
                            onClick={() => setRequestsOpen(true)}
                            title="Join Requests"
                        >
                            <Image src="/img/menu-requests.svg" alt="" width={22} height={22} />
                            <span className={styles.label}>Join Requests</span>
                        </button>
                    )}
                    <button
                        className={`${styles.menuItem} ${styles.responsiveOnly}`}
                        onClick={() => setAllMembersOpen(true)}
                        title="Group Members"
                    >
                        <Image src="/img/menu-members.svg" alt="" width={22} height={22} />
                        <span className={styles.label}>Members</span>
                    </button>
                </nav>
            </div>

            {/* Invite Modal */}
            {inviteOpen && (
                <InviteMenu modal onClose={() => setInviteOpen(false)} />
            )}
            {requestsOpen && (
                <RequestsModal modal onClose={() => setRequestsOpen(false)} />
            )}
            {allMembersOpen && (
                < AllMembersMenu modal onClose={() => setAllMembersOpen(false)}/>
            )}
        </>
    );
}
