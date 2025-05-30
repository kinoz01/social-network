"use client";

import { CreateIcon } from "../icons";
import styles from "./posts.module.css";

export default function AddPost({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {

  return (
    <>
      {isOpen && (
        <div className={styles.formContainer}>
          {/* FORM */}
          <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
            <button className={styles.closeBtn} onClick={onClose}>
              <CreateIcon />
            </button>
            <textarea
              name="content"
              className={styles.postContentInput}
              placeholder="Content of the post..."
            />
            <div className={styles.postOptions}>
              <input type="radio" name="privacy" id="private" value="private" />
              <label htmlFor="private">Private</label>
              <input
                type="radio"
                name="privacy"
                id="semi-public"
                value="semi-public"
              />
              <label htmlFor="semi-public">Semi Public</label>
              <input type="radio" name="privacy" id="public" value="public" />
              <label htmlFor="public">Public</label>
            </div>
            <input type="file" name="file" className={styles.uploadImgBtn} />
            <button type="submit" className={styles.submitBtn}>
              Create
            </button>
          </form>
        </div>
      )}
    </>
  );
}
