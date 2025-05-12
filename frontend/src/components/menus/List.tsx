import Link from "next/link";
import styles from "./menus.module.css";
import ListItem from "./ListItem";
import FetchUsers from "../chat/fetchUsers";
import {  User } from "@/lib/user";
// import { fetchMessages } from "@/lib/message";
// import Chat from "../chat/Chat";
// import { useState } from "react";




function List({
  type,
  title,
  selectedUser
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
  // const [userCliked, setUserClicked] = useState<User | null>(null)
  
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
          {users?.map((user) => {
            // console.log(user.id, "dgdgdddddddddddgdfgd");
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
