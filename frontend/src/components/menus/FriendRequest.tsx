"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { API_URL } from "@/lib/api_url";

import { getFollowingRequests, addFollower } from "@/lib/followers";
import { FriendRequest, ReqUser } from "@/lib/types";

import { useUser } from "@/context/UserContext";
import { useWS } from "@/context/wsClient";
import { useFollowSync } from "@/context/FollowSyncContext";

import NoData from "../NoData";
import Loading from "../Loading";
import styles from "./menus.module.css";

function FriendRequestList() {

	let throttleTimer = false;
	const limit = 8;

	const { user: loggedUser } = useUser();
	const { deleteNotification } = useWS();
	const { refresh } = useFollowSync();

	const scrollTrigger = useRef<HTMLDivElement>(null);

	const [currentPage, setPage] = useState(1);
	const [hasMoreData, setMore] = useState<Boolean>(true);
	const [isDataLoading, setIsDataLoading] = useState(false);

	const [friendRequests, setRequests] = useState<FriendRequest>({
		requests: [],
		totalCount: 0,
		totalPages: 0,
	});

	const throttle = (callback: Function, time: number) => {
		if (throttleTimer) return;
		throttleTimer = true;
		setTimeout(() => {
			callback();
			throttleTimer = false;
		}, time);
	};

	const dropRow = (followId: string) => {
		setRequests(prev => ({
			...prev,
			requests: prev.requests.filter(r => r.followId !== followId),
		}));
		deleteNotification(followId);
	};

	const handleAction = async (action: "accepted" | "rejected", u: ReqUser) => {
		await addFollower(
			{ action, status: action, followerID: u.id, followedId: String(loggedUser?.id) },
			"/api/followers/add"
		);
		dropRow(u.followId);
		refresh();  // update version for other lists
	};

	const loadMore = async () => {
		// Prevent multiple fetches when data is already loading
		if (isDataLoading || !hasMoreData) return;

		setIsDataLoading(true); // Mark loading start

		const data: FriendRequest | null = await getFollowingRequests(limit, currentPage);

		if (data && data.requests) {
			if (data.requests.length === 0 || currentPage === data.totalPages) {
				setMore(false);
			}

			setRequests(prev => {
				const seen = new Set(prev.requests.map(n => n.followId));
				const fresh = data.requests.filter(n => !seen.has(n.followId));
				return {
					...prev,
					requests: [...prev.requests, ...fresh],
					totalCount: data.totalCount,
					totalPages: data.totalPages,
				};
			});

			setPage(p => p + 1);
		} else {
			setMore(false);
		}
		setIsDataLoading(false);
	};

	useEffect(() => {
		if (!scrollTrigger.current || !hasMoreData) {
			return;
		}

		const handleScroll = () => {
			throttle(() => {
				if (
					scrollTrigger.current &&
					scrollTrigger.current.scrollTop +
					scrollTrigger.current.clientHeight >=
					scrollTrigger.current.scrollHeight
				) {
					// If we've reached the bottom and not loading data, trigger loadMore
					if (!isDataLoading) {
						loadMore();
					}
				}
			}, 300);
		};

		// Attach the scroll event listener
		const container = scrollTrigger.current;
		container.addEventListener("scroll", handleScroll);

		// Cleanup the scroll event listener
		return () => {
			container.removeEventListener("scroll", handleScroll);
		};
	}, [hasMoreData, currentPage, isDataLoading]); // Watch for changes in `hasMoreData` and `isDataLoading`


	useEffect(() => {
		setPage(1);
		setMore(true);
		loadMore(); // Initial fetch on component mount
	}, []); // Empty dependency array means this only runs once on mount

	return (
		<div className={styles.users} ref={scrollTrigger}>
			{friendRequests.requests.length === 0 && !isDataLoading ? (
				<NoData msg="No Friend Requests yet" />
			) : (
				friendRequests.requests.map(u => (
					<li key={u.followId} className={styles.item}>
						<Link href={`/profile/${u.id}`} className={styles.rowLink} scroll={false}>
							<Image
								className={styles.avt}
								src={
									u.profile_pic
										? `${API_URL}/api/storage/avatars/${u.profile_pic}`
										: "/img/default-avatar.png"
								}
								alt=""
								width={36}
								height={36}
							/>
							<span className={styles.name}>{u.first_name} {u.last_name}</span>
						</Link>

						<div className={styles.buttons} onClick={e => e.stopPropagation()}>
							<button
								className={styles.icnButton}
								title="Accept"
								onClick={() => handleAction("accepted", u)}
							>
								<Image src="/img/accept.svg" alt="accept" width={20} height={20} />
							</button>
							<button
								className={styles.icnButton}
								title="Reject"
								onClick={() => handleAction("rejected", u)}
							>
								<Image src="/img/refuse.svg" alt="refuse" width={20} height={20} />
							</button>
						</div>
					</li>
				))
			)}

			{isDataLoading && <Loading />}
		</div>
	);
}

export default FriendRequestList;
