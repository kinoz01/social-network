import styles from "../app/page.module.css";
import { ChatIcon, GroupIcon, HomeIcon, NotificationIcon } from "./icons";

export default function SideBar() {
  return (
    <div className={styles.sideBar}>
      <div className={styles.logo}>
        SN
      </div>
      <div className={styles.navIcons}>
        <HomeIcon />
        <GroupIcon />
        <NotificationIcon />
        <ChatIcon />
      </div>
      {/* <div className={styles.profileIcon}> */}
      <HomeIcon />
      {/* </div> */}
    </div>
  );
}
