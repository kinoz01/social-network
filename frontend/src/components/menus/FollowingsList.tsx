"use client"

import { getFollowings, getProfileInfo } from "@/lib/followers";
import { Followings, User } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import styles from "./menus.module.css";
import ListItem from "./ListItem";

import NoData from "../NoData";
import Loading from "../Loading";
import { useUser } from "@/context/UserContext";
import { throttle } from "@/lib/utils";
import Image from "next/image";

function FollowingsList({
	page,
	profileId,
}: {
	page?: "home" | "profile";
	profileId?: string;
}) {
	const limit = 5;
	const { user: loggedUser } = useUser();

	const [profileUser, setProfileUser] = useState<User | null>(null);
	const [isPrivate, setPrivate] = useState(false);

	useEffect(() => {
		const fetchProfileInfo = async () => {
			const profileInfo = await getProfileInfo(profileId || "");
			setProfileUser(profileInfo);
		};

		fetchProfileInfo();
	}, [profileId]);

	const user: User | null = page === "home" ? loggedUser : profileUser;

	const scrollTrigger = useRef<HTMLDivElement>(null);
	const [currentPage, setPage] = useState<number>(1);
	const [hasMoreData, setHasMoreData] = useState<Boolean>(true);
	const [followings, setFollowings] = useState<Followings>({
		followings: [],
		totalCount: 0,
		totalPages: 0,
	});


	const [isDataLoading, setIsDataLoading] = useState(false);

	const loadMore = async () => {
		if (isDataLoading || !hasMoreData || !user?.id) {
			return;
		}

		setIsDataLoading(true);

		const res = await getFollowings(user.id, limit, currentPage);

		if (res === "private") {
			setPrivate(true);
			setHasMoreData(false);
			setIsDataLoading(false);
			return;
		}
		const data = res as Followings;

		if (data && data.followings) {
			if (data.followings.length === 0 || currentPage === data.totalPages) {
				setHasMoreData(false);
			}

			setFollowings((prevData) => {
				const existingIds = new Set(prevData.followings.map((n) => n.id));
				const newFollowing = data.followings.filter(
					(n) => !existingIds.has(n.id)
				);
				return {
					...prevData,
					followings: [...prevData.followings, ...newFollowing],
					totalCount: data.totalCount,
					totalPages: data.totalPages,
				};
			});

			setPage((prevPage) => prevPage + 1);
		}
		setIsDataLoading(false);
	};

	useEffect(() => {
		if (!scrollTrigger.current || !hasMoreData) {
			return;
		}

		const handleScroll = throttle(async () => {

			if (
				scrollTrigger.current &&
				scrollTrigger.current.scrollTop +
				scrollTrigger.current.clientHeight >=
				scrollTrigger.current.scrollHeight
			) {
				// If we've reached the bottom and not loading data, trigger loadMore
				if (!isDataLoading) {
					await loadMore();
				}
			}
		}, 300);


		// Attach the scroll event listener
		const container = scrollTrigger.current;
		container.addEventListener("scroll", handleScroll);

		// Cleanup the scroll event listener
		return () => {
			container.removeEventListener("scroll", handleScroll);
		};
	}, [user, hasMoreData, currentPage, isDataLoading]); // Watch for changes in `hasMoreData` and `isDataLoading`

	useEffect(() => {
		async function initialFetch() {
			await loadMore(); // Initial fetch on component mount
		}
		initialFetch();
	}, [user]); // Empty dependency array means this only runs once on mount

	return (
		<div className={styles.users} ref={scrollTrigger}>
			{isPrivate ? (
				<div className={styles.lock} >
					<Image src="/img/lock.svg" alt="Private profile" width={48} height={48} />
				</div>
			) : followings.followings === null || followings.followings.length === 0 ? (
				<NoData msg="No followings yet" />
			) : (
				followings.followings.map((following) => {
					return (
						<ListItem
							key={following.id}
							type="followers"
							item={following}
							loggedUser={loggedUser}
						/>
					);
				})
			)}
			{isDataLoading && <Loading />}
		</div>
	);
}

export default FollowingsList;
