"use client";

import Image from "next/image";
import styles from "./profile.module.css";
import { useState, useEffect } from 'react';
import { PostComponent } from "../posts/Post";
import { Profile } from "../types";
import { API_URL } from "@/lib/api_url";

import { useUser } from "@/context/UserContext";

//to-do
//accountstatu
//profilpublic or priv

function UserProfile({ userId }: any) {
  const [userData, setData] = useState<Profile | null>(null);
  // const user = useUser();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`http://localhost:8080/api/profile/${userId}`, {
          credentials: "include",
        })
        const data = await res.json();
        console.log("hana jiit", data);
        console.log("posts", data.posts);
        setData(data)

        console.log("sssss", userData, typeof userData?.posts);
      } catch (error) {
        console.log("error", error);
      }
    }
    fetchData();
  }, [])

  if (!userData) return <p>no user found</p>
  console.log("1", userData.posts);
  return (
    <div className={styles.profileHeader}>
      <div className={styles.userInfo}>
        <div className={styles.image_btn}>
          <Image
            src={userData.profile_pic ? `${API_URL}/api/storage/avatars/${userData.profile_pic}` : `${API_URL}/api/storage/avatars/avatar.webp`}
            alt={`${userData.profile_pic}`} className={styles.userImageprofil} width={150} height={150} />
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
            userData.posts?.map((elem, i) => <PostComponent post={elem} key={elem.id} />)
          }
        </div>
      </section>
    </div>
  );


}

export default UserProfile;


function ChangeStatu() {

}
