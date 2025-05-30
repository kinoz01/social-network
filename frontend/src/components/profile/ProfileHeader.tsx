"use client";

import Image from "next/image";
import styles from "./profile.module.css";
import { useEffect, useState } from "react";
import { User } from "@/lib/types";
import { getProfileInfo, handleFollow, isUserFollowed } from "@/lib/followers";
import { useUser } from "@/context/UserContext";
import { useParams } from "next/navigation";
import Loading from "../Loading";

function ProfileHeader({ id }: { id: string }) {
  const { user: loggedUser } = useUser();
  const { id: profileId } = useParams() as { id: string };
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isFollowed, setIsFollowed] = useState<boolean>(false);
  const [followingAction, setFollowingAction] = useState<Boolean>(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Fetch profile info only when loggedUser is available
  useEffect(() => {
    const fetchProfileInfo = async () => {
      const profileInfo = await getProfileInfo(id);
      console.log("proingo", profileInfo);
      setProfileUser(profileInfo);
    };

    fetchProfileInfo();
  }, [loggedUser, profileId]);

  console.log("profile: ", profileUser, loggedUser);

  // Fetch follow status only when profileUser is ready
  useEffect(() => {
    const checkFollowStatus = async () => {
      const res = await isUserFollowed(id);
      console.log("reeeeeeeeeeeeeeeeeeeeeeeeees: ", res);
      setIsFollowed(res === "isFollowed" ? true : false);
      console.log(
        "is followed res: ",
        res,
        res === "isFollowed" ? true : false
      );
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

  const handleClick = async () => {
    if (!loggedUser) return;

    if (isPublic) {
      setFollowingAction(!followingAction);
      setIsFollowed(false);
      await handleFollow(profileUser, loggedUser, followingAction, isFollowed);
    } else {
      // if (e.currentTarget.textContent === "Friend Request Sent") return;

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
  };

  console.log("profileeeeeee: ", isFollowed, profileUser);

  // if (isDataLoading) {
  //   return <Loading />;
  // }

  return (
    <div className={styles.profileHeader}>
      <div className={styles.userInfo}>
        <Image
          src="https://images.unsplash.com/photo-1740768081811-e3adf4af4efe?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDExOHxibzhqUUtUYUUwWXx8ZW58MHx8fHx8"
          alt="User Image"
          className={styles.userImage}
          width={150}
          height={150}
        />
        <div className={styles.username}>Edward Gabriel May</div>
        <div className={styles.numbers}>
          <div className={styles.followersNumber}>Followers 500</div>
          <div className={styles.followingNumber}>Following 50</div>
          <div className={styles.postsNumber}>Posts 50</div>
        </div>
      </div>

      {isDataLoading ? (
        <div className={styles.followBtn}>
          <Loading />
        </div>
      ) : (
        profileUser &&
        id !== String(loggedUser?.id) && (
          <button
            className={`${styles.followBtn} ${styles[buttonClass]}`}
            onClick={handleClick}
          >
            {isDataLoading ? <Loading /> : buttonText}
          </button>
        )
      )}
    </div>
  );
}

export default ProfileHeader;
