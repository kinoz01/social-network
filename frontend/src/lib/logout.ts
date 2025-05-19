"use client";

import { useRouter } from "next/navigation";

export function useLogout() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/logout`, {
                method: "POST",
                credentials: "include",
            });

            if (!res.ok) {
                console.error("Logout failed");
                return;
            }

            router.push("/login");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return { handleLogout };
}
