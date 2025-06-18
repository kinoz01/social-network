"use client";

import styles from "./profileHeader.module.css";
import { useEffect, useState } from "react";
import { User } from "@/lib/types";
import { handleFollow, isUserFollowed } from "@/lib/followers";
import { useUser } from "@/context/UserContext";
import Loading from "../Loading";
import { useWS } from "@/context/wsClient";
import { useFollowSync } from "@/context/FollowSyncContext";

export default function FollowButton({ profileUser }: { profileUser: User }) {

  const { user: loggedUser } = useUser();
  const [isFollowed, setIsFollowed] = useState<boolean>(false);
  const [followingAction, setFollowingAction] = useState<Boolean>(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { refresh } = useFollowSync();

  // Fetch follow status only when profileUser is ready
  useEffect(() => {
    const checkFollowStatus = async () => {
      const res = await isUserFollowed(profileUser.id);
      
      setIsFollowed(res === "isFollowed" ? true : false);
      
      setFollowingAction(res === "noRelationship" ? false : true);
      setIsDataLoading(false);
      console.log("11111111111111111111111111111111111",res);
    };

    checkFollowStatus();
  }, [loggedUser, profileUser]);

  // Still loading user data
  const isPublic = profileUser?.account_type === "public";
  let buttonText = "Follow";

  if (isDataLoading) {
    buttonText = "Loading...";
    console.log("2222222222222222222222222222222222");
  } else if (followingAction) {
    console.log("3333333333333333333333333333");
    if (isPublic) {
      buttonText = "UnFollow";
    } else {
      buttonText = isFollowed ? "unFollow" : "pending";
    }
  }

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log("///////////////////////////////////////---->");
    if (!loggedUser) return;

    if (isPublic) {
      setFollowingAction(!followingAction);
      setIsFollowed(false);
      await handleFollow(profileUser, loggedUser, followingAction, isFollowed);
    } else {

      if (e.currentTarget.textContent === "pending") return;

      if (isFollowed) {
        setIsFollowed(false);
        setFollowingAction(false);
        await handleFollow(profileUser, loggedUser, true, isFollowed);
      } else {
        setFollowingAction(true);
        setIsFollowed(false);
        await handleFollow(profileUser, loggedUser, false, isFollowed);
      }
    }
    refresh()
  };

  return (
    <>
      {
        profileUser && profileUser.id !== loggedUser?.id && (
          isDataLoading ? (
            <div className={styles.followBtn}>
              <Loading />
            </div>
          ) : (
            <button
              className={`${styles.cta} ${!isPublic && followingAction && !isFollowed ? styles.pending : ""}`}
              onClick={handleClick}
              disabled={!isPublic && followingAction && !isFollowed}
            >
              {isDataLoading ? <Loading /> : buttonText}
            </button>
          ))
      }
    </>
  );
}

