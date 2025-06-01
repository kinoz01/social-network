"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { API_URL } from "./api_url";

export function useLogout() {
    const router = useRouter();
    const { clear } = useUser();
    
    const handleLogout = async () => {
        try {
            const res = await fetch(`${API_URL}/api/logout`, {
                method: "POST",
                credentials: "include",
            });

            if (!res.ok) {
                console.error("Logout failed");
                return;
            }
            clear();
            router.push("/login");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return { handleLogout };
}
