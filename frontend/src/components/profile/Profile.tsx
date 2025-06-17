"use client";

import Image from "next/image";
import styles from "./profile.module.css";
import { useState, useEffect } from 'react';
import { PostComponent } from "../posts/Post";
import { Profile } from "../types";
import { API_URL } from "@/lib/api_url";

import { useUser } from "@/context/UserContext";
import { createPortal } from "react-dom";
import FollowersList from "../menus/FollowersList";
import FollowingsList from "../menus/FollowingsList";







function UserProfile({ userId }: any) {
  console.log("dkhhhhaaalt");

  const [userData, setData] = useState<Profile | null>(null);
  const [userPosts, setPosts] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [statusUpdated, setStatusUpdated] = useState<boolean>(false);

  const [followers, setFollowers] = useState<boolean>(false)
  const [followings, setFollowings] = useState<boolean>(false)

  // function ChangeStatus() {
  //   setIsModalOpen((prev) => !prev);
  // }

  const user = useUser();

  // function IsUserLoged() {

  //   if (user.user?.id === userId) {
  //     return true
  //   }
  //   return false
  // }

  // function accoutType: string {
  const accoutType = userData?.account_type === "public" ? "private" : "public";
  // }

  async function handleStatus() {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const res = await fetch(`http://localhost:8080/api/handleAccountStatu/${userId}`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: accoutType // "public" or "private"
        }),
      })
      const data = await res.json();
      console.log("daaaaaaaaaaaaaaaaaaata: ", data);

      setStatusUpdated(prev => !prev);

      setIsModalOpen((prev) => !prev);
    } catch (error) {
      console.log("error", error);
    } finally {
      setIsLoading(false);
    }
  }



  async function fetchData() {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/profileData/${userId}`)
      const data = await res.json();
      setData(data)
    } catch (error) {
      console.log("error", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchPost() {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/profilePosts/${userId}`, {
        credentials: "include",
      })
      const posts = await res.json();
      setPosts(posts)
    } catch (error) {
      console.log("error", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const fetch = async () => {
      await fetchData();
      await fetchPost();
    }
    fetch()
  }, [statusUpdated])

  if (!userData) return <p>loading ...</p>
  return <>
    <div className={styles.container}>
      <div className={styles.userInfo}>
        <div className={styles.image_btn}>
          <Image
            src={userData.profile_pic ? `${API_URL}/api/storage/avatars/${userData.profile_pic}` : `${API_URL}/api/storage/avatars/avatar.webp`}
            alt={`${userData.profile_pic}`} className={styles.userImageprofil} width={150} height={150} />
          {
            user.user?.id === userId && (
              <button className={`${styles.accountStatus}`} onClick={() => setIsModalOpen((prev) => !prev)} > account staut </button>
            )
          }
        </div>

        <div className={styles.data}>
          <div >
            <div className={styles.username}>
              <span>{userData.first_name} {userData.last_name}</span>
              {
                user.user?.id !== userId && (
                  <button className={`${styles.followBtn}`}>
                    Follow
                  </button>
                )
              }
            </div>
            <div className={styles.numbers}>
              <div className={styles.postsNumber}> {userPosts?.post_nbr} Posts</div>
              <div onClick={() => {
                setFollowers(prev => !prev)
                setFollowings(false)

              }} className={styles.followersNumber}>{userData.total_followers} Followers </div>
              <div onClick={() => {
                setFollowings(prev => !prev)
                setFollowers(false)
              }} className={styles.followingNumber}>{userData.total_followings} Following</div>
            </div>
          </div>
          <div className={styles.more_data}>
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
      isModalOpen &&
      <>
        <div className={styles.modalcontainer}>
          <div className={styles.modal}>
            <div className={styles.header}>
              <h3>Change Profile Status</h3>
              <button onClick={() => setIsModalOpen((prev) => !prev)} className={styles.closebtn}>&times;</button>
            </div>
            <div className={styles.content}>
              <p>Do you want to change your profile from <strong>{userData.account_type}</strong> to <strong>{accoutType}</strong>?</p>

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
              <button onClick={() => setIsModalOpen((prev) => !prev)} className={styles.cancelbtn}>Cancel</button>
              <button disabled={isLoading} onClick={handleStatus} className={styles.confirmbtn}>Change to {accoutType}</button>
            </div>
          </div>
        </div>
      </>
    }
    {
      followers && 
      <div className={styles.followers}>
        <div>Followers</div>
        <FollowersList profileId={userId} />
      </div>
    }
    {
      followings && 
      <div className={styles.followings}>
        <div>Followings</div>
        <FollowingsList profileId={userId} />
      </div>
    }

  </>
}

export default UserProfile;
