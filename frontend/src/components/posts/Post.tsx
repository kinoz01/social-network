"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./posts.module.css";
import { Post } from "./Feed";
import {
  CloseFriendIcon,
  CommentIcon,
  LikeIcon,
  PublicIcon,
  PrivateIcon,
} from "../icons";
import Comment from "../comments/PostComments";
import { useUser } from "@/context/UserContext";
import TimeAgo from "../groups/TimeAgo";

export const PostComponent: React.FC<{ post: Post; type?: "group" }> = ({
  post,
  type,
}) => {
  const [totalLikes, setTotalLikes] = useState(post.totalLikes || 0);
  const [liked, setReaction] = useState(post.hasReact?.String === "1");
  const [commentsOpen, setCommentsOpen] = useState(false);
  const { user } = useUser();

  /* like handler */
  const handleLike = async () => {
    const nextLiked = !liked;
    setReaction(nextLiked);
    setTotalLikes((prev) => prev + (nextLiked ? 1 : -1));

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/react`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userID: user?.id,
        postID: post.id,
        IsLike: nextLiked ? "1" : "0",
      }),
    });
  };

  const imgName =
    typeof post.imag_post === "string"
      ? post.imag_post
      : post.imag_post?.String ?? "";

  return (
    <div
      key={post.id}
      className={type === "group" ? styles.postGroup : undefined}
    >
      {/* HEADER */}
      <div className={styles.postHeader}>
        <Link
          href={`/profile/${post.userID}`}
          className={styles.link}
        >
          <img
            className={styles.userIcon}
            src={`${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${post.profile_pic}`}
            alt={post.firstName}
            width={40}
            height={40}
          />
        </Link>

        <div className={styles.postInfo}>
          <Link
            href={`/profile/${post.userID}`}
          >
            <span className={styles.postUser}>
              {post.firstName} {post.lastName}
            </span>
          </Link>

          <div className={styles.postCreationDate}>
            <div className={styles.timeAgo}>
              <TimeAgo dateStr={post.createdAt} />
            </div>
            {post.visibility === "private" ? <CloseFriendIcon /> : post.visibility === "almost-private" ? <PrivateIcon /> : <PublicIcon />}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className={styles.postDesc}>
        <div className={styles.postContent}>{post.content}</div>

        {imgName && (
          <img
            className={styles.postImage}
            src={`${process.env.NEXT_PUBLIC_API_URL}/api/storage/${type === "group" ? "groups_posts" : "posts"
              }/${imgName}`}
            alt={`${post.firstName} post`}
            width={450}
            height={450}
          />
        )}

        <div className={styles.reactAmount}>
          <span>{totalLikes} Likes</span>
        </div>

        <div className={styles.postFooter}>
          <button
            className={styles.reactBtn}
            onClick={handleLike}
          >
            <LikeIcon fill={liked ? "red" : "none"} />
            Like
          </button>

          <button
            className={styles.commentsBtn}
            onClick={() => setCommentsOpen(true)}
          >
            <CommentIcon />
            Comment
          </button>
        </div>

        {commentsOpen && (
          <Comment
            postId={post.id}
            onClose={() => setCommentsOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
