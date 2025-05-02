import styles from "./menus.module.css";
import List from "./List";

function RightMenu() {
  return (
    <div className={styles.rightMenu}>
      <List type="friendRequests" title="Friend Requests" />
      <List type="suggestions" title="Suggestions" />
    </div>
  );
}

export default RightMenu;
