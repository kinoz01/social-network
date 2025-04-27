"use client";

import { useRouter } from "next/navigation";
import AuthModal from "@/components/AuthModals";

export default function LoginPage() {
    const router = useRouter();

    return (
        <AuthModal authSuccess={() => router.replace("/home")} />
    );
}
