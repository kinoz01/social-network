import Link from "next/link";
import styles from "./menus.module.css";
import ListItem from "./ListItem";
// import GroupCard from "./GroupCard";

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
  title: String;
}) {
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
          // Fetch all users
          <>
            <ListItem type={type} name={"Wayne Burton"} />
            <ListItem type={type} name={"Wayne Burton"} />
            <ListItem type={type} name={"Wayne Burton"} />
            <ListItem type={type} name={"Wayne Burton"} />
            <ListItem type={type} name={"Wayne Burton"} />
            <ListItem type={type} name={"Wayne Burton"} />
            <ListItem type={type} name={"Wayne Burton"} />
            <ListItem type={type} name={"Wayne Burton"} />
            <ListItem type={type} name={"Wayne Burton"} />
            <ListItem type={type} name={"Wayne Burton"} />
            <ListItem type={type} name={"Wayne Burton"} />
            <ListItem type={type} name={"Wayne Burton"} />
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
