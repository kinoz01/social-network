"use client";

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    ReactNode,
} from "react";

/* ───────── types ───────── */
export interface Member {
    id: string;
    first_name: string;
    last_name: string;
    profile_pic: string | null;
    isOnline: boolean;
}

interface WSContextShape {
    socket: WebSocket | null;                  // current socket
    online: Set<string>;                       // userIDs online anywhere
    groupMembers: Map<string, Member[]>;       // groupID → member list
    getGroupMembers: (id: string) => void;      // ask server for member list
    send: (msg: object) => void;               // helper
}

const WSContext = createContext<WSContextShape | null>(null);
export const useWS = () => useContext(WSContext)!; // consumption hook

/* ───────── provider ───────── */
export function WSProvider({ children }: { children: ReactNode }) {
    const socketRef = useRef<WebSocket | null>(null); // store ws connexion

    const [online, setOnline] = useState<Set<string>>(new Set()); // strore online users
    const [groupMembers, setGroupMembers] = useState<Map<string, Member[]>>(new Map());

    /* 1. open socket once */
    useEffect(() => {
        const ws = new WebSocket(`ws://localhost:8080/api/ws`);
        socketRef.current = ws;

        ws.onopen = () => console.log("[WS] open");

        ws.onmessage = (ev) => {
            const msg = JSON.parse(ev.data);
            switch (msg.type) {
                case "onlineStatus": {
                    setOnline(new Set(msg.users)); // users: string[]
                    break;
                }
                case "groupMembers": {
                    setGroupMembers((prev) => {
                        const m = new Map(prev);
                        m.set(msg.groupId, msg.members); // members: Member[]
                        return m;
                    });
                    break;
                }
            }
        };

        ws.onclose = () => console.log("[WS] closed");

        return () => ws.close();
    }, []);

    /* 2. helpers */
    const send = (obj: object) => {
        const ws = socketRef.current;
        if (!ws) return;

        const payload = JSON.stringify(obj);

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
        } else {
            /* queue once, send when open (forsafety) */
            const onOpen = () => {
                ws.send(payload);
                ws.removeEventListener("open", onOpen);
            };
            ws.addEventListener("open", onOpen);
        }
    };

    const getGroupMembers = (groupId: string) =>
        send({ type: "getGroupMembers", groupId });

    /* 3. provide values */
    return (
        <WSContext.Provider value={{ socket: socketRef.current, online, groupMembers, getGroupMembers, send }}>
            {children}
        </WSContext.Provider>
    );
}
