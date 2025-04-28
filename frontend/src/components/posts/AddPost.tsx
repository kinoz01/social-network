"use client";

import Image from "next/image";
import styles from "./posts.module.css";

export default function AddPost() {
  return (
    <div className={styles.addPost}>
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
      <form className={styles.postForm} >
        <textarea
          name="content"
          className={styles.postContentInput}
          placeholder="Content of the post..."
        // maxLength={250}
        // required

        />
        <button type="submit" className={styles.addPostBtn}>
          Create
        </button>
      </form>
    </div>
  );
}
