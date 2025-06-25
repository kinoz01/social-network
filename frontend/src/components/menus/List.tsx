"use client";

import Link from "next/link";
import FollowersList from "./FollowersList";
import FollowingsList from "./FollowingsList";
import FriendRequestList from "./FriendRequest";
import SuggestionsList from "./SuggestionsList";
import { User } from "@/lib/types";
import styles from "./menus.module.css";
import { useFollowSync } from "@/context/FollowSyncContext";

type ListProps = {
  type: "friendRequests" | "followers" | "followings" | "suggestions";
  title: string;
  profileId?: string;
  loggedUser?: User | null;
};

export default function List({ type, title, profileId, loggedUser }: ListProps) {

  const { version } = useFollowSync()

  // const seeAll =
  //   type === "followers" ||
  //     type === "followings" ||
  //     type === "friendRequests" ? (
  //     <Link href={`/profile/${profileId ?? loggedUser?.id}`} className={styles.link}>
  //       See all
  //     </Link>
  //   ) : null;

  return (
    <div className={`${styles.list} ${styles[type]}`}>
      {/* header */}
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {/* {seeAll} */}
      </div>

      {/* list */}
      {type === "followers" ? (
        <FollowersList key={version} profileId={profileId} />
      ) : type === "followings" ? (
        <FollowingsList key={version} profileId={profileId} />
      ) : type === "friendRequests" ? (
        <FriendRequestList key={version} />
      ) : type === "suggestions" ? (
        <SuggestionsList key={version} />
      ) : null}
    </div>
  );
}