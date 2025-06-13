"use client";

import styles from "./menus.module.css";
import List from "./List";
import { useUser } from "@/context/UserContext";
import { useParams } from "next/navigation";
import ProfileCard from "./ProfileCard";

export default function RightMenu({ page }: { page?: string }) {
	const { user } = useUser();
	const { id } = useParams() as { id: string | undefined };

	if (!user) return null;

	return (
		<div className={styles.rightMenu}>
			<ProfileCard /> 
			<List type="followings" title="Followings" profileId={page === "profile" ? id : user.id} />
			<List type="followers" title="Followers" profileId={page === "profile" ? id : user.id} />
		</div>
	);
}
