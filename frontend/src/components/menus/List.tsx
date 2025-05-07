import Link from "next/link";
import styles from "./menus.module.css";
import ListItem from "./ListItem";
import FetchUsers from "../chat/fetchUsers";
// import { log } from "console";
// import GroupCard from "./GroupCard";

// function openChat(event: React.MouseEvent<HTMLDivElement>): void {
//   console.log("Clicked", event.currentTarget);
// }


function List({
  type,
  title,
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
}) {
  const users = FetchUsers()
  console.log(users);

  // function openChat(e:any) {
  //   console.log("Clicked", e.currentTarget);
  // }
  
  
  return (
    <div className={`${styles.List} ${styles[type]} `}>
      {/* TOP  */}
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
  console.log(user); // Inspect user properties

  return (
    <ListItem
      key={user.userId}  // Use UserId as the key
      type={type}
      name={user.first_name +" " + user.last_name}  // Concatenate with a space
      click={() => { console.log("clicked", { type, name }); }}
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
