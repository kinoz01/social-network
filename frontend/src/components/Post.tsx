import Image from "next/image";
import styles from "../app/page.module.css";
import AddComment from "./AddComments";
import Comment from "./Comment";

export default function Post() {
  return (
    <div className={styles.post}>
      {/* HEADER */}
      <div className={styles.postHeader}>
        <Image
          className={styles.userIcon}
          src="https://images.unsplash.com/photo-1742626157100-a25483dda2ea?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDM0fGJvOGpRS1RhRTBZfHxlbnwwfHx8fHw%3D"
          alt=""
          width={40}
          height={40}
        />
        <div className={styles.postInfo}>
          <div className={styles.postUser}>John</div>
          <div className={styles.postCreationDate}>01/01/2000</div>
        </div>
      </div>
      {/* CONTENT */}
      <div className={styles.postDesc}>
        <Image
          className={styles.postImage}
          src="https://images.unsplash.com/photo-1740768081811-e3adf4af4efe?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDExOHxibzhqUUtUYUUwWXx8ZW58MHx8fHx8"
          alt=""
          width={450}
          height={450}
        />
        <div className={styles.postContent}>
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Accusantium
          et laudantium fugiat, sequi quam hic atque optio temporibus at
          incidunt animi in quos corporis dolores qui voluptatem facere
          blanditiis molestias!
        </div>
        <div className={styles.commentsBtn}>comments</div>
      </div>
      {/* COMMENTS */}
      <div className={styles.postComments}>
        {/* <AddComment /> */}
        {/* <Comment />
        <Comment />
        <Comment /> */}
      </div>
    </div>
  );
}
