"use client";

import styles from "./menus.module.css";
import ProfileCard from "./ProfileCard";
import List from "./List";
import { useUser } from "@/context/UserContext";

function LeftMenu() {
  const { user: loggedUser } = useUser();
  return (
    <div className={`${styles.leftMenu}`}>
        <>
          <ProfileCard /> 
          <List type="suggestions" title="Suggestions" loggedUser={loggedUser} />
        </>
    </div>
  );
}

export default LeftMenu;
