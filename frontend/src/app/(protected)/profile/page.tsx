"use client";

import { redirect } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Loading from "@/components/Loading";

export default function ProfileRedirectPage() {
    const { user } = useUser();
    if (!user) return null;

    redirect(`/profile/${user.id}`);
}