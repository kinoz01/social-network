"use client";

import styles from "./menus.module.css";
import ProfileCard from "./ProfileCard";
import List from "./List";
import { useUser } from "@/context/UserContext";
import FriendRequestList from "./FriendRequest";

function LeftMenu({ className = "" }: {className?: string}) {
  const { user: loggedUser } = useUser();
  return (
    <div className={`${styles.leftMenu} ${className}`}>
        <>
          <FriendRequestList />
          <List type="suggestions" title="Suggestions" loggedUser={loggedUser} />
        </>
    </div>
  );
}

export default LeftMenu;
