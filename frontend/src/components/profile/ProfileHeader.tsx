"use client";
import Image from "next/image";
import Link from "next/link";
import styles from "./profileHeader.module.css";
import { useUser } from "@/context/UserContext";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api_url";


type Counters = {
	total_posts: number;
	total_groups: number;
	followers: number;
	following: number;
};


export default function ProfileHeader({ profileId }: { profileId?: string }) {
	const { user } = useUser();
	const [stats, setStats] = useState<Counters | null>(null);
	const [privateProfile, setPrivateProfile] = useState(false)

	// fetch profile when the logged-in user becomes available 
	useEffect(() => {
		if (!user) return;

		(async () => {
			try {
				const res = await fetch(
					`${API_URL}/api/users/profilesInfo?id=${encodeURIComponent(profileId || user.id)}`,
					{ credentials: "include", cache: "no-store" }
				);
				if (res.status === 206) {
					setStats(null);
					setPrivateProfile(true);

				} else if (!res.ok) throw new Error();
				const data = await res.json();
				setStats({
					total_posts: data.total_posts ?? 0,
					total_groups: data.total_groups ?? 0,
					followers: data.followers ?? 0,
					following: data.following ?? 0,
				});
				user.about_me = data.about_me || "";
				user.profile_pic = data.profile_pic || user.profile_pic;
				user.first_name = data.first_name || user.first_name;
				user.last_name = data.last_name || user.last_name;
				user.username = data.username || user.username;
				user.email = data.email || user.email;
				user.birthday = data.birthday || user.birthday;
				user.account_type = data.account_type || user.account_type;
			} catch {
				setStats(null);
			}
		})();
	}, [user]);

	if (!user) return null;


	return (
		<header className={styles.header}>
			{/* ───── cover image ───── */}
			<div className={styles.cover}>
				<Image
					src="https://images.unsplash.com/photo-1520763185298-1b434c919102"
					alt=""
					fill
					priority
					sizes="100vw"
					className={styles.coverImg}
				/>
			</div>

			{/* ───── profile card ───── */}
			<div className={styles.card}>
				<button className={styles.msgBtn} aria-label="Open chat">
					<Image src="/img/chat.svg" alt="" width={22} height={22} />
					<span className={styles.msgText}>Message</span>
				</button>
				<div className={styles.avatarWrap}>
					<Image
						src={user.profile_pic
							? `${API_URL}/api/storage/avatars/${user.profile_pic}`
							: "/img/default-profile.png"}
						alt=""
						width={120}
						height={120}
						className={styles.avatar}
						priority
					/>
				</div>

				<h1 className={styles.name}>{user.first_name} {user.last_name}</h1>
				<p className={styles.username}>{`${user.username ? `@${user.username}` : ""}`}</p>
				{privateProfile ? (
					<div className={styles.empty}>
						<img src="/img/lock.svg" alt="private" width={60} height={60} />
						<p>Follow user to see content</p>
					</div>
				) : (
					<>
						<p className={styles.about}>{user.about_me}</p>

						<ul className={styles.contact}>
							<li>
								<svg
									className={styles.contactIcon}
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M4 4h16v16H4z" />
									<polyline points="22,6 12,13 2,6" />
								</svg>
								<span>{user.email}</span>
							</li>

							<li>
								<svg
									className={styles.contactIcon}
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
									<line x1="16" y1="2" x2="16" y2="6" />
									<line x1="8" y1="2" x2="8" y2="6" />
									<line x1="3" y1="10" x2="21" y2="10" />
								</svg>
								<span>{user.birthday}</span>
							</li>
							<li>
								<span>{user.account_type}</span>
							</li>
						</ul>

						<ul className={styles.stats}>
							<li>
								<Link href={`/profile/${profileId}/friends`} className={styles.statLink}>
									<strong>{stats?.followers}</strong>
									<span>Followers</span>
								</Link>
							</li>

							<li>
								<Link href={`/profile/${profileId}/photos`} className={styles.statLink}>
									<strong>{stats?.following}</strong>
									<span>Following</span>
								</Link>
							</li>

							<li>
								<strong>{stats?.total_posts}</strong>
								<span>Posts</span>
							</li>
						</ul>
					</>
				)}

				<button className={styles.cta}>Follow</button>
			</div>
		</header>
	);
}
