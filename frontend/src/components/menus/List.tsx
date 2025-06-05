"use client"
import Link from "next/link";
import styles from "./menus.module.css";
import ListItem from "./ListItem";
import FetchUsers from "../chat/fetchUsers";
import {  getUser, User } from "@/lib/user";
import { useEffect, useState } from "react";

function List({
  type,
  title,
  selectedUser,
  // currentUser
}: {
  type: "friendRequests" | "followers" | "followings" | "suggestions" | "chat";
  title: String;
  loggedUser: User | null;
}) {
  const users = FetchUsers()
  console.log(users);  
  const [currentUser, setCurrentUser] = useState<User|null>(null)
      
          useEffect(() => {
              const getCurrentUser = async() => {
                  const loggedUser = await getUser()
                  setCurrentUser(loggedUser)
              }
              getCurrentUser()
          },[])
  const filterdUsers = users?.filter(user => user.id != currentUser?.id)
  console.log(filterdUsers, currentUser?.id);
  
  return (
    <div className={`${styles.List} ${styles[type]} `}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {type === "friendRequests" ? (
          <>
            <Link
              className={styles.link}
              href={`/notifications/${loggedUser?.id}`}
            >
              See all
            </Link>
          </>
        ) : type === "followers" || type === "followings" ? (
          <>
            <Link className={styles.link} href={`/profile/${loggedUser?.id}`}>
              See all
            </Link>
          </>
        ) : null}
      </div>
      <div className={styles.users}>
        {type === "chat" ? (
          <>
          {filterdUsers?.map((user) => {

            return (
              <ListItem
                key={user.id} 
                type={type}
                name={user.first_name +" " + user.last_name} 
                click={() => selectedUser?.(user)}
                />
              );
            })}
          </>
        ) : type === "followers" ? (
          <FollowersList />
        ) : type === "followings" ? (
          <FollowingsList />
        ) : type === "suggestions" ? (
          <SuggestionsList />
        ) : type === "friendRequests" ? (
          <FriendRequestList loggedUser={loggedUser} />
        ) : null}
      </div>
    </div>
  );
}




export default List;
