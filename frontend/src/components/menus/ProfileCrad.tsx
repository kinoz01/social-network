import Image from "next/image";
import styles from "./menus.module.css";


const ProfileCard = () => {
  return (
    <div className={styles.profileCard}>
      <div className={styles.profileCardHeader}>
        <Image
          src="https://images.unsplash.com/photo-1740768081811-e3adf4af4efe?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDExOHxibzhqUUtUYUUwWXx8ZW58MHx8fHx8"
          alt="User Image"
          className={styles.userImage}
          width={150}
          height={150}
        />
        <div className={styles.username}>Edward Gabriel May</div>
        <div className={styles.numbers}>
          <div className={styles.followersNumber}>Followers 500</div>
          <div className={styles.followingNumber}>Following 50</div>

          <div className={styles.postsNumber}>Posts 50</div>
        </div>
      </div>
      <div className={styles.profileCardDesc}>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Nisi, facilis
        fugiat? Doloribus aperiam illum praesentium autem sequi repudiandae et,
        molestiae quos maiores necessitatibus aspernatur quibusdam explicabo in,
        eius, ex mollitia.
      </div>
      {/* <div className={styles.buttons}>
        <button className={styles.button}>New Post</button>
        <button className={styles.button}>New Group</button>
        <button className={styles.button}>Logout</button>
      </div> */}
    </div>
  );
};

export default ProfileCard;
