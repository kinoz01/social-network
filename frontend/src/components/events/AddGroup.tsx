"use client";

import { CreateIcon } from "../icons";
import styles from "../posts/posts.module.css";

export default function AddGroup({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {

    return (
        <>
            {isOpen && (
                <div className={styles.formContainer}>
                    {/* FORM */}
                    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                        <button
                            className={styles.closeBtn}
                            onClick={onClose}>
                            <CreateIcon />
                        </button>                        <input
                            type="text"
                            name="group-name"
                            className={styles.postContentInput}
                            placeholder="Enter the name of the group..."
                        />

                        <input
                            type="text"
                            name="admin"
                            className={styles.postContentInput}
                            placeholder="Enter the admin of the group..."
                        />

                        <input
                            type="text"
                            name="group-name"
                            className={styles.postContentInput}
                            placeholder="Invite..."
                        />

                        <button type="submit" className={styles.submitBtn}>
                            Create
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
