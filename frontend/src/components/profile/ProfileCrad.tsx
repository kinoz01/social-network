import Image from "next/image";
import styles from "./profile.module.css";
import { User } from "@/lib/types";
import FollowButton from "./FollowButton";

async function ProfileCard({
  type,
  user,
}: {
  type: "home" | "profile";
  user: User | null;
}) {

  return (
    <div className={`${styles.profileCard} ${styles[type]}`}>
      <Image
        src={`${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${user?.profile_pic}`}
        alt="User Image"
        className={styles.userImage}
        width={150}
        height={150}
      />
      <div className={styles.profileCardHeader}>
        <div className={styles.username}>
          {`${user?.first_name} ${user?.last_name}`}
        </div>
        {type === "profile" && user && (
          <FollowButton profileId={user.id} />
        )}
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
}

export default ProfileCard;
