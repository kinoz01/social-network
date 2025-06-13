"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./menus.module.css";
import { API_URL } from "@/lib/api_url";
import { useUser } from "@/context/UserContext";
import {
	FollowersIcon,
	FollowingIcon,
	PostsIcon,
	GroupsIconSmall,
} from "@/components/icons";

type Counters = {
	total_posts: number;
	total_groups: number;
	followers: number;
	following: number;
};

export default function ProfileCard() {
	const { user } = useUser();
	const [stats, setStats] = useState<Counters | null>(null);

	// fetch counts when the logged-in user becomes available 
	useEffect(() => {
		if (!user) return;

		(async () => {
			try {
				const res = await fetch(
					`${API_URL}/api/users/profilesInfo?id=${encodeURIComponent(user.id)}`,
					{ credentials: "include", cache: "no-store" }
				);
				if (!res.ok) throw new Error();
				const d = await res.json();
				setStats({
					total_posts: d.total_posts ?? 0,
					total_groups: d.total_groups ?? 0,
					followers: d.followers ?? 0,
					following: d.following ?? 0,
				});
				user.about_me = d.about_me || "";
			} catch {
				setStats(null);
			}
		})();
	}, [user]);

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

			{stats && (
				<ul className={styles.numbers}>
					<li>
						<FollowersIcon /> {stats.followers}
						<span>Followers</span>
					</li>
					<li>
						<FollowingIcon /> {stats.following}
						<span>Following</span>
					</li>
					<li>
						<PostsIcon /> {stats.total_posts}
						<span>Posts</span>
					</li>
					<li>
						<GroupsIconSmall /> {stats.total_groups}
						<span>Groups</span>
					</li>
				</ul>
			)}

			{user.about_me && (
				<p className={styles.profileCardDesc}>{user.about_me}</p>
			)}
		</aside>
	);
}
