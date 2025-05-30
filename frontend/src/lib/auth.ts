import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Check if the user is logged in by checking the session cookie
export async function requireSession() {
    // Check session cookie (no backend call)
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) redirect("/login");

    // check session validity (backend call)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/check-session`, {
        headers: { cookie: cookieStore.toString() }, // The server needs to pass cookies manually
        cache: "no-store",
    });
    
    if (!res.ok) {
        console.error("Session check failed, status:", res.status);
        redirect("/login");
    }

    const { loggedIn } = await res.json();
    if (!loggedIn) {
        redirect("/login");
    }

    return true;  // session is good
}

// Redirect to home if the user is already logged in
export async function redirectToHome() {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) return; // No token, stay on login page

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/check-session`, {
        headers: { cookie: cookieStore.toString() },
        cache: "no-store",
    });

    if (!res.ok) return;

    const { loggedIn } = await res.json();

    if (loggedIn) {
        redirect("/home");
    }
}

// check if user is member of the group
export async function checkMembership(groupId: string) {
    const cookieStore = await cookies();
    
    // back-end call
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/groups/is-member?id=${groupId}`,
        {
            headers: { cookie: cookieStore.toString() }, // forward auth cookie
            cache: "no-store",
        }
    );

    if (!res.ok) {
        redirect("/groups");
    }

    return true;
}