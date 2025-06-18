"use client";

import styles from "./menus.module.css";
import ProfileCard from "./ProfileCard";
import List from "./List";
import { useUser } from "@/context/UserContext";
import FriendRequestList from "./FriendRequest";
import UserSearchMenu from "./UsersSearch";

function LeftMenu({ className = "" }: { className?: string }) {
  const { user: loggedUser } = useUser();
  return (
    <div className={`${styles.leftMenu} ${className}`}>
      <>
        <List type="friendRequests" title="Follow Requests" />
        <List type="suggestions" title="Suggestions" loggedUser={loggedUser} />
      </>
    </div>
  );
}

export default LeftMenu;
