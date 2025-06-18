"use client";

import { createContext, useContext, useState } from "react";

type GroupSyncContextType = {
    version: number;
    refresh: () => void;
};

const GroupSyncContext = createContext<GroupSyncContextType | null>(null);

export function GroupSyncProvider({ children }: { children: React.ReactNode }) {
    // the change initiator use refresh and the re-render use version
    const [version, setVersion] = useState(0);
    const refresh = () => setVersion(v => v + 1);

    return (
        <GroupSyncContext.Provider value={{ version, refresh }}>
            {children}
        </GroupSyncContext.Provider>
    );
}

export function useGroupSync() {
    const context = useContext(GroupSyncContext);
    if (!context) throw new Error("useGroupSync must be used within GroupSyncProvider");
    return context;
}
