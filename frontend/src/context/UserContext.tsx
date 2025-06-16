"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";
import { API_URL } from "@/lib/api_url";
import { User } from "@/lib/types"

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


// Provider component
export function UserProvider({ children }: { children: React.ReactNode }) {
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
