import Image from "next/image";
import styles from "./menus.module.css";
import { User } from "@/lib/types";

const ProfileCard = ({ user }: { user: User | null }) => {
  return (
    <div className={styles.profileCard}>
      <div className={styles.profileCardHeader}>
        <Image
          src={`${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${user?.profile_pic}`}
          alt="User Image"
          className={styles.userImage}
          width={150}
          height={150}
        />
        <div className={styles.username}>
          {`${user?.first_name} ${user?.last_name} ${user?.id}`}
        </div>
        <div className={styles.numbers}>
          <div className={styles.followersNumber}>Followers 500</div>
          <div className={styles.followingNumber}>Following 50</div>
          <div className={styles.postsNumber}>Posts 50</div>
        </div>
      </div>
      {user?.about_me && (
        <div className={styles.profileCardDesc}>{user.about_me}</div>
      )}
    </div>
  );
};

export default ProfileCard;
