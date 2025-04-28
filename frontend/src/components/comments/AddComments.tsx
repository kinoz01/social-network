import Image from "next/image";
import styles from "../../app/page.module.css";

export default function AddComment() {
  return (
    <div className={styles.addComment}>
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
