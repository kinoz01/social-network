"use client";

import styles from "./menus.module.css";
import ProfileCard from "./ProfileCrad";
import List from "./List";
import { useUser } from "@/context/UserContext";

function LeftMenu({
  type,
}: {
  type: "home" | "chat" | "profile" | "group" | "groups";
}) {
  const { user: loggedUser } = useUser();
  return (
    <div className={`${styles.leftMenu} ${styles[type]}`}>
      {type == "home" ? (
        <>
          <ProfileCard user={loggedUser} />
          <List type="suggestions" title="Suggestions" loggedUser={loggedUser} />
        </>
      ) : type === "chat" ? (
        <>
          <List type="chat" title="Chat" loggedUser={loggedUser} />
        </>
      ) : null}
    </div>
  );
}

export default LeftMenu;
