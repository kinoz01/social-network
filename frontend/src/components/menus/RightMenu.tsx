import styles from "./menus.module.css";
import List from "./List";

function RightMenu({
  profileId,
  page,
}: {
  profileId?: string;
  page?: "home" | "profile";
}) {
  return (
    <div className={`${styles.rightMenu} ${styles[page || ""]}`}>
      <List
        type="followings"
        title="Followings"
        profileId={profileId}
        page={page}
      />
      <List
        type="followers"
        title="Followers"
        profileId={profileId}
        page={page}
      />
    </div>
  );
}

export default RightMenu;
