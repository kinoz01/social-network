"use client";

import styles from "./profile.module.css";
import { useEffect, useState } from "react";
import { User } from "@/lib/types";
import { getProfileInfo, handleFollow, isUserFollowed } from "@/lib/followers";
import { useUser } from "@/context/UserContext";
import Loading from "../Loading";
import { useWS } from "@/context/wsClient";

function FollowButton({ profileId }: { profileId: string }) {
  const { user: loggedUser } = useUser();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isFollowed, setIsFollowed] = useState<boolean>(false);
  const [followingAction, setFollowingAction] = useState<Boolean>(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { newNotification } = useWS();

  // Fetch profile info only when loggedUser is available
  useEffect(() => {
    const fetchProfileInfo = async () => {
      const profileInfo = await getProfileInfo(profileId);
      setProfileUser(profileInfo);
    };

    fetchProfileInfo();
  }, [profileId]);


  // Fetch follow status only when profileUser is ready
  useEffect(() => {
    const checkFollowStatus = async () => {
      const res = await isUserFollowed(profileId);
      setIsFollowed(res === "isFollowed" ? true : false);

      setFollowingAction(res === "noRelationship" ? false : true);
      setIsDataLoading(false);
    };

    checkFollowStatus();
  }, [loggedUser, profileUser]);

  // Still loading user data
  const isPublic = profileUser?.account_type === "public";
  let buttonClass = followingAction ? "unfollow" : "follow";
  let buttonText = "Follow";

  if (isDataLoading) {
    buttonText = "Loading...";
  } else if (followingAction) {
    if (isPublic) {
      buttonText = "UnFollow";
    } else {
      buttonText = isFollowed ? "unFollow" : "Friend Request Sent";
    }
  }


  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!loggedUser) return;

    if (isPublic) {
      setFollowingAction(!followingAction);
      setIsFollowed(false);
      await handleFollow(profileUser, loggedUser, followingAction, isFollowed);
    } else {
      if (e.currentTarget.textContent === "Friend Request Sent") return;

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

    newNotification(loggedUser, profileId);
  };

  return (
    <>
      {
        profileUser &&
        profileId !== String(loggedUser?.id) && (
          isDataLoading ? (
            <div className={styles.followBtn}>
              <Loading />
            </div>
          ) : (

            <button
              className={`${styles.followBtn} ${styles[buttonClass]}`}
              onClick={handleClick}
            >
              {isDataLoading ? <Loading /> : buttonText}
            </button>
          ))
      }
    </>
  );
}

export default FollowButton;
