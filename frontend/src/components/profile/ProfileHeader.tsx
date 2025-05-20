"use client";

import Image from "next/image";
import styles from "./profile.module.css";
import { useState } from "react";

function ProfileHeader() {
  const [followingAction, setFollowingAction] = useState(false);

  const handelClick = async () => {
    // e.preventDefault();

    setFollowingAction(!followingAction);

    try {
      const res = await fetch("http://localhost:8000/api/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // follower:"",
          // following:""
          followingAction: followingAction ? "follow" : "unfollow",
        }),
      });
      console.log("response: ", await res.json());
    } catch (error) {
      console.log("fetch error", error);
    }
  };

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
      <button
        className={`${styles.followBtn} ${
          followingAction ? styles.follow : styles.unfollow
        }`}
        onClick={handelClick}
      >
        Follow
      </button>
    </div>
  );
}
export default ProfileHeader;
