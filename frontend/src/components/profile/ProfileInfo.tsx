import { User } from "@/lib/types";
import styles from "./profile.module.css";

function ProfileInfo({ user }: { user: User | null }) {
  return (
    <div className={styles.profileInfo}>
      <div >
        <div className={styles.title}>Info</div>
        <div className={styles.info}>
          <div>username</div>
          <div>about_me</div>
          <div>email</div>
          <div>birthday</div>
        </div>
      </div>
    </div>);
}

export default ProfileInfo;
