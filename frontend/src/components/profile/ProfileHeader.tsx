"use client";

import Image from "next/image";
import styles from "./profile.module.css";
import { useEffect, useState } from "react";

export interface Followers {
  totalFollowers: number,
  totalFollowing: number,
  totalPosts: number,
  first_name: string,
  last_name: string
}
function ProfileHeader() {
  const [followingAction, setFollowingAction] = useState(false);
  const [followers, setFollowers] = useState<Followers | null>(null)
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
  useEffect(() => {
    const getTotalFollwers = async() => {
      const followers = await fetchFollowers()
      setFollowers(followers)
    }
    getTotalFollwers()
  }, [])
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
        <div className={styles.username}>{`${followers?.first_name} ${followers?.last_name}`}</div>
        <div className={styles.numbers}>
          <div className={styles.followersNumber}>Followers {followers?.totalFollowers}</div>
          <div className={styles.followingNumber}>Following {followers?.totalFollowing}</div>

          <div className={styles.postsNumber}>Posts {followers?.totalPosts}</div>
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

const fetchFollowers = async() => {
  const followersRequest = await fetch('http://localhost:8080/api/followers', {
    method: 'GET',
    credentials: 'include'
  })
  console.log(followersRequest);
  const followersRes = await followersRequest.json()
  console.log(followersRes);
  return followersRes
  


  
}
