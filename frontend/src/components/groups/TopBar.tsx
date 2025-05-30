"use client";

import Image from "next/image";
import styles from "./style/groups.module.css";
import { useUser } from "@/context/UserContext";
import { API_URL } from "@/lib/api_url";

export default function TopBar() {

    const { user } = useUser();
    if (!user) return null;    

    const profilePic = `${API_URL}/api/storage/avatars/${user.profile_pic}`;

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
