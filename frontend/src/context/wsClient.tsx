"use client";

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    ReactNode,
} from "react";
import { useUser } from "@/context/UserContext";    // ← import your UserContext
import { API_URL_WS } from "@/lib/api_url";

/* ─────────── Types ─────────── */
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
    receiver_id?: string;    // only for DMs
    content: string;
    created_at: string;      // ISO string
    first_name: string;
    last_name: string;
    profile_pic: string | null;
    type: "dmMessage" | "groupChatMessage";
    group_id?: string;       // only if type==="groupChatMessage"
}

interface WSContextShape {
    socket: WebSocket | null;
    meId: string | null;                      // our own user‐ID, taken from UserContext
    online: Set<string>;                      // set of userIDs currently online
    groupMembers: Map<string, Member[]>;      // groupId → snapshot of members
    getGroupMembers: (groupId: string) => void;
    send: (msg: object) => void;
    subscribeDM: (peerId: string) => void;
    sendDM: (peerId: string, content: string) => void;
    onNewDM: (peerId: string, callback: (msg: ChatMsg) => void) => () => void;
}

const WSContext = createContext<WSContextShape | null>(null);
export const useWS = () => useContext(WSContext)!; // must be inside <WSProvider>

/* ─────────── Provider ─────────── */
export function WSProvider({ children }: { children: ReactNode }) {
    const socketRef = useRef<WebSocket | null>(null);

    // 1) Grab the logged‐in user from UserContext
    const { user } = useUser();
    const meId = user?.id || null;

    // 2) Track which userIDs are online
    const [online, setOnline] = useState<Set<string>>(new Set());

    // 3) Track group member snapshots
    const [groupMembers, setGroupMembers] = useState<Map<string, Member[]>>(new Map());

    // 4) DM listeners keyed by peerId
    const dmListenersRef = useRef<Map<string, Set<(m: ChatMsg) => void>>>(new Map());

    /* ─────────── Open WS on mount ─────────── */
    useEffect(() => {
        const ws = new WebSocket(`${API_URL_WS}/api/ws`);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log("[WS] connection opened");
        };
        ws.onclose = () => {
            console.log("[WS] connection closed");
        };

        ws.onmessage = (ev) => {
            let msg: any;
            try {
                msg = JSON.parse(ev.data);
            } catch {
                return;
            }

            switch (msg.type) {
                //
                // ─────────── ONLINE STATUS ───────────
                //
                // payload: { type: "onlineStatus", users: string[] }
                //
                case "onlineStatus": {
                    setOnline(new Set(msg.users));
                    break;
                }

                //
                // ─────────── GROUP MEMBERS SNAPSHOT ───────────
                //
                // payload: { type: "groupMembers", groupId: string, members: Member[] }
                //
                case "groupMembers": {
                    setGroupMembers((prev) => {
                        const copy = new Map(prev);
                        copy.set(msg.groupId, msg.members);
                        return copy;
                    });
                    break;
                }

                //
                // ─────────── DIRECT MESSAGE ───────────
                //
                // payload: { type: "dmMessage", message: ChatMsg }
                //
                case "dmMessage": {
                    if (!meId) break;

                    const chat: ChatMsg = msg.message;
                    let peerId: string;

                    if (chat.sender_id === meId) {
                        // I am the sender → peer is the receiver
                        peerId = chat.receiver_id!;
                    } else {
                        // someone else sent to me
                        peerId = chat.sender_id;
                    }

                    const listeners = dmListenersRef.current.get(peerId);
                    if (listeners) {
                        listeners.forEach((cb) => cb(chat));
                    }
                    break;
                }

                default:
                    // ignore unhandled types
                    break;
            }
        };

        return () => {
            ws.close();
        };
    }, [meId]);

    /* ─────────── HELPERS ─────────── */

    // generic send()
    const send = (obj: object) => {
        const ws = socketRef.current;
        if (!ws) return;
        const payload = JSON.stringify(obj);
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
        } else {
            const onOpen = () => {
                ws.send(payload);
                ws.removeEventListener("open", onOpen);
            };
            ws.addEventListener("open", onOpen);
        }
    };

    // request fresh group snapshot
    const getGroupMembers = (groupId: string) => {
        send({ type: "getGroupMembers", groupId });
    };

    // subscribe to DM with peerId
    const subscribeDM = (peerId: string) => {
        send({ type: "dmSubscribe", peerId });
    };

    // send a DM
    const sendDM = (peerId: string, content: string) => {
        send({ type: "dmMessage", peerId, content });
    };

    // register a callback for new DMs from peerId
    const onNewDM = (peerId: string, callback: (msg: ChatMsg) => void): (() => void) => {
        const map = dmListenersRef.current;
        if (!map.has(peerId)) {
            map.set(peerId, new Set());
        }
        map.get(peerId)!.add(callback);
        return () => {
            const s = map.get(peerId);
            if (s) {
                s.delete(callback);
                if (s.size === 0) {
                    map.delete(peerId);
                }
            }
        };
    };

    /* ─────────── PROVIDER VALUE ─────────── */
    return (
        <WSContext.Provider
            value={{
                socket: socketRef.current,
                meId,
                online,
                groupMembers,
                getGroupMembers,
                send,
                subscribeDM,
                sendDM,
                onNewDM,
            }}
        >
            {children}
        </WSContext.Provider>
    );
}
