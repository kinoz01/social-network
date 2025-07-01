"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWS } from "@/context/wsClient";
import { useUser } from "@/context/UserContext";
import Loading from "@/components/Loading";
import styles from "./style/dmsMenu.module.css";
import { API_URL } from "@/lib/api_url";
import { usePathname } from "next/navigation";
import TimeAgo from "../groups/TimeAgo";

interface DMEntry {
    peer_id: string;
    first_name: string;
    last_name: string;
    profile_pic: string | null;
    last_content: string;
    last_time: string;
    unread_count: number;
}

const MAX_DMS = 300;

export default function DMsMenu() {
    const { meId, online, dmFeed, markChatRead } = useWS();
    const { user } = useUser();

    const [list, setList] = useState<DMEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const pathname = usePathname();

    // initial list fetch
    useEffect(() => {
        if (!user) return;

        const fetchDMList = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `${API_URL}/api/chat/dm-list?limit=${MAX_DMS}`,
                    { credentials: "include", cache: "no-store" }
                );

                if (res.status === 204) {
                    setList([]);
                    return;
                }
                if (!res.ok) throw new Error("Failed to load DM list");

                let raw: DMEntry[] = await res.json();
                raw = dedupePeerId(raw); //- safety to remove duplicate

                //- no badge for the thread the user is already viewing
                const match = pathname.match(/^\/chat\/([^/]+)$/); //- we capture peer id at the current path 
                if (match) {
                    const openPeer = match[1];
                    raw = raw.map(e =>
                        e.peer_id === openPeer ? { ...e, unread_count: 0 } : e //- if open peer set it's unread_count to 0
                    );
                }

                setList(raw);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDMList();
    }, [user, pathname]);

    // update on every new DM
    useEffect(() => {
        if (!meId || dmFeed.length === 0) return;
        const incoming = dmFeed[dmFeed.length - 1];

        const peerId =
            incoming.sender_id === meId ? incoming.receiver_id! : incoming.sender_id;

        setList(prev => {
            const filtered = prev.filter(e => e.peer_id !== peerId);
            const iAmReceiver = incoming.receiver_id === meId;
            const isOpen = pathname === `/chat/${peerId}`;

            const existing =
                prev.find(e => e.peer_id === peerId) || {
                    first_name: incoming.first_name,
                    last_name: incoming.last_name,
                    profile_pic: incoming.profile_pic,
                    unread_count: 0,
                    last_content: "",
                    last_time: "",
                };

            const newUnread =
                iAmReceiver && !isOpen ? (existing.unread_count || 0) + 1 : 0;

            const updated: DMEntry = {
                peer_id: peerId,
                first_name: existing.first_name,
                last_name: existing.last_name,
                profile_pic: existing.profile_pic,
                last_content: incoming.content,
                last_time: incoming.created_at,
                unread_count: newUnread,
            };

            return [updated, ...filtered].slice(0, MAX_DMS);
        });
    }, [dmFeed, meId, pathname]);

    //  clear badge when thread is open (also re-runs after list loads)
    useEffect(() => {
        const match = pathname.match(/^\/chat\/([^/]+)$/);
        if (!match || !meId) return;

        const openPeer = match[1];
        markChatRead(openPeer); 

        setList(prev => {
            const hasBadge = prev.some(
                e => e.peer_id === openPeer && e.unread_count !== 0
            );
            if (!hasBadge) return prev; //- only set new when there is a badge to clear

            return prev.map(e =>
                e.peer_id === openPeer ? { ...e, unread_count: 0 } : e
            );
        });
    }, [pathname, meId]);

    /* mark read on click from sidebar */
    const handlePeerClick = async (peerId: string) => {
        if (!meId) return;
        try {
            await fetch(`${API_URL}/api/chat/mark-read?peer_id=${peerId}`, {
                method: "POST",
                credentials: "include",
            });
            markChatRead(peerId);
            setList(prev =>
                prev.map(e =>
                    e.peer_id === peerId ? { ...e, unread_count: 0 } : e
                )
            );
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

    /* render */
    const body = (
        <>
            <h4 className={styles.section}>Direct Messages</h4>
            <div className={styles.list}>
                {loading ? (
                    <Loading />
                ) : list.length === 0 ? (
                    <p className={styles.empty}>— No DMs yet —</p>
                ) : (
                    list.map(e => {
                        const isOn = online.has(e.peer_id);
                        const href = `/chat/${e.peer_id}`;
                        const isSelected = pathname === href;
                        return (
                            <Link
                                key={e.peer_id}
                                href={href}
                                onClick={() => handlePeerClick(e.peer_id)}
                                className={`${styles.item} ${isSelected ? styles.selected : ""}`}
                            >
                                <div className={styles.avatarWrapper}>
                                    <Image
                                        src={
                                            e.profile_pic
                                                ? `${API_URL}/api/storage/avatars/${e.profile_pic}`
                                                : "/img/default-avatar.png"
                                        }
                                        alt={`${e.first_name} ${e.last_name}`}
                                        width={36}
                                        height={36}
                                        className={styles.avt}
                                    />
                                    {isOn && <span className={styles.onlineDot} />}
                                </div>
                                <div className={styles.text}>
                                    <span className={styles.name}>
                                        {e.first_name} {e.last_name}
                                    </span>
                                    <span className={styles.preview}>
                                        {e.last_content.length > 25
                                            ? e.last_content.slice(0, 25) + "…"
                                            : e.last_content}
                                    </span>
                                </div>
                                <div className={styles.meta}>
                                    <span className={styles.time}>
                                        <TimeAgo dateStr={e.last_time} chat />
                                    </span>
                                    {e.unread_count > 0 && (
                                        <span className={styles.badge}>
                                            {e.unread_count >= 100 ? "99+" : e.unread_count}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </>
    );

    return <aside className={styles.menu}>{body}</aside>;
}

function dedupePeerId(arr: DMEntry[]): DMEntry[] {
    const seen = new Set<string>();
    return arr.filter(e => {
        if (seen.has(e.peer_id)) return false;
        seen.add(e.peer_id);
        return true;
    });
}
