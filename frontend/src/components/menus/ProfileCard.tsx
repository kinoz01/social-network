"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./menus.module.css";
import { API_URL } from "@/lib/api_url";
import { useUser } from "@/context/UserContext";

export default function ProfileCard() {
	const { user } = useUser();
	if (!user) return null;

	return (
		<aside className={styles.profileCard}>
			<Image
				src={
					user.profile_pic
						? `${API_URL}/api/storage/avatars/${user.profile_pic}`
						: "/img/default-profile.png"
				}
				alt="avatar"
				className={styles.userImage}
				width={86}
				height={86}
			/>

			<Link href={`/profile/${user.id}`} className={styles.username}>
				{user.first_name} {user.last_name}
			</Link>
			{user.username && <span className={styles.handle}>@{user.username}</span>}
		</aside>
	);
}
