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

export const PostComponent: React.FC<{ post: Post; type?: any }> = ({ post, type }) => {

  const [showComments, setShowComments] = useState(false)
  const [totalLikes, setTotalLikes] = useState(post.totalLikes || 0)
  const [totalCOmments, setTotalCOmments] = useState(post.totalComments || 0)
  const [liked, setReaction] = useState(post.hasReact === "1")

  const { user } = useUser()

  const handleLike = async () => {
    const res = await fetch(`${API_URL}/api/react`, {
      method: "POST",
      credentials: "include",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userID: user?.id,
        postID: post.id,
        IsLike: !liked ? "1" : ""
      })

    })
    if (!res.ok) {
      popup("action failed", false)
      throw new Error((await res.json()).msg || "failed to react")
    }
    if (liked) {
      setReaction(!liked)
      totalLikes > 0 && setTotalLikes(totalLikes - 1)
    } else {
      setReaction(!liked)
      setTotalLikes(totalLikes + 1)
    }
  }

  const imgName =
    typeof post.imag_post === "string"
      ? post.imag_post
      : post.imag_post ?? "";
      console.log("----------------------", type);
      

  return (
    <div key={post.id}>
      {/* HEADER */}
      <div className={styles.postHeader}>
        <Link
          href={`/profile/${post.userID}`}
          className={styles.link}
        >
          <img
            className={styles.userIcon}
            src={`${API_URL}/api/storage/avatars/${post.profile_pic}`}
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
      </div >
      {/* CONTENT */}
      < div className={styles.postDesc} >
        <div className={styles.postContent}>
          {post.content}
        </div>
        {imgName && (
          <img
            className={styles.postImage}
            src={`${API_URL}/api/storage/${type === "group" ? "groups_posts" : post.groupID ? "groups_posts" : "posts"}/${imgName}`}
            alt={`${post.firstName} post`}
            width={450}
            height={450}
          />
        )}
        <div className={styles.reactAmount}>
          <span>{totalLikes} Likes</span>
          <span>{totalCOmments} comments</span>
        </div>
        <div className={styles.postFooter}>
          <button
            className={styles.reactBtn}

            onClick={
              handleLike
            }
          >
            <LikeIcon fill={liked ? "red" : "none"} />
            Like
          </button>
          <button
            className={styles.commentsBtn}
            onClick={() => setShowComments(true)}
          >
            <CommentIcon />
            Comment
          </button>
        </div>

        {showComments && (
          <Comment
            userData={user}
            postID={post.id}
            postCreator={post.firstName}
            onClose={() => setShowComments(false)}
            onCOmmentAdded={() => setTotalCOmments(i => i + 1)}
          />
        )}
      </div >
    </div >

  )
}