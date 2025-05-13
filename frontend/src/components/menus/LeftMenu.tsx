import styles from "./menus.module.css";
import ProfileCard from "./ProfileCrad";
import List from "./List";
import { User } from "@/lib/user";

const LeftMenu = ({
  type, selectedUser
}: {
  type: "home" | "chat" | "profile" | "group" | "groups";
  selectedUser?: (user: User) => void;
}) => {
  return (
    <div className={`${styles.leftMenu} ${styles[type]}`}>
      {type == "home" ? (
        <>
          <ProfileCard />
            <List type="followers" title="Followers" />
        </>
      ) : type === "chat" ? (
        <>
            <List type="chat" title="Chat" selectedUser={selectedUser}/>
        </>
      ) : type === "groups" ? (
        <>
          <List type="groups" title="Groups" />
        </>
      ) : null}
    </div>
  );
};

export default LeftMenu;
