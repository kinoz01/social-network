"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    ReactNode,
} from "react";
import { useUser } from "@/context/UserContext";
import { API_URL_WS, API_URL } from "@/lib/api_url";
import { NotificationModel } from "@/lib/types";
import { useFollowSync } from "./FollowSyncContext";

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
    wsOpen: boolean;
    meId: string | null;

    online: Set<string>;
    groupMembers: Map<string, Member[]>;
    getGroupMembers: (g: string) => void;

    send: (o: object) => void;
    sendDM: (peer: string, text: string) => void;

    dmFeed: ChatMsg[];           // every incoming DM, unfiltered

    totalUnread: number;
    hasUnread: boolean;
    markChatRead: (peer: string) => void;

    /* notifications */
    notifsCount: number;
    notifications: NotificationModel[];
    getNotifications: (page: number, limit: number) => void;
    deleteNotification: (id: string) => void;
}

const WSContext = createContext<WSContextShape | null>(null);
export const useWS = () => useContext(WSContext)!;

/* ───────── Provider ───────── */
export function WSProvider({ children }: { children: ReactNode }) {
    const { user } = useUser();
    const meId = user?.id ?? null;
    const { version } = useFollowSync();

    const socketRef = useRef<WebSocket | null>(null);

    /* state */
    const [wsOpen, setOpen] = useState(false);
    const [online, setOnline] = useState<Set<string>>(new Set());
    const [groupMembers, setGroupMembers] = useState<
        Map<string, Member[]>
    >(new Map());

    const [dmFeed, setDmFeed] = useState<ChatMsg[]>([]);
    const [unreadCount, setUnreadCount] = useState<Map<string, number>>(
        new Map()
    );

    const [notifsCount, setNotifsCount] = useState(0);
    const [notifications, setNotifications] = useState<NotificationModel[]>([]);

    const seenDMids = useRef<Set<string>>(new Set());
    const seenNotifIds = useRef<Set<string>>(new Set());

    /* ─── preload unread summary ─── */
    useEffect(() => {
        if (!meId) return;
        fetch(`${API_URL}/api/chat/unread-summary`, { credentials: "include" })
            .then((r) => (r.ok ? r.json() : []))
            .then((rows: { peer_id: string; count: number }[]) => {
                const m = new Map<string, number>();
                rows.forEach((r) => m.set(r.peer_id, r.count));
                setUnreadCount(m);
            })
            .catch(() => setUnreadCount(new Map()));
    }, [meId]);

    /* ─── preload notifications count ─── */
    useEffect(() => {
        if (!meId) return;
        fetch(`${API_URL}/api/notifications/totalcount`, {
            credentials: "include",
        })
            .then((r) => (r.ok ? r.json() : { count: 0 }))
            .then(({ count }) => setNotifsCount(count))
            .catch(() => setNotifsCount(0));
    }, [meId, version]);

    /* ─── open socket ─── */
    useEffect(() => {
        if (!meId) return;
        const ws = new WebSocket(`${API_URL_WS}/api/ws`);
        socketRef.current = ws;

        ws.addEventListener("open", () => setOpen(true));
        ws.addEventListener("close", () => setOpen(false));

        ws.onmessage = (ev) => {
            let msg: any;
            try {
                msg = JSON.parse(ev.data);
            } catch {
                return;
            }

            switch (msg.type) {
                case "onlineStatus":
                    setOnline(new Set(msg.users));
                    break;

                case "groupMembers":
                    setGroupMembers((prev) =>
                        new Map(prev).set(msg.groupId, msg.members)
                    );
                    break;

                case "dmMessage": {
                    const chat: ChatMsg = msg.message;
                    if (seenDMids.current.has(chat.id)) break;
                    seenDMids.current.add(chat.id);

                    setDmFeed((f) => [...f, chat]); // push to global feed

                    /* bump unread summary */
                    if (chat.receiver_id === meId) {
                        const peerId = chat.sender_id;
                        setUnreadCount((prev) =>
                            new Map(prev).set(peerId, (prev.get(peerId) ?? 0) + 1)
                        );
                    }
                    break;
                }

                case "getNotifications": {
                    const fresh = msg.notifications.filter(
                        (n: NotificationModel) => !seenNotifIds.current.has(n.id)
                    );
                    fresh.forEach((n: NotificationModel) =>
                        seenNotifIds.current.add(n.id)
                    );
                    setNotifications((prev) => [...prev, ...fresh]);
                    break;
                }

                case "notification":
                    setNotifications((prev) => [msg.notification, ...prev]);
                    setNotifsCount((c) => c + 1);
                    break;
            }
        };

        return () => ws.close();
    }, [meId]);

    /* ─── helpers ─── */
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

    const getGroupMembers = (g: string) =>
        send({ type: "getGroupMembers", groupId: g });

    const sendDM = (peer: string, text: string) =>
        send({ type: "dmMessage", peerId: peer, content: text });

    const markChatRead = (peer: string) => {
        setUnreadCount((prev) => {
            const m = new Map(prev);
            if (m.has(peer)) m.set(peer, 0);
            return m;
        });
    };

    const totalUnread = [...unreadCount.values()].reduce((a, b) => a + b, 0);
    const hasUnread = totalUnread > 0;

    const getNotifications = (page: number, limit: number) =>
        send({ type: "getNotifications", page, limit });

    const deleteNotification = (key: string) => {
        setNotifications((prev) =>
            key === "ALL"
                ? []
                : prev.filter(
                    (n) =>
                        n.id !== key &&
                        n.invitationId !== key &&
                        n.requestId !== key &&
                        n.eventId !== key &&
                        n.followId !== key
                )
        );
        key === "ALL"
            ? setNotifsCount(0)
            : setNotifsCount((c) => (c === 0 ? c : c - 1));
    };

    return (
        <WSContext.Provider
            value={{
                socket: socketRef.current,
                wsOpen,
                meId,
                online,
                groupMembers,
                getGroupMembers,
                send,
                sendDM,
                dmFeed,
                totalUnread,
                hasUnread,
                markChatRead,
                notifsCount,
                notifications,
                getNotifications,
                deleteNotification,
            }}
        >
            {children}
        </WSContext.Provider>
    );
}
