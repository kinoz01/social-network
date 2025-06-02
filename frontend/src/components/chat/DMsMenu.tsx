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

/*
  Each entry returned by GET /api/chat/dm-list
  {
    peer_id: string,
    first_name: string,
    last_name: string,
    profile_pic: string | null,
    last_content: string,
    last_time: string,       // ISO timestamp
    unread_count: number
  }
*/
interface DMEntry {
    peer_id: string;
    first_name: string;
    last_name: string;
    profile_pic: string | null;
    last_content: string;
    last_time: string;      // ISO
    unread_count: number;
}

interface DMsMenuProps {
    modal?: boolean;
    onClose?: () => void;
}

const MAX_DMS = 300;

export default function DMsMenu({
    modal = false,
    onClose,
}: DMsMenuProps) {
    const { meId, online, subscribeDM, onNewDM } = useWS();
    const { user } = useUser();

    const [list, setList] = useState<DMEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

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
            const data = (await res.json()) as DMEntry[];
            setList(data);
            // Subscribe to WebSocket channel for each peer
            data.forEach((peer) => {
                subscribeDM(peer.peer_id);
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user, subscribeDM]);

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
                // “incoming.sender_id === meId” means I sent it; otherwise I received it.
                const iAmReceiver = incoming.receiver_id === meId;

                setList((prev) => {
                    // Find the entry we are updating
                    const idx = prev.findIndex((e) => e.peer_id === peerId);
                    if (idx === -1) {
                        // (If somehow this peer wasn't in the list yet, we could re‐fetch, but for now ignore.)
                        return prev;
                    }

                    // Compute new unread_count
                    const existing = prev[idx];
                    const newUnread = iAmReceiver
                        ? existing.unread_count + 1
                        : existing.unread_count;

                    // Build an updated entry with fresh last_content/last_time
                    const updatedEntry: DMEntry = {
                        peer_id: peerId,
                        first_name: existing.first_name,
                        last_name: existing.last_name,
                        profile_pic: existing.profile_pic,
                        last_content: incoming.content,
                        last_time: incoming.created_at,
                        unread_count: newUnread,
                    };

                    // Build a new list: put updatedEntry at index 0, then all others in original order
                    const newList: DMEntry[] = [updatedEntry];
                    prev.forEach((e, i) => {
                        if (i !== idx) {
                            newList.push(e);
                        }
                    });
                    // If the list exceeded MAX_DMS, slice to MAX_DMS
                    return newList.slice(0, MAX_DMS);
                });
            });

            unsubscribers.push(unsub);
        });

        return () => {
            unsubscribers.forEach((u) => u());
        };
    }, [list, meId, onNewDM]);

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
                        return (
                            <Link
                                key={e.peer_id}
                                href={`/chat/${e.peer_id}`}
                                onClick={() => handlePeerClick(e.peer_id)}
                                className={styles.item}
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
                                        {new Date(e.last_time).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                    {e.unread_count > 0 && (
                                        <span className={styles.badge}>{e.unread_count}</span>
                                    )}
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </>
    );

    // ─── modal wrapper ───
    if (!modal) return <aside className={styles.menu}>{body}</aside>;

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div
                className={`${styles.menu} ${styles.modal}`}
                onClick={(e) => e.stopPropagation()}
            >
                <button className={styles.close} onClick={onClose}>
                    ×
                </button>
                {body}
            </div>
        </div>
    );
}
