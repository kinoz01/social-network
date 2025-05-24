"use client";

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

// Fetch user data function
export async function getUser(): Promise<User | null> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/userInfo`, {
            credentials: "include",
            cache: "no-store",
        });

        if (!res.ok) {
            console.error("Failed to fetch user:", res.status);
            return null;
        }

        const data: User = await res.json();
        return data;
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
}

// async function getUser(): Promise<User | null> {
//   try {
//     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/userInfo`, {
//       credentials: "include",
//       cache: "no-store",
//     })

//     if (!res.ok) {
//       console.error("failed to fetch user", res.status)
//       return null
//     }

//     const data: User = await res.json()
//     return data
//   } catch (error) {
//     console.error("Error fetching user", error)
//     return null
//   }
// }