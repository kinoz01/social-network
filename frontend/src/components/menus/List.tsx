import Link from "next/link";
import styles from "./menus.module.css";
import ListItem from "./ListItem";
import { User } from "@/lib/types";
import FollowersList from "./FollowersList";
import FollowingsList from "./FollowingsList";
import FriendRequestList from "./FriendRequest";
import SuggestionsList from "./SuggestionsList";

function List({
  type,
  title,
  loggedUser,
}: {
  type: "friendRequests" | "followers" | "followings" | "suggestions" | "chat";
  title: String;
  loggedUser: User | null;
}) {
  return (
    <div className={`${styles.list} ${styles[type]} `}>
      {/* TOP  */}
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
          // Fetch all users
          <>
            <ListItem type="chat" name={"Wayne Burton"} />
            <ListItem type="chat" name={"Wayne Burton"} />
            <ListItem type="chat" name={"Wayne Burton"} />
            <ListItem type="chat" name={"Wayne Burton"} />
            <ListItem type="chat" name={"Wayne Burton"} />
            <ListItem type="chat" name={"Wayne Burton"} />
            <ListItem type="chat" name={"Wayne Burton"} />
            <ListItem type="chat" name={"Wayne Burton"} />
            <ListItem type="chat" name={"Wayne Burton"} />
            <ListItem type="chat" name={"Wayne Burton"} />
            <ListItem type="chat" name={"Wayne Burton"} />
            <ListItem type="chat" name={"Wayne Burton"} />
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
