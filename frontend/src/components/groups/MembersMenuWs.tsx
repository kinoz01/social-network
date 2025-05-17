"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import styles from "./style/membersMenu.module.css";
import Loading from "@/components/Loading";
import { useGroupSync } from "@/context/GroupSyncContext";

/* ────────────────── types ────────────────── */
interface Member {
    id: string;
    first_name: string;
    last_name: string;
    profile_pic: string ;
    isOnline?: boolean;
}

export default function MembersMenu() {
    const { id: groupId } = useParams() as { id: string };
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoad] = useState(true);
    const [err, setErr] = useState("");
    const { version } = useGroupSync();

    useEffect(() => {
        if (!groupId) return;

        let socket: WebSocket | null = null;
        let abort = false;

        /* -----------------------------------------------------------
         * 1) Initial snapshot (REST) - marks everyone offline
         * --------------------------------------------------------- */
        (async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/groups/members?id=${groupId}`,
                    { credentials: "include", cache: "no-store" }
                );
                if (!res.ok) throw new Error();

                const list: Member[] = await res.json();
                if (!abort) setMembers(list.map(m => ({ ...m, isOnline: false })));
            } catch {
                !abort && setErr("Failed to load members");
            } finally {
                !abort && setLoad(false);
            }
        })();

        /* -----------------------------------------------------------
         * 2) Live updates (WebSocket)
         *    Expected payload: full list with `isOnline` flags
         * --------------------------------------------------------- */
        socket = new WebSocket(
            `ws://localhost:8080/api/ws/groups/members?group_id=${groupId}`
        );

        socket.onmessage = ev => {
            try {
                const list: Member[] = JSON.parse(ev.data);

                // Ensure the flag is present; default to true (online) for safety
                const normalised = list.map(m => ({
                    ...m,
                    isOnline: m.isOnline ?? true,
                }));                

                console.log("Members update", normalised);
                
                setMembers(normalised);
                setErr("");
                setLoad(false);
            } catch(err) {
                console.warn("Malformed payload", err);
            }
        };

        socket.onerror = () => socket?.close();

        return () => {
            abort = true;
            socket?.close();
        };
    }, [groupId, version]);

    /* ────────────────── render ────────────────── */
    if (loading) return <Loading />;
    if (err) return <p className={styles.error}>{err}</p>;
    if (!members.length) return null;

    return (
        <aside className={styles.menu}>
            <h4 className={styles.section}>Members</h4>

            <div className={styles.list}>
                {members.map(m => (                    
                    <Link
                        key={m.id}
                        href={`/profile/${m.id}`}
                        className={`${styles.item} ${m.isOnline ? styles.online : styles.offline}`}
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
                ))}
            </div>
        </aside>
    );
}
