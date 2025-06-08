import Link from "next/link";
import styles from "./menus.module.css";
import FollowersList from "./FollowersList";
import FollowingsList from "./FollowingsList";
import FriendRequestList from "./FriendRequest";
import SuggestionsList from "./SuggestionsList";
import { User } from "@/lib/types";

function List({
  type,
  title,
  page,
  profileId,
  loggedUser,
}: {
  type: "friendRequests" | "followers" | "followings" | "suggestions" | "chat";
  title: string;
  page?: "home" | "profile";
  profileId?: string;
  loggedUser?: User | null;
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
        {type === "followers" ? (
          <FollowersList page={page} profileId={profileId} />
        ) : type === "followings" ? (
          <FollowingsList page={page} profileId={profileId} />
        ) : type === "suggestions" ? (
          <SuggestionsList />
        ) : type === "friendRequests" ? (
          <FriendRequestList />
        ) : null}
      </div>
    </div>
  );
}

export default List;
