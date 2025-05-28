"use client";

import Image from "next/image";
import styles from "./profile.module.css";
import { useState, useEffect } from 'react';
import { PostComponent } from "../posts/Post";
import { Post, Profile } from "../posts/Feed";


function UserProfile() {
  const [userData, setData] = useState<Profile | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("http://localhost:8080/api/profil", {
          credentials: "include",
        })
        const data = await res.json();
        console.log("hana jiit",data);
        setData(data)
        
        console.log("--------------",userData, typeof userData?.posts);
      } catch (error) {
        console.log("error", error);
      }
    }
    fetchData();
  }, [])
  if (!userData) return <p>no user found</p>

  return (

    <div className={styles.profileHeader}>
      <div className={styles.userInfo}>
        <div className={styles.image_btn}>
          <Image
            src="https://images.unsplash.com/photo-1740768081811-e3adf4af4efe?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDExOHxibzhqUUtUYUUwWXx8ZW58MHx8fHx8"
            alt="User Image" className={styles.userImageprofil} width={150} height={150} />

          <button className={`${styles.accountStatus}`} onClick={ChangeStatu} > account staut </button>
        </div>

        <div className={styles.data}>
          <div >
            <div className={styles.username}>
              <span>{userData.username} </span>
              {/* <button className={`${styles.followBtn}`}>
                Follow
              </button> */}
            </div>
            <div className={styles.numbers}>
              <div className={styles.postsNumber}> {userData.post_nbr} Posts</div>
              <div className={styles.followersNumber}>Followers ???</div>
              <div className={styles.followingNumber}>Following ???</div>
            </div>
          </div>
          <div className={styles.more_data}>
            <span></span>
            <span>{userData.first_name} {userData.last_name}</span>
            <span>{userData.about_me}</span>
            <span>{userData.birthday}</span>
            <span>{userData.email}</span>
          </div>
        </div>
      </div>
      <section className={styles.posts}>
        <div className={styles.profile_posts}>
          {
            userData.posts.map((elem, i) => <PostComponent post={elem} key={i}/> )
          }
        </div>
      </section>
    </div>
  );
}

export default UserProfile;


function ChangeStatu() {

}
