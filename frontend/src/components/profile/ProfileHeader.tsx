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
import Feed from "../posts/Feed";
/* -------------------------------- Types -------------------------------- */


// **********************************
export interface Profile {
	id: string;
	email: string;
	username: string;
	profile_pic: string;
	first_name: string;
	last_name: string;
	birthday: string;
	about_me: string;
	account_type: string;
	post_nbr: number;
	total_followers: number;
	total_followings: number;
}




const ProfileHeader = ({ profileId }: { profileId?: string }) => {
	const [userData, setData] = useState<Profile | null>(null);
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [privateProfile, setPrivate] = useState<boolean>(false);
	const [statusUpdated, setStatusUpdated] = useState<boolean>(false);


	const [followers, setFollowers] = useState<boolean>(false)
	const [followings, setFollowings] = useState<boolean>(false)
	const { user } = useUser();

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
			const res = await fetch(`http://localhost:8080/api/profileData/${profileId}`, {
				credentials: "include",
			})
			const data = await res.json();
			if (res.status == 206) {
				setPrivate(true)
			}
			setData(data)

		} catch (error) {
			console.log("error", error);
		} finally {
			setIsLoading(false);
		}
	}



	useEffect(() => {
		const fetch = async () => {
			await fetchData();
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
						user?.id === profileId && (
							<button className={`${styles.accountStatus}`} onClick={() => setIsModalOpen((prev) => !prev)} > account staut </button>
						)
					}
				</div>

				<div className={styles.data}>
					<div >
						<div className={styles.username}>
							<span>{userData.first_name} {userData.last_name}</span>
							{
								<FollowButton profileUser={userData} />
							}
						</div>

						{!privateProfile &&
							<>
								<div className={styles.numbers}>
									<div className={styles.postsNumber}> {userData?.post_nbr} Posts</div>
									<div onClick={() => {
										setFollowers(prev => !prev)
										setFollowings(false)
									}} className={styles.followersNumber}>{userData.total_followers} Followers </div>
									<div onClick={() => {
										setFollowings(prev => !prev)
										setFollowers(false)
									}} className={styles.followingNumber}>{userData.total_followings} Following</div>
								</div>
								<div className={styles.more_data}>
									<span>{userData.username} </span>
									<span>{userData.about_me}</span>
									<span>{userData.birthday}</span>
									<span>{userData.email}</span>
								</div>
							</>
						}

					</div>

				</div>
			</div>

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
			<div className={styles.modalcontainer}>
				<div className={styles.modal}>

				<div className={styles.header}>
					
			     <button onClick={() => setFollowers((prev) => !prev)} className={styles.closebtn}>&times;</button>
				</div>
				<div className={styles.followers}>
					<FollowersList profileId={profileId} />
				</div>
				</div>
			</div>
		}
		{
			followings &&
						<div className={styles.modalcontainer}>
				<div className={styles.modal}>

				<div className={styles.header}>
					
			     <button onClick={() => setFollowings((prev) => !prev)} className={styles.closebtn}>&times;</button>
				</div>
			<div className={styles.followings}>
				<FollowingsList profileId={profileId} />
			</div>
				</div>
			</div>
		}

	</>
}

export default ProfileHeader