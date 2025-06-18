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
import { useFollowSync } from "@/context/FollowSyncContext";
import { useUser } from "@/context/UserContext";
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

export interface Profile {
	email: string;
	username: string;
	profile_pic: string;
	first_name: string;
	last_name: string;
	birthday: string;
	about_me: string;
	account_type: string;
	// posts: Post[];
	post_nbr: number;
	total_followers: number;
	total_followings: number;
}

// export default function ProfileHeader({ profileId }: { profileId?: string }) {
// 	const [profile, setProfile] = useState<User | null>(null);
// 	const [stats, setStats] = useState<Partial<Adjoin> | null>(null);
// 	const [privateProfile, setPrivateProfile] = useState(false);

// 	/* privacy-toggle state */
// 	const [confirmOpen, setConfirmOpen] = useState(false);
// 	const [toggleLoading, setToggleLoading] = useState(false);

// 	/* modals */
// 	const [showFollowers, setShowFollowers] = useState(false);
// 	const [showFollowings, setShowFollowings] = useState(false);
// 	const [showRequests, setShowRequests] = useState(false);
// 	const { version, refresh } = useFollowSync();

// 	/* ---------------------- fetch on mount / id change --------------------- */
// 	useEffect(() => {
// 		if (!profileId) return;

// 		(async () => {
// 			try {
// 				const res = await fetch(
// 					`${API_URL}/api/users/profilesInfo?id=${encodeURIComponent(
// 						profileId
// 					)}`,
// 					{ credentials: "include", cache: "no-store" }
// 				);

// 				if (res.status === 206) {
// 					const data = await res.json();
// 					const { is_following, is_followed, is_own, ...userFields } = data;					
// 					setProfile(userFields as User);
// 					setStats({ is_following, is_followed, is_own });
// 					setPrivateProfile(true);
// 					return;
// 				}

// 				if (!res.ok) throw new Error();

// 				const data = await res.json();
// 				const {
// 					total_posts,
// 					total_groups,
// 					followers,
// 					followings,
// 					is_following,
// 					is_followed,
// 					is_own,
// 					...userFields
// 				} = data;

// 				setProfile(userFields as User);
// 				setStats({
// 					total_posts: total_posts ?? 0,
// 					total_groups: total_groups ?? 0,
// 					followers: followers ?? 0,
// 					followings: followings ?? 0,
// 					is_following: is_following ?? false,
// 					is_followed: is_followed ?? false,
// 					is_own: is_own ?? false,
// 				});
// 			} catch {
// 				setProfile(null);
// 			}
// 		})();
// 	}, [profileId, version]);

// 	const onToggleClick = () => {
// 		if (toggleLoading) return;
// 		setConfirmOpen(true);
// 	};

// 	const confirmToggle = async () => {
// 		if (!profile) return;
// 		setToggleLoading(true);
// 		try {
// 			const res = await fetch(`${API_URL}/api/handleAccountStatu`,
// 				{ method: "POST", credentials: "include" }
// 			);
// 			if (!res.ok) throw new Error();
// 			const { account_type } = await res.json();
// 			setProfile(prev => prev && { ...prev, account_type });
// 		} catch (e) {
// 			console.error("toggle privacy failed", e);
// 		} finally {
// 			setToggleLoading(false);
// 			setConfirmOpen(false);
// 			refresh()
// 		}
// 	};

// 	const cancelToggle = () => setConfirmOpen(false);

// 	/* ------------ early states ------------- */
// 	if (!profile) return <Loading />;

// 	/* ------------ helpers ------------- */
// 	const closeFollowers = () => setShowFollowers(false);
// 	const closeFollowings = () => setShowFollowings(false);
// 	const closeRequests = () => setShowRequests(false);

// 	const isOwn = stats?.is_own;	

// 	return (
// 		<>
// 			<section className={styles.wrapper}>
// 				<div className={styles.cover}>
// 					<Image
// 						src="https://plus.unsplash.com/premium_photo-1669923868851-e37a4f49fcde"
// 						alt=""
// 						fill
// 						priority
// 						sizes="100vw"
// 						className={styles.coverImg}
// 					/>
// 				</div>

// 				<article className={styles.card}>

// 					{isOwn && (
// 						<button
// 							className={`${styles.privacyToggle} ${profile.account_type === "public" ? styles.pub : styles.priv}`}
// 							onClick={onToggleClick}
// 							aria-label="Toggle privacy"
// 						>
// 							<span className={styles.labelLeft}>Private</span>
// 							<span className={styles.switchTrack}>
// 								<span className={styles.switchThumb} />
// 							</span>
// 							<span className={styles.labelRight}>Public</span>
// 						</button>
// 					)}

// 					{!isOwn && (profile.account_type === "public" || stats?.is_followed || stats?.is_following) && (
// 						<Link href={`/chat/${profileId}`}>
// 							<button className={styles.msgBtn}>
// 								<Image src="/img/chat.svg" alt="dm user" width={22} height={22} />
// 								<span className={styles.msgText}>Message</span>
// 							</button>
// 						</Link>
// 					)}

// 					{isOwn && (
// 						<button onClick={() => setShowRequests(true)} className={styles.msgBtn}>
// 							<Image src="/img/follow-requests.svg" alt="follow requests" width={22} height={22} />
// 							<span className={styles.msgText}>Requests</span>
// 						</button>
// 					)}

// 					<div className={styles.avatarWrap}>
// 						<Image
// 							src={
// 								profile.profile_pic
// 									? `${API_URL}/api/storage/avatars/${profile.profile_pic}`
// 									: "/img/default-profile.png"
// 							}
// 							alt=""
// 							width={120}
// 							height={120}
// 							className={styles.avatar}
// 							priority
// 						/>
// 					</div>

// 					<h1 className={styles.name}>
// 						{profile.first_name} {profile.last_name}
// 					</h1>
// 					<p className={styles.username}>{profile.username ? `@${profile.username}` : ""}</p>

// 					{privateProfile ? (
// 						<div className={styles.empty}>
// 							<img src="/img/hidden.svg" alt="private" width={40} height={40} />
// 							<p>Follow user to see content</p>
// 						</div>
// 					) : (
// 						<>
// 							<p className={styles.about}>{profile.about_me}</p>
// 							<ul className={styles.contact}>
// 								<li>
// 									<svg className={styles.contactIcon} width="16" height="16" viewBox="0 0 24 24" fill="none"
// 										stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
// 										<path d="M4 4h16v16H4z" />
// 										<polyline points="22,6 12,13 2,6" />
// 									</svg>
// 									<span>{profile.email}</span>
// 								</li>
// 								<li>
// 									<svg className={styles.contactIcon} width="16" height="16" viewBox="0 0 24 24" fill="none"
// 										stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
// 										<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
// 										<line x1="16" y1="2" x2="16" y2="6" />
// 										<line x1="8" y1="2" x2="8" y2="6" />
// 										<line x1="3" y1="10" x2="21" y2="10" />
// 									</svg>
// 									<span>{profile.birthday}</span>
// 								</li>
// 								<li>
// 									<span>{profile.account_type}</span>
// 								</li>
// 							</ul>

// 							<ul className={styles.stats}>
// 								<li>
// 									<div onClick={() => setShowFollowings(true)} className={styles.statLink}>
// 										<strong>{stats?.followings}</strong>
// 										<span>Following</span>
// 									</div>
// 								</li>
// 								<li>
// 									<div onClick={() => setShowFollowers(true)} className={styles.statLink}>
// 										<strong>{stats?.followers}</strong>
// 										<span>Followers</span>
// 									</div>
// 								</li>
// 								<li>
// 									<strong>{stats?.total_posts}</strong>
// 									<span>Posts</span>
// 								</li>
// 							</ul>
// 						</>
// 					)}

// 					{!isOwn && (
// 						<FollowButton profileUser={profile} />
// 					)}
// 				</article>
// 			</section>

// 			{/* followers / followings / requests modals */}
// 			{showFollowers && <FollowersList modal profileId={profileId} onClose={closeFollowers} />}
// 			{showFollowings && <FollowingsList modal profileId={profileId} onClose={closeFollowings} />}
// 			{showRequests && <FriendRequestList modal onClose={closeRequests} />}

// 			{confirmOpen && (
// 				<div className={styles.confirmBackdrop} onClick={cancelToggle}>
// 					<div
// 						className={styles.confirmBox}
// 						onClick={e => e.stopPropagation()}
// 					>
// 						<button
// 							className={styles.confirmClose}
// 							onClick={cancelToggle}
// 							aria-label="Close"
// 						>
// 							×
// 						</button>

// 						<p>
// 							Switch profile to&nbsp;
// 							{profile.account_type === "public" ? "Private" : "Public"}?
// 						</p>

// 						<div className={styles.confirmBtns}>
// 							<button onClick={cancelToggle} disabled={toggleLoading}>
// 								Cancel
// 							</button>
// 							<button onClick={confirmToggle} disabled={toggleLoading}>
// 								{toggleLoading ? "Saving…" : "Confirm"}
// 							</button>
// 						</div>
// 					</div>
// 				</div>
// 			)}
// 		</>
// 	);
// }


const ProfileHeader = ({ profileId }: { profileId?: string }) => {
	const [userData, setData] = useState<Profile | null>(null);
	const [userPosts, setPosts] = useState<Profile | null>(null);
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const [statusUpdated, setStatusUpdated] = useState<boolean>(false);

	const [followers, setFollowers] = useState<boolean>(false)
	const [followings, setFollowings] = useState<boolean>(false)
	const user = useUser();

	const accoutType = userData?.account_type === "public" ? "private" : "public";

	async function handleStatus() {
		if (isLoading) return;

		setIsLoading(true);

		try {
			const res = await fetch(`http://localhost:8080/api/handleAccountStatu/${profileId}`, {
				method: "POST",
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					status: accoutType // "public" or "private"
				}),
			})
			const data = await res.json();
			console.log("daaaaaaaaaaaaaaaaaaata: ", data);

			setStatusUpdated(prev => !prev);

			setIsModalOpen((prev) => !prev);
		} catch (error) {
			console.log("error", error);
		} finally {
			setIsLoading(false);
		}
	}



	async function fetchData() {
		if (isLoading) return;

		setIsLoading(true);
		try {
			const res = await fetch(`http://localhost:8080/api/profileData/${profileId}`)
			const data = await res.json();
			setData(data)
			console.log('profile data', data);

		} catch (error) {
			console.log("error", error);
		} finally {
			setIsLoading(false);
		}
	}

	async function fetchPost() {
		if (isLoading) return;

		setIsLoading(true);
		try {
			const res = await fetch(`http://localhost:8080/api/profilePosts/${profileId}`, {
				credentials: "include",
			})
			const posts = await res.json();
			setPosts(posts)
			console.log("posts",posts);
		} catch (error) {
			console.log("error", error);
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => {
		const fetch = async () => {
			await fetchData();
			await fetchPost();
		}
		fetch()
	}, [statusUpdated])

	if (!userData) return <p>loading ...</p>
	return <>
		<div className={styles.container}>
			<div className={styles.userInfo}>
				<div className={styles.image_btn}>
					<Image
						src={userData.profile_pic ? `${API_URL}/api/storage/avatars/${userData.profile_pic}` : `${API_URL}/api/storage/avatars/avatar.webp`}
						alt={`${userData.profile_pic}`} className={styles.userImageprofil} width={150} height={150} />
					{
						user.user?.id === profileId && (
							<button className={`${styles.accountStatus}`} onClick={() => setIsModalOpen((prev) => !prev)} > account staut </button>
						)
					}
				</div>

				<div className={styles.data}>
					<div >
						<div className={styles.username}>
							<span>{userData.first_name} {userData.last_name}</span>
							{
								user.user?.id !== profileId && (
									<button className={`${styles.followBtn}`}>
										Follow
									</button>
								)
							}
						</div>
						<div className={styles.numbers}>
							<div className={styles.postsNumber}> {userPosts?.post_nbr} Posts</div>
							<div onClick={() => {
								setFollowers(prev => !prev)
								setFollowings(false)

							}} className={styles.followersNumber}>{userData.total_followers} Followers </div>
							<div onClick={() => {
								setFollowings(prev => !prev)
								setFollowers(false)
							}} className={styles.followingNumber}>{userData.total_followings} Following</div>
						</div>
					</div>
					<div className={styles.more_data}>
						<span>{userData.username} </span>
						<span>{userData.about_me}</span>
						<span>{userData.birthday}</span>
						<span>{userData.email}</span>
					</div>
				</div>
			</div>
			{/* <section className={styles.posts}>
				<div className={styles.profile_posts}>
					{
						userPosts?.posts?.map((elem, i) => <PostComponent post={elem} key={elem.id} />)
					}
				</div>
			</section> */}
		</div>
		{
			isModalOpen &&
			<>
				<div className={styles.modalcontainer}>
					<div className={styles.modal}>
						<div className={styles.header}>
							<h3>Change Profile Status</h3>
							<button onClick={() => setIsModalOpen((prev) => !prev)} className={styles.closebtn}>&times;</button>
						</div>
						<div className={styles.content}>
							<p>Do you want to change your profile from <strong>{userData.account_type}</strong> to <strong>{accoutType}</strong>?</p>

							<div className={styles.info}>
								<div className={styles.statusbox}>
									<span className={styles.icon}>🔒</span>
									<div>
										<h4>Private Profile</h4>
										<p>Only you can see your posts and information</p>
									</div>
								</div>
							</div>
						</div>
						<div className={styles.actions}>
							<button onClick={() => setIsModalOpen((prev) => !prev)} className={styles.cancelbtn}>Cancel</button>
							<button disabled={isLoading} onClick={handleStatus} className={styles.confirmbtn}>Change to {accoutType}</button>
						</div>
					</div>
				</div>
			</>
		}
		{
			followers &&
			<div className={styles.followers}>
				<div>Followers</div>
				<FollowersList profileId={profileId} />
			</div>
		}
		{
			followings &&
			<div className={styles.followings}>
				<div>Followings</div>
				<FollowingsList profileId={profileId} />
			</div>
		}

	</>
}

export default ProfileHeader