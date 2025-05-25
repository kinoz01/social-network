"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import styles from "./style/membersMenu.module.css";
import { useWS } from "@/context/wsClient";
import { useGroupSync } from "@/context/GroupSyncContext";
import Loading from "@/components/Loading";

export default function MembersMenu() {
    const { id: groupId } = useParams() as { id: string };
    const { groupMembers, getGroupMembers, online } = useWS();
    const { version } = useGroupSync();

    const members = groupMembers.get(groupId);

    /* refresh snapshot when groupId or version changes */
    useEffect(() => {
        if (groupId) getGroupMembers(groupId);
    }, [groupId, version, getGroupMembers]);

    /* ---------- sort: online first, then alphabetically ---------- */
    const ordered = useMemo(() => {
        if (!members) return [];
        return [...members].sort((a, b) => {
            const aOn = online.has(a.id) ? 0 : 1;   // online users => 0
            const bOn = online.has(b.id) ? 0 : 1;   // offline users => 1
            if (aOn !== bOn) return aOn - bOn;      // online block first
            return a.first_name.localeCompare(b.first_name); // tie-break
        });
    }, [members, online]);

    if (!members) return <Loading />;
    if (members.length === 0) return null;

    return (
        <aside className={styles.menu}>
            <h4 className={styles.section}>Members</h4>
            <div className={styles.list}>
                {ordered.map((m) => {
                    const isOn = online.has(m.id);
                    return (
                        <Link
                            key={m.id}
                            href={`/profile/${m.id}`}
                            className={`${styles.item} ${isOn ? styles.online : styles.offline
                                }`}
                        >
                            <Image
                                src={
                                    m.profile_pic
                                        ? `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${m.profile_pic}`
                                        : "/img/default-avatar.png"
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
