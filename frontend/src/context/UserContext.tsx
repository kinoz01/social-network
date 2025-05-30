"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

// User structure
export interface User {
    id: string;
    email: string;
    username?: string;
    profile_pic: string;
    first_name: string;
    last_name: string;
    birthday: string;
    about_me?: string;
    account_type: string;
}

// Context value type
type UserContextValue = {
    user: User | null;
    refresh: () => Promise<void>;
    clear: () => void;
};

// Context creation
// This context will hold the user information and provide methods to refresh or clear it
const UserContext = createContext<UserContextValue | undefined>(undefined);

// Fetch user information from the API
// This function is called when the UserProvider mounts to fetch the user data
async function fetchUser(): Promise<User | null> {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/userInfo`,
            { credentials: "include", cache: "no-store" }
        );
        if (!res.ok) return null;
        const data = await res.json();

        return data ;
    } catch (error) {
        console.error("Failed to fetch user:", error);
        return null;
    }
}

// Provider component
export function UserProvider({ children }: {children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    const refresh = async () => {
        const fetchedUser = await fetchUser();
        setUser(fetchedUser);
    };

    const clear = () => {
        setUser(null);
    };

    useEffect(() => {
        refresh();
    }, []);

    return (
        <UserContext.Provider value={{ user, refresh, clear }}>
            {children}
        </UserContext.Provider>
    );
}

// Consumer hook
// This hook can be used in any component to access the user context
export function useUser(): UserContextValue {
    const ctx = useContext(UserContext);
    if (!ctx) {
        throw new Error("useUser must be used within <UserProvider>");
    }
    return ctx;
}
