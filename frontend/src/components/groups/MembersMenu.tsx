"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import styles from "./style/membersMenu.module.css";
import LoadingSpinner from "../Loading";
import { useGroupSync } from "@/context/GroupSyncContext";


interface Member {
    id: string;
    first_name: string;
    last_name: string;
    profile_pic: string | null;
}

export default function MembersMenu() {
    const { id: groupId } = useParams() as { id: string };

    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoad] = useState(true);
    const [err, setErr] = useState("");
    const { version } = useGroupSync();

    useEffect(() => {
        if (!groupId) return;
        let live = true;

        (async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/groups/members?id=${groupId}`,
                    { credentials: "include", cache: "no-store" }
                );
                if (!res.ok) throw new Error();
                const arr: Member[] = await res.json();
                live && setMembers(arr);
            } catch {
                live && setErr("Failed to load members");
            } finally { live && setLoad(false); }
        })();

        return () => { live = false; };
    }, [groupId, version]);

    if (loading) return <LoadingSpinner />;
    if (err) return <p className={styles.error}>{err}</p>;
    if (!members.length) return null;

    return (
        <aside className={styles.menu}>
            <h4 className={styles.section}>Members</h4>
            <div className={styles.list}>
                {members.map(m => (
                    <Link key={m.id} href={`/profile/${m.id}`} className={styles.item}>
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
                        <span className={styles.name}>{m.first_name} {m.last_name}</span>
                    </Link>
                ))}
            </div>
        </aside>
    );
}
