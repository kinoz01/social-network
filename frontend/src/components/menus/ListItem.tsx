"use client";
import Image from "next/image";
import styles from "./menus.module.css";
import {
  AcceptIcon,
  AddFriendIcon,
  ChatIcon,
  RejectIcon,
  UserIcon,
} from "../icons";
import { useState } from "react";
import { User } from "@/lib/types";
import { addFollower } from "@/lib/followers";
import Link from "next/link";
import { API_URL } from "@/lib/api_url";

function ListItem({
  type,
  name,
  click,
  
}: {
  type:
    | "friendRequests"
    | "followers"
    | "followings"
    | "suggestions"
    | "chat"
    | "group"
    | "event";
  name?: String;
  item?: User;
  loggedUser?: User | null;
}) {
  const [isResponed, setResponed] = useState(false);

  const handleResponse = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const action = e.currentTarget.value;
    console.log("bidy: ", {
      action: action,
      status: action,
      followedID: item?.id,
      followerId: String(loggedUser?.id),
    });
    setResponed(true);

    const res = await addFollower(
      {
        action: action,
        status: action,
        followerID: item?.id,
        followedId: String(loggedUser?.id),
      },
      "/api/followers/add"
    );

    console.log("follow res: ", res);
  };

  const profilePic = `${API_URL}/api/storage/avatars/${item?.profile_pic}`;

  return (
    <div className={`${styles.ListItem} ${styles[type]}`} onClick={click}>
      <div className={styles.ListItemInfo}>
        {type !== "groups" ? (
          <>
            <Image
              className={styles.userIcon}
              src={profilePic}
              alt=""
              width={40}
              height={40}
            />
          </>
        ) : null}
        <span className={styles.ListItemName}>{name}</span>
      </div>
      <div className={styles.options}>
        {type === "friendRequests" ? (
          <>
            <AcceptIcon />
            <RejectIcon />
          </>
        ) : type === "suggestions" ? (
          <>
            <AddFriendIcon />
            <RejectIcon />
          </>
        ) : type === "followers" || type === "followings" ? (
          <>
            <ChatIcon />
            {/* UNFOLLOW OCON */}
            <RejectIcon />
          </>
        ) : type === "chat" || type === "group" || type ==="event" ? null : type ===
          "groups" ? (
          <>
            <ChatIcon />
            {/* UNFOLLOW OCON */}
            <RejectIcon />
          </>
        ) : null}
      </div>
    </div>
  );
}

export default ListItem;
