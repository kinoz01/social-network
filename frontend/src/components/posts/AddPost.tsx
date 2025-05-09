"use client";

import React from "react";
import styles from "./posts.module.css";
import { HandleCreation } from "@/apiService/posts/addPost";
import { MainDiv } from "./creation/mainDiv";
import { ShowUsers } from "./creation/users";
import { PostAudience } from "./creation/audience";

type PostParams = {
  isOpen: boolean;
  onClose: () => void
}

export default function AddPost(props: PostParams) {
  const [showAudiance, setShow] = React.useState(false)
  const [showUsers, setUsers] = React.useState(false)
  const [privacy, setPrivacy] = React.useState("public")
  const [selectedUsers, setSelectedUsers] = React.useState<string[]>([])

  const showUsersList = () => {
    setShow(showAudiance)
    setUsers(!showUsers)
  }

  const showCHoice = () => {
    setShow(true)
    // setUsers(true)
  }

  const handleBack = () => {
    setShow(false);
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
      {props.isOpen && (
        <div className={styles.formContainer}>
          <form className={styles.form} onSubmit={(e) => HandleCreation(e)}>
            {/* {!showAudiance ? */}
            <input type="hidden" name="privacy" value={privacy} />

            <div style={{ display: showAudiance || showUsers ? "none" : "block", width: "100%", boxSizing: "border-box", padding: "20px" }}>
              <MainDiv onClose={props.onClose} privacy={privacy} showCHoice={showCHoice} />
            </div>

            <div style={{ display: showAudiance && !showUsers ? "block" : "none" }}>
              <PostAudience onBack={handleBack} selectedPrivacy={privacy} onPrivacyChange={handleOnChange} />
            </div>

            <div style={{ display: showUsers ? "block" : "none" }}>
              <ShowUsers onBack={handleBack} onUserCHange={setSelectedUsers} />
            </div>

          </form>
        </div >
      )
      }
    </>
  )
}
