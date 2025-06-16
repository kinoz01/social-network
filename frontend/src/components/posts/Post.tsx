"use client";

import styles from "./posts.module.css";
import { useState, useEffect } from "react";
import { Post } from "../../lib/types";
import { CloseFriendIcon, CommentIcon, LikeIcon, PublicIcon, PrivateIcon } from "../icons";
import Comment from "../comments/Comment";
import TimeAgo from "../groups/TimeAgo";
import { popup } from "../../lib/utils";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { API_URL } from "@/lib/api_url";
import { Post } from "@/lib/types";
import {
  CloseFriendIcon,
  CommentIcon,
  LikeIcon,
  PrivateIcon,
  PublicIcon,
} from "../icons";

export const PostComponent: React.FC<{ post: Post; type?: any }> = ({ post, type }) => {

  const { user } = useUser();

  const handleLike = async () => {
    const res = await fetch(`${API_URL}/api/react`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userID: user?.id,
        postID: post.id,
        IsLike: !liked ? "1" : "",
      }),
    });
    if (!res.ok) {
      popup("action failed", false);
      throw new Error((await res.json()).msg || "failed to react");
    }
    if (liked) {
      setReaction(!liked);
      totalLikes > 0 && setTotalLikes(totalLikes - 1);
    } else {
      setReaction(!liked);
      setTotalLikes(totalLikes + 1);
    }
  };

  const imgName =
    typeof post.imag_post === "string"
      ? post.imag_post
      : post.imag_post ?? ""; 

  return (
    <div key={post.id}>
      {/* HEADER */}
      <div className={styles.postHeader}>
        <Link href={`/profile/${post.userID}`} className={styles.link}>
          <img
            className={styles.userIcon}
            src={`${API_URL}/api/storage/avatars/${post.profile_pic}`}
            alt={post.firstName}
            width={40}
            height={40}
          />
        </Link>
        <div className={styles.postInfo}>
          <Link href={`/profile/${post.userID}`}>
            <span className={styles.postUser}>
              {post.firstName} {post.lastName}
            </span>
          </Link>
          <div className={styles.postCreationDate}>
            <div className={styles.timeAgo}>
              <TimeAgo dateStr={post.createdAt} />
            </div>
            {post.visibility === "private" ? (
              <CloseFriendIcon />
            ) : post.visibility === "almost-private" ? (
              <PrivateIcon />
            ) : (
              <PublicIcon />
            )}
          </div>
        </div>
      </div>
      {/* CONTENT */}
      <div className={styles.postDesc}>
        <div className={styles.postContent}>{post.content}</div>
        {imgName && (
          <Image
            className={styles.postImage}
            src={`${API_URL}/api/storage/${type === "group" ? "groups_posts" : post.groupID ? "groups_posts" : "posts"}/${imgName}`}
            alt={`${post.firstName} post`}
            width={450}
            height={450}
          />
        )}

        <div className={styles.postFooter}>
          <button className={styles.reactBtn} onClick={handleLike}>
            <LikeIcon fill={liked ? "#e27396" : "none"} />
            {totalLikes} Likes
          </button>
          <button
            className={styles.commentsBtn}
            onClick={() => setShowComments(true)}
          >
            <CommentIcon />
            {totalCOmments} Comments
          </button>
        </div>

        {showComments && (
          <Comment
            userData={user}
            postID={post.id}
            postCreator={post.firstName}
            onClose={() => setShowComments(false)}
            onCOmmentAdded={() => setTotalCOmments((i) => i + 1)}
          />
        )}
      </div>
    </div>
  );
};
