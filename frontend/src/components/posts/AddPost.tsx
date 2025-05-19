"use client";

import React from "react";
import styles from "./posts.module.css";
import { MainDiv } from "./creation/mainDiv";
import { ShowUsers } from "./creation/users";
import { PostAudience } from "./creation/audience";
import { useEffect, useState } from "react";
import { Post, User } from "./Feed";
import { HandleCreation } from "@/apiService/posts/savePost";

type PostParams = {
  isOpen?: boolean;
  onClose: () => void;
  onSubmit: (post: Omit<Post, "id">) => void;
}

async function getUser(): Promise<User | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/userInfo`, {
      credentials: "include",
      cache: "no-store",
    })

    if (!res.ok) {
      console.error("failed to fetch user", res.status)
      return null
    }

    const data: User = await res.json()
    return data
  } catch (error) {
    console.error("Error fetching user", error)
    return null
  }
}

export const NewPOst = ({ onClose, onSubmit }: PostParams) => {
  const [showAudiance, setShow] = useState(false)
  const [showUsers, setUsers] = useState(false)
  const [privacy, setPrivacy] = useState("public")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUser()
      setUser(userData)
    }
    fetchUser()
  }, [])
  console.log("------->", user)
  if (!user) {
    // throw new Error("user not exist")
    return
  }
  const showUsersList = () => {
    setShow(showAudiance)
    setUsers(!showUsers)
  }

  const showCHoice = () => {
    setShow(true)
    // setUsers(true)
  }

  const handleBack = () => {
    setShow(false)
    setUsers(false)
  }

  const handleOnChange = (value: string) => {
    setPrivacy(value)
    if (value === "private") {
      showUsersList()
    }
  }

  return (
    <>
      {(
        <div className={styles.formContainer}>
          <form className={styles.form} onSubmit={(e) => HandleCreation({ e, onClose, onSubmit, user })}>
            {/* {!showAudiance ? */}
            <input type="hidden" name="privacy" value={privacy} />

            <div style={{ display: showAudiance || showUsers ? "none" : "block", width: "100%", boxSizing: "border-box", padding: "20px", overflow: "auto" }}>
              <MainDiv onClose={onClose} privacy={privacy} showCHoice={showCHoice} />
            </div>

            <div style={{ display: showAudiance && !showUsers ? "block" : "none", overflow: "auto" }}>
              <PostAudience onBack={handleBack} selectedPrivacy={privacy} onPrivacyChange={handleOnChange} />
            </div>

            <div style={{ display: showUsers ? "block" : "none", overflow: "auto" }}>
              <ShowUsers onBack={handleBack} onUserCHange={setSelectedUsers} />
            </div>

          </form>
        </div >
      )
      }
    </>
  )
}
