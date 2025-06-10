"use client";

import Image from "next/image";
import styles from "./profile.module.css";
import { useState, useEffect } from 'react';
import { PostComponent } from "../posts/Post";
import { Profile } from "../types";
import { API_URL } from "@/lib/api_url";

import { useUser } from "@/context/UserContext";
import { createPortal } from "react-dom";

//to-do


function UserProfile({ userId }: any) {



  const [userData, setData] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);


  function ChangeStatu() {
    setIsModalOpen((prev) => !prev);
  }
  const user = useUser();
  function IsUserLoged() {
    // console.log("user=====ii=", user.user?.id);
    // console.log("userId", userId);
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
      const res = await fetch(`http://localhost:8080/api/profile/${userId}`,{
       method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logeduser_id: user.user?.id, // "public" or "private"
        }),
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

  useEffect(() => {
    fetchData();
  }, [])

  if (!userData) return <p>no user found</p>
  return <>
    <div className={styles.profileHeader}>
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
              <span>{userData.username} </span>
            {
              ! IsUserLoged() && (
              <button className={`${styles.followBtn}`}>
                Follow
              </button>
              )
            }
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
