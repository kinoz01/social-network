import styles from "./menus.module.css";
import ProfileCard from "./ProfileCrad";
import List from "./List";
import Link from "next/link";

const LeftMenu = ({
  type,
}: {
  type: "home" | "chat" | "profile" | "group" | "groups";
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
          <List type="chat" title="Chat" />
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
