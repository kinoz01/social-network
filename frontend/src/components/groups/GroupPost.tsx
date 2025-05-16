"use client";

import Image from "next/image";
import Link from "next/link";              
import styles from "./style/groupFeed.module.css";
import TimeAgo from "./TimeAgo";
import { useState } from "react";
import CommentsModal from "./PostComments";


type Post = {
    post_id: string;
    user_id: string; 
    body: string;
    img_post: string | null;
    created_at: string;
    first_name: string;
    last_name: string;
    profile_pic: string | null;
};

export default function GroupPost({ p }: { p: Post }) {
    const [open, setOpen] = useState(false);

    const profileHref = `/profile/${p.user_id}`;

    return (
        <article className={styles.post}>
            {/* ─── header ─── */}
            <header className={styles.postHeader}>
                <Link href={profileHref}>
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
                </Link>

                <div className={styles.postInfo}>
                    <Link href={profileHref} className={styles.postUser}>
                        {p.first_name} {p.last_name}
                    </Link>
                    &nbsp;
                    <TimeAgo dateStr={p.created_at} />
                </div>
            </header>

            {p.img_post && (
                <Image
                    src={`${process.env.NEXT_PUBLIC_API_URL}/api/storage/groups_posts/${p.img_post}`}
                    alt=""
                    className={styles.postImage}
                    width={500}
                    height={500}
                />
            )}

            <p className={styles.postContent}>{p.body}</p>

            {/* —— comment button —— */}
            <div className={styles.cmtBtnContainer}>
                <div className={styles.cmtBtn} onClick={() => setOpen(true)}>
                    <Image src="/img/comment.svg" alt="comments" width={25} height={25} />
                </div>
            </div>

            {open && <CommentsModal postId={p.post_id} onClose={() => setOpen(false)} />}
        </article>
    );
}
