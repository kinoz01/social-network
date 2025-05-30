// app/context/GroupFeedContext.tsx
"use client";

import { createContext, useContext, useState } from "react";

type GroupFeedContextType = {
    feedVersion: number;
    refreshFeed: () => void;
};

const GroupFeedContext = createContext<GroupFeedContextType | null>(null);

export function GroupFeedProvider({ children }: { children: React.ReactNode }) {
    const [feedVersion, setFeedVersion] = useState(0);

    const refreshFeed = () => setFeedVersion(v => v + 1);

    return (
        <GroupFeedContext.Provider value={{ feedVersion, refreshFeed }}>
            {children}
        </GroupFeedContext.Provider>
    );
}

export function useGroupFeed() {
    const context = useContext(GroupFeedContext);
    if (!context) throw new Error("useGroupFeed must be used within GroupFeedProvider");
    return context;
}
