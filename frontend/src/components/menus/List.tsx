"use client";

import { useState } from "react";
import FollowersList from "./FollowersList";
import FollowingsList from "./FollowingsList";
import FriendRequestList from "./FriendRequest";
import SuggestionsList from "./SuggestionsList";
import { User } from "@/lib/types";
import styles from "./menus.module.css";

type ListProps = {
  type: "friendRequests" | "followers" | "followings" | "suggestions";
  title: string;
  profileId?: string;
  loggedUser?: User | null;
};

export default function List({
  type,
  title,
  profileId,
  loggedUser,
}: ListProps) {
  /* modal flag */
  const [showModal, setShow] = useState(false);
  const open = () => setShow(true);
  const close = () => setShow(false);

  /* header "See all" */
  const seeAll =
    type === "followers" ||
      type === "followings" ||
      type === "friendRequests" ? (
      <div className={styles.link} onClick={open}>
        See all
      </div>
    ) : null;

  /* ───────── render ───────── */
  return (
    <>
      <div className={`${styles.list} ${styles[type]}`}>
        {/* header */}
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          {seeAll}
        </div>

        {/* compact list */}
        {type === "followers" ? (
          <FollowersList profileId={profileId} />
        ) : type === "followings" ? (
          <FollowingsList profileId={profileId} />
        ) : type === "friendRequests" ? (
          <FriendRequestList />
        ) : type === "suggestions" ? (
          <SuggestionsList />
        ) : null}
      </div>

      {/* modal overlays */}
      {showModal && type === "followers" && (
        <FollowersList  profileId={profileId} />
      )}
      {showModal && type === "followings" && (
        <FollowingsList  profileId={profileId} />
      )}
      {showModal && type === "friendRequests" && (
        <FriendRequestList modal onClose={close} />
      )}
    </>
  );
}
