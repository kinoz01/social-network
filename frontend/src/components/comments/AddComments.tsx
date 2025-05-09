import Image from "next/image";
import styles from "../posts/posts.module.css";

export default function AddComment() {
  return (
    <div >
      {/* FORM */}
      <form >
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
