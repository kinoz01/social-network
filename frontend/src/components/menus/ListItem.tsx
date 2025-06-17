"use client";
import Image from "next/image";
import styles from "./menus.module.css";
import { useState } from "react";
import { addFollower } from "@/lib/followers";
import Link from "next/link";
import { User } from "../types";

function ListItem({
  type,
  item,
  loggedUser,
}: {
  type:
    | "friendRequests"
    | "followers"
    | "followings"
    | "suggestions"
    | "chat"
    | "group"
    | "event";
  item?: User;
  loggedUser?: User | null;
}) {
  const [isResponed, setResponed] = useState(false);

  const handleResponse = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const action = e.currentTarget.value;
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

  const profilePic = `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${item?.profile_pic}`;

  return (
    <>
      {!isResponed && (
        <div
          className={`${styles.listItem} ${styles[type]}`}
          // onClick={handelEvent}
        >
          <div className={styles.listItemInfo}>
            <Image
              className={styles.userIcon}
              src={profilePic}
              alt=""
              width={40}
              height={40}
            />
            <span className={styles.listItemName}>
              {item?.first_name + " " + item?.last_name}
            </span>{" "}
          </div>
          {type !== "chat" &&
            (type === "friendRequests" ? (
              <div className={styles.options}>
                <button onClick={handleResponse} value="accepted">
                  Accept
                </button>
                <button onClick={handleResponse} value="rejected">
                  Reject
                </button>
              </div>
            ) : type === "suggestions" ? (
              <Link href={`/profile/${item?.id}`} className={styles.profileBtn}>
                <button>View Profile</button>
              </Link>
            ) : type === "followers" || type === "followings" ? (
              <Link href={`/profile/${item?.id}`} className={styles.profileBtn}>
                <button>View Profile</button>
              </Link>
            ) : null)}
        </div>
      )}
    </>
  );
}

export default ListItem;