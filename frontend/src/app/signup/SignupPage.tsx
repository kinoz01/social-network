"use client";

import { useRouter } from "next/navigation";
import AuthModal from "@/components/authentication/AuthModals";

export default function SignupPage() {
    const router = useRouter();

    return (
        <AuthModal authSuccess={() => router.replace("/home")} />
    );
}