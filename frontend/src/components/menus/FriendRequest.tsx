"use client";

import {
	useState,
	useRef,
	useEffect,
	useCallback,
	RefObject,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useWS } from "@/context/wsClient";
import { getFollowingRequests, addFollower } from "@/lib/followers";
import NoData from "../NoData";
import Loading from "../Loading";
import styles from "./menus.module.css";
import { API_URL } from "@/lib/api_url";
import { useInfiniteScroll } from "@/lib/scroller";
import { ReqUser } from "@/lib/types";
import { useFollowSync } from "@/context/FollowSyncContext";

const LIMIT = 10;


// for modal
type Props = {
	modal?: boolean;
	onClose?: () => void;
};

/* ───────── Component ───────── */
export default function FriendRequests({ modal = false, onClose }: Props) {
	const { deleteNotification } = useWS();
	const { user: loggedUser } = useUser();
	const { refresh } = useFollowSync()

	const [list, setList] = useState<ReqUser[]>([]);
	const [page, setPage] = useState(1);
	const [hasMore, setMore] = useState(true);
	const [loading, setLoading] = useState(true);

	/* fetch page */
	const fetchPage = useCallback(async (p: number) => {
		setLoading(true);
		const res = await getFollowingRequests(LIMIT, p);
		if (!res || !res.requests) {
			setMore(false);
			setLoading(false);
			return;
		}
		setList(prev => [...prev, ...res.requests]);
		setMore(p < res.totalPages);
		setPage(p + 1);
		setLoading(false);
	}, []);

	/* initial page */
	useEffect(() => {
		fetchPage(1);
	}, [fetchPage]);

	/* optimistic remove */
	const dropRow = (followId: string) => {
		setList(prev => prev.filter(u => u.followId !== followId));
		deleteNotification(followId);
	};

	/* unified callback */
	const handleAction = async (
		action: "accepted" | "rejected",
		userId: string,
		followId: string
	) => {
		await addFollower(
			{
				action,
				status: action,
				followerID: userId,
				followedId: String(loggedUser?.id),
			},
			"/api/followers/add"
		);
		dropRow(followId);
		refresh()
	};	

	/* infinite scroll */
	const boxRef = useRef<HTMLDivElement>(null);
	useInfiniteScroll(boxRef, { loading, hasMore, page, fetchPage });

	/* ───────── List content ───────── */
	const content = (
		<>
			{list.length === 0 && !loading ? (
				<NoData msg="No Follow Requests yet" />
			) : (
				<>
					{list.map(u => (
						<li key={u.id} className={styles.item}>
							<Link
								href={`/profile/${u.id}`}
								className={styles.rowLink}
								scroll={false}
							>
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
								<span className={styles.name}>
									{u.first_name} {u.last_name}
								</span>
							</Link>

							<div
								className={styles.buttons}
								onClick={e => e.stopPropagation()}
							>
								<button
									className={styles.icnButton}
									title="Accept"
									onClick={() => handleAction("accepted", u.id, u.followId)}
								>
									<Image src="/img/accept.svg" alt="" width={20} height={20} />
								</button>
								<button
									className={styles.icnButton}
									title="Reject"
									onClick={() => handleAction("rejected", u.id, u.followId)}
								>
									<Image src="/img/refuse.svg" alt="" width={20} height={20} />
								</button>
							</div>
						</li>
					))}
				</>
			)}

			{loading && <Loading />}
		</>
	);

	/* inline mode */
	if (!modal) {
		return (
			<div className={styles.users} ref={boxRef}>
				{content}
			</div>
		);
	}

	/* modal overlay */
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
				<h4 className={styles.modalTitle}>Follow Requests</h4>
				{content}
			</div>
		</div>
	);
}
