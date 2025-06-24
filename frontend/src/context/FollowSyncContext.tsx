"use client";

import { createContext, useContext, useState } from "react";

type FollowSyncContextType = {
    version: number;
    refresh: () => void;
};

const FollowContext = createContext<FollowSyncContextType | null>(null);
export const useFollowSync = () => useContext(FollowContext)!;

export function FollowSyncProvider({ children }: { children: React.ReactNode }) {
    // the change initiator use refresh and the re-render use version
    const [version, setVersion] = useState(0);
    const refresh = () => setVersion(v => v + 1);

    return (
        <FollowContext.Provider value={{ version, refresh }}>
            {children}
        </FollowContext.Provider>
    );
}
