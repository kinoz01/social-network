import styles from "./menus.module.css";
import ProfileCard from "./ProfileCrad";
import List from "./List";
import Link from "next/link";


const LeftMenu = ({ type }: { type: "home" | "chat" | "profile" | "group" | "groups" }) => {
  return (
    <div className={`${styles.leftMenu} ${styles[type]}`}>
      {
        type == "home" ?
          <>
            <ProfileCard />
            <List type="followers" title="Followers" />
          </>
          : type === "chat" ?
            <>
              <List type="chat" title="Chat" />
              <List type="suggestions" title="Suggestions" />
            </>
            : type === "group" ?
              <>
                <div className="buttons">
                  <button >
                    <Link href="/groups/1">
                      Posts
                    </Link>
                  </button>
                  <button >
                    <Link href="/groups/1/chat">
                      Chat
                    </Link>
                  </button>
                  <button>
                    <Link href="/groups/1/events">
                      Events
                    </Link>
                  </button>
                </div>
                <List type="group" title="Members" />
              </>
              : type === "groups" ?
                <List type="groups" title="Groups" />
                : null
      }
    </div >
  );
};

export default LeftMenu;
