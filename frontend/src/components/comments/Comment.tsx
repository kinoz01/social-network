import Image from "next/image";
import styles from "../posts/posts.module.css";

export default function Comment() {
  return (
    <div className={styles.comment}>
      {/* HEADER */}
      <div className={styles.commentHeader}>
        <Image
          className={styles.userIcon}
          src="https://images.unsplash.com/photo-1742626157100-a25483dda2ea?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDM0fGJvOGpRS1RhRTBZfHxlbnwwfHx8fHw%3D"
          alt=""
          width={40}
          height={40}
        />
        <div className={styles.commentInfo}>
          {/* <div className={styles.commentUser}>John</div> */}
        </div>
      </div>
      {/* CONTENT */}
      <div className={styles.commentContent}>
        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Accusantium et
        laudantium fugiat, sequi quam hic atque optio temporibus at incidunt
        animi in quos corporis dolores qui voluptatem facere blanditiis
        molestias!
        <div className={styles.commentCreationDate}>01/01/2000</div>
      </div>
    </div>
  );
}
