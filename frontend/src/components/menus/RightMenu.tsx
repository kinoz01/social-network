"use client";

import styles from "./menus.module.css";
import List from "./List";
import { useUser } from "@/context/UserContext";
import { useParams } from "next/navigation";

export default function RightMenu({ page }: { page?: string }) {
	const { user } = useUser();
	const { id } = useParams() as { id: string | undefined };

	if (!user) return null;

	const profileId = page === "profile" ? id : user.id;

	return (
		<div className={styles.rightMenu}>
			<List key={`followings-${profileId}`} type="followings" title="Followings" profileId={page === "profile" ? id : user.id} />
			<List key={`followers-${profileId}`} type="followers" title="Followers" profileId={page === "profile" ? id : user.id} />
		</div>
	);
}
