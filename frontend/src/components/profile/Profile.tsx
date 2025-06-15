"use client";

import Image from "next/image";
import styles from "./profile.module.css";
import { useState, useEffect } from 'react';
import { PostComponent } from "../posts/Post";
import { Profile } from "../types";
import { API_URL } from "@/lib/api_url";

import { useUser } from "@/context/UserContext";
import { createPortal } from "react-dom";






function UserProfile({ userId }: any) {
  console.log("dkhhhhaaalt");



  const [userData, setData] = useState<Profile | null>(null);
  const [userPosts, setPosts] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);


  function ChangeStatu() {
    setIsModalOpen((prev) => !prev);
  }
  const user = useUser();

  function IsUserLoged() {

    if (user.user?.id === userId) {
      return true
    }
    return false
  }

  function getOppositeOfAccountType(): string {
    return userData?.account_type === "public" ? "private" : "public";
  }
  async function handleStatu() {
    if (isLoading) return;

    console.log("userData?.account_type ", userData?.account_type);

    console.log("getOppositeOfAccountType()", getOppositeOfAccountType());

    setIsLoading(true);

    try {
      const res = await fetch(`http://localhost:8080/api/handleAccountStatu/${userId}`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: getOppositeOfAccountType() // "public" or "private"
        }),
      })
      const data = await res.json();
      await fetchData()
      ChangeStatu()
    } catch (error) {
      console.log("error", error);
    } finally {
      setIsLoading(false);
    }
  }






  async function fetchData() {
    try {
      const res = await fetch(`http://localhost:8080/api/profileData/${userId}`)
      const data = await res.json();
      console.log("data: hana jiiit", data);
      setData(data)

      console.log("dataaaaaaaaaaaa", userData?.about_me);
    } catch (error) {
      console.log("error", error);
    }
  }

  async function fetchPost() {
    try {
      const res = await fetch(`http://localhost:8080/api/profilePosts/${userId}`, {
        credentials: "include",
      })
      const posts = await res.json();
      console.log("posts", posts);
      setPosts(posts)

      console.log("userPosts", userPosts?.posts);
    } catch (error) {
      console.log("error", error);
    }
  }

  useEffect(() => {
    fetchData();
    fetchPost();
  }, [])

  if (!userData) return <p>loading ...</p>
  return <>
    <div className={styles.container}>
      <div className={styles.userInfo}>
        <div className={styles.image_btn}>
          <Image
            src={userData.profile_pic ? `${API_URL}/api/storage/avatars/${userData.profile_pic}` : `${API_URL}/api/storage/avatars/avatar.webp`}
            alt={`${userData.profile_pic}`} className={styles.userImageprofil} width={150} height={150} />
          {
            IsUserLoged() && (
              <button className={`${styles.accountStatus}`} onClick={ChangeStatu} > account staut </button>
            )
          }
        </div>

        <div className={styles.data}>
          <div >
            <div className={styles.username}>
              <span>{userData.first_name} {userData.last_name}</span>
              {
                !IsUserLoged() && (
                  <button className={`${styles.followBtn}`}>
                    Follow
                  </button>
                )
              }
            </div>
            <div className={styles.numbers}>
              <div className={styles.postsNumber}> {userPosts?.post_nbr} Posts</div>
              <a className={styles.followersNumber}>{userData.total_followers} Followers </a>
              <div className={styles.followingNumber}>{userData.total_followings} Following</div>
            </div>
          </div>
          <div className={styles.more_data}>
            {/* <span></span> */}

            <span>{userData.username} </span>
            <span>{userData.about_me}</span>
            <span>{userData.birthday}</span>
            <span>{userData.email}</span>
          </div>
        </div>
      </div>
      <section className={styles.posts}>
        <div className={styles.profile_posts}>
          {
            userPosts?.posts?.map((elem, i) => <PostComponent post={elem} key={elem.id} />)
          }
        </div>
      </section>
    </div>

    {
      isModalOpen && createPortal(
        <div className={styles.modalcontainer}>
          <div className={styles.modal}>
            <div className={styles.header}>
              <h3>Change Profile Status</h3>
              <button onClick={ChangeStatu} className={styles.closebtn}>&times;</button>
            </div>

            <div className={styles.content}>
              <p>Do you want to change your profile from <strong>{userData.account_type}</strong> to <strong>{getOppositeOfAccountType()}</strong>?</p>

              <div className={styles.info}>
                <div className={styles.statusbox}>
                  <span className={styles.icon}>🔒</span>
                  <div>
                    <h4>Private Profile</h4>
                    <p>Only you can see your posts and information</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button onClick={ChangeStatu} className={styles.cancelbtn}>Cancel</button>
              <button disabled={isLoading} onClick={handleStatu} className={styles.confirmbtn}>Change to {getOppositeOfAccountType()}</button>
            </div>
          </div>
        </div>,
        document.body
      )
    }
  </>
}

export default UserProfile;
