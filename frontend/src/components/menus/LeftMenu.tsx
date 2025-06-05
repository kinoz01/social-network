
import styles from "./menus.module.css";
import List from "./List";
import ProfileCard from "../profile/ProfileCrad";
import { fetchUser } from "@/lib/apiUsers";

async function LeftMenu({
  type,
  profileId,
}: {
  type: "home" | "chat" | "profile" | "group" | "groups";
  profileId?: string;
}) {
  // const { user: loggedUser } = useUser();
 

  return (
    <div className={`${styles.leftMenu} ${styles[type]}`}>
      {type == "home" ? (
        <>
          <ProfileCard type="home" />
          <List
            type="friendRequests"
            title="Friend Requests"
            // loggedUser={loggedUser}
          />
        </>
      ) : type === "chat" ? (
        <>
          <List type="chat" title="Chat" profileId={profileId} />
        </>
      ) : (
        
        <ProfileCard  type="profile" profileId={profileId} />
      )}
    </div>
  );
}

export default LeftMenu;
