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
    online: Set<string>;                       // userIDs online anywhere
    groupMembers: Map<string, Member[]>;       // groupID → member list
    subscribeGroup: (id: string) => void;      // ask server for member list
    send: (msg: object) => void;               // raw helper
}

const WSContext = createContext<WSContextShape | null>(null);
export const useWS = () => useContext(WSContext)!; // consumption hook

/* ───────── provider ───────── */
export function WSProvider({ children }: { children: ReactNode }) {
    const socketRef = useRef<WebSocket | null>(null);

    const [online, setOnline] = useState<Set<string>>(new Set());
    const [groupMembers, setGroupMembers] = useState<
        Map<string, Member[]>
    >(new Map());

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
        if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
    };

    const subscribeGroup = (groupId: string) =>
        send({ type: "subscribeGroup", groupId });

    /* 3. provide values */
    return (
        <WSContext.Provider value={{ online, groupMembers, subscribeGroup, send }}>
            {children}
        </WSContext.Provider>
    );
}
