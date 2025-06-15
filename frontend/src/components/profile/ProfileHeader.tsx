"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./profileHeader.module.css";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api_url";
import FollowersList from "@/components/menus/FollowersList";
import FollowingsList from "@/components/menus/FollowingsList";
import FriendRequestList from "@/components/menus/FriendRequest";
import Loading from "../Loading";
import { User } from "@/lib/types";
import FollowButton from "./FollowButton";

/* -------------------------------- Types -------------------------------- */

type Adjoin = {
	total_posts: number;
	total_groups: number;
	followers: number;
	followings: number;
	is_following?: boolean;
	is_followed?: boolean;
	is_own?: boolean;
};

export default function ProfileHeader({ profileId }: { profileId?: string }) {
	const [profile, setProfile] = useState<User | null>(null);
	const [stats, setStats] = useState<Partial<Adjoin> | null>(null);
	const [privateProfile, setPrivateProfile] = useState(false);

	/* privacy-toggle state */
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [toggleLoading, setToggleLoading] = useState(false);

	/* modals */
	const [showFollowers, setShowFollowers] = useState(false);
	const [showFollowings, setShowFollowings] = useState(false);
	const [showRequests, setShowRequests] = useState(false);

	/* ---------------------- fetch on mount / id change --------------------- */
	useEffect(() => {
		if (!profileId) return;

		(async () => {
			try {
				const res = await fetch(
					`${API_URL}/api/users/profilesInfo?id=${encodeURIComponent(
						profileId
					)}`,
					{ credentials: "include", cache: "no-store" }
				);

				if (res.status === 206) {
					const data = await res.json();
					const { is_following, is_followed, is_own, ...userFields } = data;					
					setProfile(userFields as User);
					setStats({ is_following, is_followed, is_own });
					setPrivateProfile(true);
					return;
				}

				if (!res.ok) throw new Error();

				const data = await res.json();
				const {
					total_posts,
					total_groups,
					followers,
					followings,
					is_following,
					is_followed,
					is_own,
					...userFields
				} = data;
				
				setProfile(userFields as User);
				setStats({
					total_posts: total_posts ?? 0,
					total_groups: total_groups ?? 0,
					followers: followers ?? 0,
					followings: followings ?? 0,
					is_following: is_following ?? false,
					is_followed: is_followed ?? false,
					is_own: is_own ?? false,
				});
			} catch {
				setProfile(null);
			}
		})();
	}, [profileId]);

	const onToggleClick = () => {
		if (toggleLoading) return;
		setConfirmOpen(true);
	};

	const confirmToggle = async () => {
		if (!profile) return;
		setToggleLoading(true);
		try {
			const res = await fetch(`${API_URL}/api/handleAccountStatu`,
				{ method: "POST", credentials: "include" }
			);
			if (!res.ok) throw new Error();
			const { account_type } = await res.json();
			setProfile(prev => prev && { ...prev, account_type });
		} catch (e) {
			console.error("toggle privacy failed", e);
		} finally {
			setToggleLoading(false);
			setConfirmOpen(false);
		}
	};

	const cancelToggle = () => setConfirmOpen(false);

	/* ------------ early states ------------- */
	if (!profile) return <Loading />;

	/* ------------ helpers ------------- */
	const closeFollowers = () => setShowFollowers(false);
	const closeFollowings = () => setShowFollowings(false);
	const closeRequests = () => setShowRequests(false);

	const isOwn = stats?.is_own;

	console.log(isOwn, stats?.is_followed || stats?.is_following);
	
	
	return (
		<>
			<section className={styles.wrapper}>
				<div className={styles.cover}>
					<Image
						src="https://plus.unsplash.com/premium_photo-1669923868851-e37a4f49fcde"
						alt=""
						fill
						priority
						sizes="100vw"
						className={styles.coverImg}
					/>
				</div>

				<article className={styles.card}>

					{isOwn && (
						<button
							className={`${styles.privacyToggle} ${profile.account_type === "public" ? styles.pub : styles.priv}`}
							onClick={onToggleClick}
							aria-label="Toggle privacy"
						>
							<span className={styles.labelLeft}>Private</span>
							<span className={styles.switchTrack}>
								<span className={styles.switchThumb} />
							</span>
							<span className={styles.labelRight}>Public</span>
						</button>
					)}

					{!isOwn && (profile.account_type === "public" || stats?.is_followed || stats?.is_following) && (
						<Link href={`/chat/${profileId}`}>
							<button className={styles.msgBtn}>
								<Image src="/img/chat.svg" alt="dm user" width={22} height={22} />
								<span className={styles.msgText}>Message</span>
							</button>
						</Link>
					)}

					{isOwn && (
						<button onClick={() => setShowRequests(true)} className={styles.msgBtn}>
							<Image src="/img/follow-requests.svg" alt="follow requests" width={22} height={22} />
							<span className={styles.msgText}>Requests</span>
						</button>
					)}

					<div className={styles.avatarWrap}>
						<Image
							src={
								profile.profile_pic
									? `${API_URL}/api/storage/avatars/${profile.profile_pic}`
									: "/img/default-profile.png"
							}
							alt=""
							width={120}
							height={120}
							className={styles.avatar}
							priority
						/>
					</div>

					<h1 className={styles.name}>
						{profile.first_name} {profile.last_name}
					</h1>
					<p className={styles.username}>{profile.username ? `@${profile.username}` : ""}</p>

					{privateProfile ? (
						<div className={styles.empty}>
							<img src="/img/lock.svg" alt="private" width={60} height={60} />
							<p>Follow user to see content</p>
						</div>
					) : (
						<>
							<p className={styles.about}>{profile.about_me}</p>
							<ul className={styles.contact}>
								<li>
									<svg className={styles.contactIcon} width="16" height="16" viewBox="0 0 24 24" fill="none"
										stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<path d="M4 4h16v16H4z" />
										<polyline points="22,6 12,13 2,6" />
									</svg>
									<span>{profile.email}</span>
								</li>
								<li>
									<svg className={styles.contactIcon} width="16" height="16" viewBox="0 0 24 24" fill="none"
										stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
										<line x1="16" y1="2" x2="16" y2="6" />
										<line x1="8" y1="2" x2="8" y2="6" />
										<line x1="3" y1="10" x2="21" y2="10" />
									</svg>
									<span>{profile.birthday}</span>
								</li>
								<li>
									<span>{profile.account_type}</span>
								</li>
							</ul>

							<ul className={styles.stats}>
								<li>
									<div onClick={() => setShowFollowings(true)} className={styles.statLink}>
										<strong>{stats?.followings}</strong>
										<span>Following</span>
									</div>
								</li>
								<li>
									<div onClick={() => setShowFollowers(true)} className={styles.statLink}>
										<strong>{stats?.followers}</strong>
										<span>Followers</span>
									</div>
								</li>
								<li>
									<strong>{stats?.total_posts}</strong>
									<span>Posts</span>
								</li>
							</ul>
						</>
					)}

					{!isOwn && (
						<FollowButton profileUser={profile} />
					)}
				</article>
			</section>

			{/* followers / followings / requests modals */}
			{showFollowers && <FollowersList modal profileId={profileId} onClose={closeFollowers} />}
			{showFollowings && <FollowingsList modal profileId={profileId} onClose={closeFollowings} />}
			{showRequests && <FriendRequestList modal onClose={closeRequests} />}

			{confirmOpen && (
				<div className={styles.confirmBackdrop} onClick={cancelToggle}>
					<div
						className={styles.confirmBox}
						onClick={e => e.stopPropagation()}
					>
						<button
							className={styles.confirmClose}
							onClick={cancelToggle}
							aria-label="Close"
						>
							×
						</button>

						<p>
							Switch profile to&nbsp;
							{profile.account_type === "public" ? "Private" : "Public"}?
						</p>

						<div className={styles.confirmBtns}>
							<button onClick={cancelToggle} disabled={toggleLoading}>
								Cancel
							</button>
							<button onClick={confirmToggle} disabled={toggleLoading}>
								{toggleLoading ? "Saving…" : "Confirm"}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
