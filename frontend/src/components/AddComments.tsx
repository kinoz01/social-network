import Image from "next/image";
import styles from "../app/page.module.css";

export default function AddComment() {
  return (
    <div className={styles.addComment}>
      {/* ICON */}
      <div>
        <Image
          className={styles.userIcon}
          src="https://images.unsplash.com/photo-1742626157100-a25483dda2ea?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDM0fGJvOGpRS1RhRTBZfHxlbnwwfHx8fHw%3D"
          alt=""
          width={50}
          height={50}
        />
      </div>
      {/* FORM */}
      {/* FORM */}
      <form className={styles.commentForm}>
        <input
          type="text"
          name="comment"
          className={styles.commentInput}
          placeholder="Add a comment..."
        />
        <button type="submit" className={styles.addCommentBtn}>
          Create
        </button>
      </form>
    </div>
  );
}
