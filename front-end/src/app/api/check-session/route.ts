import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
    try {
        const res = await fetch(`${API_URL}/api/check-session`, { credentials: "include" });

        if (!res.ok) {
            return NextResponse.json({ loggedIn: false });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ loggedIn: false, error: "Failed to fetch session" });
    }
}
