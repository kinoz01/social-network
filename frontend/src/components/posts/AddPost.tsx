"use client";

import React from "react";
import styles from "./posts.module.css";
import { MainDiv } from "./creation/mainDiv";
import ShowUsers from "./creation/users";
import { PostAudience } from "./creation/audience";
import { useState } from "react";
import { HandleCreation } from "@/apiService/posts/savePost";
import { User, Post } from "../types";

type PostParams = {
  isOpen?: boolean;
  onClose: () => void;
  onSubmit: (post: Post) => void;
  userData: User | null
}

export const NewPOst = ({ onClose, onSubmit, userData }: PostParams) => {
  const [showAudiance, setShow] = useState(false)
  const [showUsers, setUsers] = useState(false)
  const [privacy, setPrivacy] = useState("public")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  if (!userData) {
    // throw new Error("user not exist")
    return
  }
  
  const showUsersList = () => {
    setShow(showAudiance)
    setUsers(!showUsers)
  }

  const showCHoice = () => {
    setShow(true)
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
          <form className={styles.form} onSubmit={(e) => HandleCreation({ e, onClose, onSubmit, userData })}>
            {/* {!showAudiance ? */}
            <input type="hidden" name="privacy" value={privacy} />

            <div style={{ display: showAudiance || showUsers ? "none" : "block", width: "100%", boxSizing: "border-box", padding: "20px", overflow: "auto", scrollbarWidth: "none" }}>
              <MainDiv onClose={onClose} privacy={privacy} showCHoice={showCHoice} userName={userData.first_name} />
            </div>

            <div style={{ display: showAudiance && !showUsers ? "block" : "none", overflow: "auto", scrollbarWidth: "none" }}>
              <PostAudience onBack={handleBack} selectedPrivacy={privacy} onPrivacyChange={handleOnChange} />
            </div>

            <div style={{ display: showUsers ? "block" : "none", overflow: "auto", scrollbarWidth: "none" }}>
              <ShowUsers onBack={handleBack} onUserCHange={setSelectedUsers} userID={userData.id} />
            </div>

          </form>
        </div >
      )
      }
    </>
  )
}
