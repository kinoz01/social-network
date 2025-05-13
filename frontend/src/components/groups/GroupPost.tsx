"use client";

import Image from "next/image";
import styles from "./style/groupFeed.module.css";

type Post = {
    post_id: string;
    body: string;
    img_post: string | null;
    created_at: string; // ISO
    first_name: string;
    last_name: string;
    profile_pic: string | null;
};

export default function GroupPost({ p }: { p: Post }) {
    return (
        <article className={styles.post}>
            {/* ─── header ─── */}
            <header className={styles.postHeader}>
                <Image
                    src={
                        p.profile_pic
                            ? `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${p.profile_pic}`
                            : "/img/default-avatar.png"
                    }
                    alt=""
                    width={40}
                    height={40}
                    className={styles.userIcon}
                />
                <div className={styles.postInfo}>
                    <span className={styles.postUser}>
                        {p.first_name} {p.last_name}
                    </span>
                    <time className={styles.postCreationDate}>
                        {new Date(p.created_at).toLocaleString()}
                    </time>
                </div>
            </header>

            {/* ─── body ─── */}
            <p className={styles.postContent}>{p.body}</p>

            {p.img_post && (
                <Image
                    src={`${process.env.NEXT_PUBLIC_API_URL}/api/storage/groups_posts/${p.img_post}`}
                    alt=""
                    className={styles.postImage}
                    width={500}
                    height={500}
                />
            )}
        </article>
    );
}
