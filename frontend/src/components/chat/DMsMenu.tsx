// src/components/DMsMenu/DMsMenu.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWS, ChatMsg } from "@/context/wsClient";
import { useUser } from "@/context/UserContext";
import Loading from "@/components/Loading";
import styles from "./style/dmsMenu.module.css";
import { API_URL } from "@/lib/api_url";
import { usePathname } from "next/navigation";


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
    const { meId, online, subscribeDM, onNewDM } = useWS();
    const { user } = useUser();

    const [list, setList] = useState<DMEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const pathname = usePathname();

    // 1) Fetch initial DM‐list (up to MAX_DMS). After loading, subscribe each peer's DM channel.
    const fetchDMList = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch(
                `${API_URL}/api/chat/dm-list?limit=${MAX_DMS}`,
                { credentials: "include", cache: "no-store" }
            );
            if (res.status === 204) {
                setList([]);
                setLoading(false);
                return;
            }
            if (!res.ok) throw new Error("Failed to load DM list");
            const raw: DMEntry[] = await res.json();
            const data = dedupePeerId(raw);
            setList(data);
            data.forEach((peer) => subscribeDM(peer.peer_id));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchDMList();
    }, [fetchDMList]);

    // 2) Whenever a new DM arrives on WS (for any peer currently in our list),
    //    update that peer’s entry: increment unread_count (if I'm the RECEIVER),
    //    update last_content/last_time, and move this peer to the top.
    useEffect(() => {
        if (!meId) return;
        const unsubscribers: (() => void)[] = [];

        list.forEach((peer) => {
            const peerId = peer.peer_id;
            const unsub = onNewDM(peerId, (incoming: ChatMsg) => {
                // incoming.type === "dmMessage"
                const iAmReceiver = incoming.receiver_id === meId;
                // If the user is already viewing /chat/<peerId>, treat as “read” immediately:
                const isOpen = pathname === `/chat/${peerId}`;

                setList((prev) => {
                    const filtered = prev.filter((e) => e.peer_id !== peerId);

                    // compute new unread count, etc. (as before)…
                    const iAmReceiver = incoming.receiver_id === meId;
                    const isOpen = pathname === `/chat/${peerId}`;
                    const existing = prev.find((e) => e.peer_id === peerId) || {
                        first_name: incoming.first_name,
                        last_name: incoming.last_name,
                        profile_pic: incoming.profile_pic,
                        unread_count: 0,
                        last_content: "",
                        last_time: "",
                    };

                    const newUnread = iAmReceiver && !isOpen
                        ? (existing.unread_count || 0) + 1
                        : 0;

                    const updatedEntry: DMEntry = {
                        peer_id: peerId,
                        first_name: existing.first_name,
                        last_name: existing.last_name,
                        profile_pic: existing.profile_pic,
                        last_content: incoming.content,
                        last_time: incoming.created_at,
                        unread_count: newUnread,
                    };

                    // build a new array with updatedEntry at the front, then the rest
                    const newList = [updatedEntry, ...filtered];

                    return newList.slice(0, MAX_DMS); // keep at most 300
                });
            });

            unsubscribers.push(unsub);
        });

        return () => {
            unsubscribers.forEach((u) => u());
        };
    }, [list, meId, onNewDM, pathname]);

    // 3) When I click a peer’s Link, mark all messages from that peer → me as read.
    //    Then locally zero unread_count.
    const handlePeerClick = async (peerId: string) => {
        if (!meId) return;
        try {
            await fetch(`${API_URL}/api/chat/mark-read?peer_id=${peerId}`, {
                method: "POST",
                credentials: "include",
            });
            // Immediately clear unread_count in local state
            setList((prev) =>
                prev.map((e) =>
                    e.peer_id === peerId ? { ...e, unread_count: 0 } : e
                )
            );
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

    const formatTime = (iso: string) =>
        new Date(iso.endsWith("Z") ? iso.slice(0, -1) : iso).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

    // ─── render body ───
    const body = (
        <>
            <h4 className={styles.section}>Direct Messages</h4>
            <div className={styles.list}>
                {loading ? (
                    <Loading />
                ) : list.length === 0 ? (
                    <p className={styles.empty}>— No DMs yet —</p>
                ) : (
                    list.map((e) => {
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
                                        {formatTime(e.last_time)}
                                    </span>
                                    {e.unread_count > 0 && (
                                        <span className={styles.badge}>{e.unread_count >= 100 ? "99+" : e.unread_count}</span>
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
    return arr.filter((e) => {
        if (seen.has(e.peer_id)) return false;
        seen.add(e.peer_id);
        return true;
    });
}