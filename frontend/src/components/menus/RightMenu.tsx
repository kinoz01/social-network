"use client";
import styles from "./menus.module.css";
import List from "./List";
import { User } from "@/lib/types";
import { useUser } from "@/context/UserContext";

function RightMenu() {
  const { user: loggedUser } = useUser();
  
  return (
    <div className={styles.rightMenu}>
      <List type="followings" title="Followings" loggedUser={loggedUser} />
      <List type="followers" title="Followers" loggedUser={loggedUser} />
    </div>
  );
}

export default RightMenu;
