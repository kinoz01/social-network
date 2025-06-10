"use client";

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { API_URL_WS, API_URL } from "@/lib/api_url";

/* ───────── Types ───────── */
export interface Member {
    id: string;
    first_name: string;
    last_name: string;
    profile_pic: string | null;
    isOnline: boolean;
}

export interface ChatMsg {
    id: string;
    sender_id: string;
    receiver_id?: string;
    content: string;
    created_at: string;
    first_name: string;
    last_name: string;
    profile_pic: string | null;
    type: "dmMessage" | "groupChatMessage";
    group_id?: string;
}

interface WSContextShape {
    socket: WebSocket | null;
    meId: string | null;

    online: Set<string>;
    groupMembers: Map<string, Member[]>;
    getGroupMembers: (g: string) => void;

    send: (o: object) => void;
    subscribeDM: (peer: string) => void;
    sendDM: (peer: string, text: string) => void;
    onNewDM: (peer: string, cb: (m: ChatMsg) => void) => () => void;

    unreadCount: Map<string, number>;
    totalUnread: number;
    hasUnread: boolean;
    markChatRead: (peer: string) => void;
}

const WSContext = createContext<WSContextShape | null>(null);
export const useWS = () => useContext(WSContext)!;

/* ───────── Provider ───────── */
export function WSProvider({ children }: { children: ReactNode }) {
    const { user } = useUser();
    const meId = user?.id ?? null;

    const socketRef = useRef<WebSocket | null>(null);

    /* state */
    const [online, setOnline] = useState<Set<string>>(new Set());
    const [groupMembers, setGroupMembers] = useState<Map<string, Member[]>>(new Map());
    const [unreadCount, setUnreadCount] = useState<Map<string, number>>(new Map());

    /* listeners per peer */
    const dmListeners = useRef<Map<string, Set<(m: ChatMsg) => void>>>(new Map());
    const seenIds = useRef<Set<string>>(new Set()); // dedupe double frames

    /* seed unread-count once */
    useEffect(() => {
        if (!meId) return;
        fetch(`${API_URL}/api/chat/unread-summary`, { credentials: "include" })
            .then(r => (r.ok ? r.json() : []))
            .then((rows: { peer_id: string; count: number }[]) => {
                const m = new Map<string, number>();
                rows.forEach(r => m.set(r.peer_id, r.count));
                setUnreadCount(m);
            })
            .catch(() => setUnreadCount(new Map()));
    }, [meId]);

    /* open socket */
    useEffect(() => {
        if (!meId) return;
        const ws = new WebSocket(`${API_URL_WS}/api/ws`);
        socketRef.current = ws;

        ws.onmessage = (ev) => {
            let msg: any;
            try { msg = JSON.parse(ev.data); } catch { return; }

            switch (msg.type) {
                case "onlineStatus":
                    setOnline(new Set(msg.users));
                    break;

                case "groupMembers":
                    setGroupMembers(prev => new Map(prev).set(msg.groupId, msg.members));
                    break;

                case "dmMessage": {
                    const chat: ChatMsg = msg.message;
                    if (seenIds.current.has(chat.id)) break;
                    seenIds.current.add(chat.id);

                    const peerId = chat.sender_id === meId ? chat.receiver_id! : chat.sender_id;
                    dmListeners.current.get(peerId)?.forEach(cb => cb(chat));

                    if (chat.receiver_id === meId) {
                        setUnreadCount(prev => new Map(prev).set(peerId, (prev.get(peerId) ?? 0) + 1));
                    }
                    break;
                }
            }
        };

        return () => ws.close();
    }, [meId]);

    /* helper: always use current socket */
    const send = (obj: object) => {
        const ws = socketRef.current;
        if (!ws) return;
        const txt = JSON.stringify(obj);

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(txt);
        } else {
            ws.addEventListener("open", () => ws.send(txt), { once: true });
        }
    };

    /* simple wrappers */
    const getGroupMembers = (g: string) => send({ type: "getGroupMembers", groupId: g });
    const subscribeDM = (p: string) => send({ type: "dmSubscribe", peerId: p });
    const sendDM = (p: string, text: string) =>
        send({ type: "dmMessage", peerId: p, content: text });

    const onNewDM = (peer: string, cb: (m: ChatMsg) => void) => {
        if (!dmListeners.current.has(peer)) dmListeners.current.set(peer, new Set());
        dmListeners.current.get(peer)!.add(cb);
        return () => dmListeners.current.get(peer)?.delete(cb);
    };

    const markChatRead = useCallback((peer: string) => {
        setUnreadCount(prev => {
            const m = new Map(prev);
            if (m.has(peer)) m.set(peer, 0);
            return m;
        });
    }, []);

    /* computed */
    const totalUnread = [...unreadCount.values()].reduce((a, b) => a + b, 0);
    const hasUnread = totalUnread > 0;

    return (
        <WSContext.Provider value={{
            socket: socketRef.current,
            meId,
            online,
            groupMembers,
            getGroupMembers,
            send,
            subscribeDM,
            sendDM,
            onNewDM,
            unreadCount,
            totalUnread,
            hasUnread,
            markChatRead,
        }}>
            {children}
        </WSContext.Provider>
    );
}
