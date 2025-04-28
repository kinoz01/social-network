import styles from "./menus.module.css";
import List from "./List";

function RightMenu() {
  return (
    <div className={styles.rightMenu}>

      <div className={styles.menuSection}>
        <List type="friendRequests" title="Friend Requests" />
      </div>

      <div className={styles.menuSection}>
        <List type="suggestions" title="Suggestions" />
      </div>
    </div>
  );
}

export default RightMenu;
