"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getFollowShip, getProfileInfo } from "@/lib/followers";
import { FollowShip, User } from "@/lib/types";
import { useUser } from "@/context/UserContext";
import ListItem from "./ListItem";
import NoData from "../NoData";
import Loading from "../Loading";
import styles from "./menus.module.css";
import { useInfiniteScroll } from "@/lib/scroller";

const LIMIT = 8;

type Props = {
	profileId?: string;
	modal?: boolean;
	onClose?: () => void;
};

export default function FollowingsList({
	profileId,
	modal = false,
	onClose,
}: Props) {
	const { user: loggedUser } = useUser();

	const [profileUser, setProfileUser] = useState<User | null>(null);
	const [loadingProfile, setLoadingProfile] = useState(false);
	const [privateProfile, setPrivateProfile] = useState(false);

	useEffect(() => {
		let cancelled = false;
		const run = async () => {
			if (!profileId) return;
			setLoadingProfile(true);
			const info = await getProfileInfo(profileId);
			if (!cancelled) setProfileUser(info);
			setLoadingProfile(false);
		};
		run();
		return () => {
			cancelled = true;
		};
	}, [profileId]);

	const viewedUser = profileId ? profileUser : loggedUser;

	/* Paging state */
	const [list, setList] = useState<User[]>([]);
	const [page, setPage] = useState(1);
	const [hasMore, setMore] = useState(true);
	const [loading, setLoad] = useState(false);

	/* Reset when profile changes */
	useEffect(() => {
		setList([]);
		setPage(1);
		setMore(true);
		setPrivateProfile(false);
	}, [viewedUser?.id]);

	/* Fetch one page */
	const fetchPage = useCallback(
		async (p: number) => {
			if (!viewedUser?.id) return;
			setLoad(true);
			try {
				const res: FollowShip | null = await getFollowShip("following", viewedUser.id, LIMIT, p);
				if (!res || !res.followList) {
					setMore(false);
					return;
				}
				setList(prev => {
					const ids = new Set(prev.map(u => u.id));
					const uniq = res.followList.filter(u => !ids.has(u.id));
					return [...prev, ...uniq];
				});
				setMore(p < res.totalPages);
				setPage(p + 1);
			} catch (err) {
				const { status } = err as { status?: number };
				if (status === 206) {                 // NEW
					setPrivateProfile(true);
					setMore(false);
				} else {
					console.log("fetch error", err);
				}
			} finally {
				setLoad(false);
			}
		},
		[viewedUser?.id],
	);

	/* Initial page */
	useEffect(() => {
		if (viewedUser?.id) fetchPage(1);
	}, [viewedUser?.id, fetchPage]);

	/* Infinite scroll */
	const boxRef = useRef<HTMLDivElement>(null);
	useInfiniteScroll(boxRef, { loading, hasMore, page, fetchPage });

	const content = privateProfile ? (
		<div className={styles.empty}>
			<img src="/img/lock.svg" alt="private" width={100} height={100} />
			<p className={styles.empty}>This profile is private</p>
		</div>
	) : list.length === 0 && !loading ? (
		<NoData msg="No followings yet" />
	) : (
		<>
			{list.map(f => (
				<ListItem
					key={f.id}
					type="followings"
					item={f}
					loggedUser={loggedUser}
				/>
			))}
		</>
	);

	/* Inline variant */
	if (!modal) {
		return (
			<div className={styles.users} ref={boxRef}>
				{content}
				{(loading || loadingProfile) && <Loading />}
			</div>
		);
	}

	/* Modal overlay */
	return (
		<div
			className={styles.modalBackdrop}
			onClick={() => onClose?.()}
		>
			<div
				className={styles.modalPanel}
				onClick={e => e.stopPropagation()}
				ref={boxRef}
			>
				<button className={styles.closeBtn} onClick={() => onClose?.()}>
					×
				</button>
				<h4 className={styles.modalTitle}>Followings</h4>
				{content}
				{(loading || loadingProfile) && <Loading />}
			</div>
		</div>
	);
}
