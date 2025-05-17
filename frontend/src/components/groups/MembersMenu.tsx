"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import styles from "./style/membersMenu.module.css";
import { useWS } from "@/context/wsClient";
import { useGroupSync } from "@/context/GroupSyncContext";   // ← add
import Loading from "@/components/Loading";

export default function MembersMenu() {
    const { id: groupId } = useParams() as { id: string };
    const { groupMembers, subscribeGroup, online } = useWS();
    const { version } = useGroupSync();                         // ← add

    const members = groupMembers.get(groupId);

    /* ask the server whenever: groupId mounts OR GroupSync version bumps */
    useEffect(() => {
        if (groupId) subscribeGroup(groupId);
    }, [groupId, version, subscribeGroup]);                     // ← watch version

    if (!members) return <Loading />;
    if (members.length === 0) return null;

    return (
        <aside className={styles.menu}>
            <h4 className={styles.section}>Members</h4>
            <div className={styles.list}>
                {members.map((m) => {
                    const isOn = online.has(m.id);
                    return (
                        <Link
                            key={m.id}
                            href={`/profile/${m.id}`}
                            className={`${styles.item} ${isOn ? styles.online : styles.offline}`}
                        >
                            <Image
                                src={
                                    m.profile_pic
                                        ? `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${m.profile_pic}`
                                        : `/img/default-avatar.png`
                                }
                                alt=""
                                width={36}
                                height={36}
                                className={styles.avt}
                            />
                            <span className={styles.name}>
                                {m.first_name} {m.last_name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </aside>
    );
}
