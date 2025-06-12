"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    ReactNode,
    useCallback,
} from "react";
import { useUser } from "@/context/UserContext";
import { API_URL_WS, API_URL } from "@/lib/api_url";
import { NotificationModel } from "@/lib/types";

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
    wsOpen: boolean;                          // ← NEW
    meId: string | null;

    online: Set<string>;
    groupMembers: Map<string, Member[]>;
    getGroupMembers: (g: string) => void;

    send: (o: object) => void;
    subscribeDM: (peer: string) => void;
    sendDM: (peer: string, text: string) => void;
    onNewDM: (peer: string, cb: (m: ChatMsg) => void) => () => void;

    totalUnread: number;
    hasUnread: boolean;
    markChatRead: (peer: string) => void;

    /* notifications */
    unreadNotificationsCount: number;
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

    const socketRef = useRef<WebSocket | null>(null);

    /* state */
    const [wsOpen, setOpen] = useState(false);             // ← NEW
    const [online, setOnline] = useState<Set<string>>(new Set());
    const [groupMembers, setGroupMembers] = useState<Map<string, Member[]>>(new Map());
    const [unreadCount, setUnreadCount] = useState<Map<string, number>>(new Map());

    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const [notifications, setNotifications] = useState<NotificationModel[]>([]);

    /* listeners per peer */
    const dmListeners = useRef<Map<string, Set<(m: ChatMsg) => void>>>(new Map());
    const seenDMids = useRef<Set<string>>(new Set()); // dedupe double frames
    const seenNotifIds = useRef<Set<string>>(new Set());

    /* seed unread-count once */
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

    /* open socket */
    useEffect(() => {
        if (!meId) return;
        const ws = new WebSocket(`${API_URL_WS}/api/ws`);
        socketRef.current = ws;

        /* mark open/close */
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

                    const peerId =
                        chat.sender_id === meId ? chat.receiver_id! : chat.sender_id;
                    dmListeners.current.get(peerId)?.forEach((cb) => cb(chat));

                    if (chat.receiver_id === meId) {
                        setUnreadCount((prev) =>
                            new Map(prev).set(peerId, (prev.get(peerId) ?? 0) + 1)
                        );
                    }
                    break;
                }

                case "unreadNotificationsCount":
                    setUnreadNotificationsCount(msg.count);
                    break;

                case "getNotifications": // paged response
                    const fresh = msg.notifications.filter(
                        (n: NotificationModel) => !seenNotifIds.current.has(n.id)
                    );
                    fresh.forEach((n: NotificationModel) => seenNotifIds.current.add(n.id));
                    setNotifications(prev => [...prev, ...fresh]);
                    break;

                case "notification": // single live push
                    setNotifications((prev) => [msg.notification, ...prev]);
                    setUnreadNotificationsCount((c) => c + 1);
                    break;
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
    const sendDM = (p: string, text: string) => send({ type: "dmMessage", peerId: p, content: text });

    const onNewDM = (peer: string, cb: (m: ChatMsg) => void) => {
        if (!dmListeners.current.has(peer))
            dmListeners.current.set(peer, new Set());
        dmListeners.current.get(peer)!.add(cb);
        return () => dmListeners.current.get(peer)?.delete(cb);
    };

    const markChatRead = useCallback((peer: string) => {
        setUnreadCount((prev) => {
            const m = new Map(prev);
            if (m.has(peer)) m.set(peer, 0);
            return m;
        });
    }, []);

    /* computed */
    const totalUnread = [...unreadCount.values()].reduce((a, b) => a + b, 0);
    const hasUnread = totalUnread > 0;

    const getNotifications = (page: number, limit: number) => {
        send({ type: "getNotifications", page, limit });
    };

    const deleteNotification = (key: string) =>
        setNotifications(prev => key === "ALL" ? [] : prev.filter(n => n.id !== key && n.invitationId !== key &&  n.requestId !== key && n.eventId !== key));

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
                subscribeDM,
                sendDM,
                onNewDM,
                totalUnread,
                hasUnread,
                markChatRead,
                unreadNotificationsCount,
                notifications,
                getNotifications,
                deleteNotification
            }}
        >
            {children}
        </WSContext.Provider>
    );
}
