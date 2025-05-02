"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "../style/groups.module.css";
import { getUser } from "@/lib/user";

export default function TopBar() {
    const [profilePic, setProfilePic] = useState<string | null>(null);

    useEffect(() => {
        async function fetchUser() {
            const user = await getUser();
            if (user && user.profile_pic) {
                setProfilePic(`${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${user.profile_pic}`);
            }
        }
        fetchUser();
    }, []);

    if (!profilePic) return null;

    return (
        <div className={styles.topBar}>
            <div className={styles.spacer} />
            <Image
                src={profilePic}
                alt="Profile"
                width={70}
                height={70}
                className={styles.profilePic}
                unoptimized
            />
        </div>
    );
}
