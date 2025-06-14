"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getFollowShip } from "@/lib/followers";
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

export default function FollowersList({ profileId, modal = false, onClose }: Props) {
	const { user: loggedUser } = useUser();

	const [privateProfile, setPrivateProfile] = useState(false)


	/* Paging state */
	const [list, setList] = useState<User[]>([]);
	const [page, setPage] = useState(1);
	const [hasMore, setMore] = useState(true);
	const [loading, setLoad] = useState(false);
	
	/* Reset when user changes */
	useEffect(() => {
		setList([]);
		setPage(1);
		setMore(true);
	}, [profileId]);

	/* Fetch one page */
	const fetchPage = useCallback(async (p: number) => {
		if (!profileId) return;
		setLoad(true);
		try {
			const res: FollowShip | null = await getFollowShip("follower", profileId, LIMIT, p);
			if (!res || !res.followList) {
				setMore(false);
				setLoad(false);
				return;
			}
			setList(prev => {
				const ids = new Set(prev.map(u => u.id));
				const uniq = res.followList.filter(u => !ids.has(u.id));
				return [...prev, ...uniq];
			});
			setMore(p < res.totalPages);
			setPage(p + 1);
			setLoad(false);
		} catch (err) {
			const { status } = err as { status: number };
			if (status === 206) {				
				setPrivateProfile(true);
				setMore(false);
			}
		} finally {
			setLoad(false);
		}
	}, [profileId]);

	/* Initial page */
	useEffect(() => {
		if (profileId) fetchPage(1);
	}, [profileId, fetchPage]);

	/* Infinite scroll */
	const boxRef = useRef<HTMLDivElement>(null);
	useInfiniteScroll(boxRef, { loading, hasMore, page, fetchPage });

	/* ───────── Render helpers ───────── */
	const content = privateProfile ? (
		<div className={styles.empty}>
			<img src="/img/lock.svg" alt="private" width={100} height={100} />
			<p className={styles.empty}>This profile is private</p>
		</div>
	) : list.length === 0 && !loading ? (
		<NoData msg="No Followers yet" />
	) : (
		<>
			{list.map(f => (
				<ListItem
					key={f.id}
					type="followers"
					item={f}
					loggedUser={loggedUser}
				/>
			))}
		</>
	);


	if (!modal) {
		return (
			<div className={styles.users} ref={boxRef}>
				{content}
				{loading && <Loading />}
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
				onClick={e => e.stopPropagation()}   // keep clicks inside modal
				ref={boxRef}
			>
				<button className={styles.closeBtn} onClick={() => onClose?.()}>
					×
				</button>
				<h4 className={styles.modalTitle}>Followers</h4>
				{content}
			</div>
		</div>
	);
}
