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
  type:
    | "friendRequests"
    | "followers"
    | "followings"
    | "suggestions"
    | "chat"
    | "group"
    | "groups"
    | "event";
  title: string;
  selectedUser?: (user:User) => void;
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
  
  return (
    <div className={`${styles.List} ${styles[type]} `}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {type === "friendRequests" ? (
          <>
            <Link className={styles.link} href="\notifications">
              See all
            </Link>
          </>
        ) : type === "followers" || type === "followings" ? (
          <>
            <Link className={styles.link} href="\profile">
              See all
            </Link>
          </>
        ) : null}
      </div>
      <div className={type !== "groups" ? styles.users : styles.groups}>
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
        
        ) : type === "groups" ? (
          <>
            <ListItem type="groups" name={"zone01"}/>
            <ListItem type="groups" name={"zone01"}/>
            <ListItem type="groups" name={"zone01"}/>
            <ListItem type="groups" name={"zone01"}/>
            <ListItem type="groups" name={"zone01"}/>
            <ListItem type="groups" name={"zone01"}/>
            <ListItem type="groups" name={"zone01"}/>
            <ListItem type="groups" name={"zone01"}/>
            <ListItem type="groups" name={"zone01"}/>
            <ListItem type="groups" name={"zone01"}/>
            <ListItem type="groups" name={"zone01"}/>
            <ListItem type="groups" name={"zone01"}/>
          </>
        ) : (
          // Fetch just a few users
          <>
            <ListItem type={type} name={"Wayne Burton"} />
            <ListItem type={type} name={"Wayne Burton"} />
            <ListItem type={type} name={"Wayne Burton"} />
            <ListItem type={type} name={"Wayne Burton"} />
          </>
        )}
      </div>
    </div>
  );
}




export default List;
