"use client";

import Image from "next/image";
import styles from "./style/groups.module.css";
import { useUser } from "@/context/UserContext";

export default function TopBar() {

    const { user } = useUser();
    if (!user) return null;    

    const profilePic = `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${user.profile_pic}`;

    return (
        <div className={styles.topBar}>
            <div className={styles.spacer} />
            <Image
                src={profilePic}
                alt="Profile"
                width={80}
                height={80}
                className={styles.profilePic}
                unoptimized
            />
        </div>
    );
}
