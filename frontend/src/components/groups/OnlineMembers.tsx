"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import styles from "./style/membersMenu.module.css";
import { useWS } from "@/context/wsClient";
import { useGroupSync } from "@/context/GroupSyncContext";
import Loading from "@/components/Loading";
import { API_URL } from "@/lib/api_url";


export default function MembersMenu() {
    const { id: groupId } = useParams() as { id: string };
    const { groupMembers, getGroupMembers, online } = useWS();
    const { version } = useGroupSync();
   
    const members = groupMembers.get(groupId); 

    // refresh members when groupId or version changes
    useEffect(() => {
        if (groupId) getGroupMembers(groupId);
    }, [groupId, version, getGroupMembers]);

    //- React runs the function inside useMemo only when either members or online change. If neither has changed since the between renders, it reuses the cached onlineMembers result.
    const onlineMembers = useMemo(() => {
        if (!members) return [];
        return members
          .filter(m => online.has(m.id))                              // filter offline
          .sort((a, b) => a.first_name.localeCompare(b.first_name));  // simple alpha
      }, [members, online]);

    if (!members) return <Loading />;
    if (members.length === 0) return null;

    return (
        <aside className={styles.menu}>
            <h4 className={styles.section}>Online Members</h4>
            <div className={styles.list}>
                {onlineMembers.map((m) => {
                    return (
                        <Link
                            key={m.id}
                            href={`/profile/${m.id}`}
                            className={`${styles.item} ${styles.online }`}
                        >
                            <Image
                                src={
                                    m.profile_pic
                                        ? `${API_URL}/api/storage/avatars/${m.profile_pic}`
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
