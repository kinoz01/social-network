"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, MouseEvent, ReactNode } from "react";

import styles from "./menus.module.css";

import { User } from "@/lib/types";
import { addFollower } from "@/lib/followers";
import { API_URL } from "@/lib/api_url";

type ListTypes =
  | "friendRequests"
  | "followers"
  | "followings"
  | "suggestions"
  | "chat"
  | "group"
  | "event";

interface Props {
  type: ListTypes;
  name?: string;
  item?: User;
  loggedUser?: User | null;
}

function ListItem({ type, name, item, loggedUser }: Props) {
  const [isResponded, setResponded] = useState(false);

  const handleResponse = async (e: MouseEvent<HTMLButtonElement>) => {
    const action = e.currentTarget.value as "accepted" | "rejected";
    setResponded(true);

    await addFollower(
      {
        action,
        status: action,
        followerID: item?.id,
        followedId: String(loggedUser?.id),
      },
      "/api/followers/add",
    );
  };

  const profilePic = `${API_URL}/api/storage/avatars/${item?.profile_pic}`;

  const needsLink =
    type === "followers" || type === "followings" || type === "suggestions";

  const Wrapper = ({ children }: { children: ReactNode }) =>
    needsLink ? (
      <Link href={`/profile/${item?.id}`} className={styles.linkWrapper}>
        {children}
      </Link>
    ) : (
      <>{children}</>
    );

  /* ----------  render  ---------- */
  return !isResponded ? (
    <Wrapper>
      <div className={`${styles.listItem} ${styles[type]}`}>
        <div className={styles.listItemInfo}>
          <Image
            className={styles.userIcon}
            src={profilePic}
            alt={`${item?.first_name}'s avatar`}
            width={40}
            height={40}
          />
          <span className={styles.listItemName}>
            {item ? `${item.first_name} ${item.last_name}` : name}
          </span>
        </div>

        {type === "friendRequests" && (
          <div className={styles.options}>
            <button onClick={handleResponse} value="accepted">
              Accept
            </button>
            <button onClick={handleResponse} value="rejected">
              Reject
            </button>
          </div>
        )}
      </div>
    </Wrapper>
  ) : null;
}

export default ListItem;
