"use client";

import styles from "./posts.module.css";
import { useState, useEffect } from "react";
import { Post } from "./Feed";
import { CloseFriendIcon, CommentIcon, LikeIcon, PublicIcon, PrivateIcon } from "../icons";
import Comment from "../comments/PostComments";
import { useUser } from "@/context/UserContext";
import TimeAgo from "../groups/TimeAgo";

export const PostComponent: React.FC<{ post: Post, type?: "group" }> = ({ post, type }) => {

  const [showComments, setComments] = useState(false)
  const [totalLikes, setTotalLikes] = useState(post.totalLikes || 0)
  const [totalCOmments, setTotalCOmments] = useState(0)
  const [liked, setReaction] = useState(post.hasReact?.String === "1")
  const [commentsOpen, setCommentsOpen] = useState(false);
  const { user } = useUser()

  const handleLike = async () => {
    if (liked) {
      setReaction(!liked)
      totalLikes > 0 && setTotalLikes(totalLikes - 1)
    } else {
      setReaction(!liked)
      setTotalLikes(totalLikes + 1)
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/react`, {
      method: "POST",
      // credentials: "include",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userID: user?.id,
        postID: post.id,
        IsLike: !liked ? "1" : "0"
      })

    })
    if (!res.ok) {
      throw new Error("failed to react")
    }

  }

  const imgName = typeof post.imag_post === "string"
    ? post.imag_post                 // plain string column
    : post.imag_post?.String ?? "";    

  return (
    <>
      <div key={post.id} className={type === "group" ? styles.postGroup : undefined} >
        {/* HEADER */}
        <div className={styles.postHeader}>
          <img
            className={styles.userIcon}
            src={`${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${post.profile_pic}`}
            alt={post.firstName}
            width={40}
            height={40}
          />
          <div className={styles.postInfo}>
            <div className={styles.postUser}>{post.firstName} {post.lastName}</div>
            <div className={styles.postCreationDate}>
            <div className={styles.timeAgo}><TimeAgo dateStr={post.createdAt} /></div>
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
              src={`${process.env.NEXT_PUBLIC_API_URL}/api/storage/${type === "group" ? "groups_posts" : "posts"}/${imgName}`}
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
              onClick={
                () => setCommentsOpen(true)
              }
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
        </div >
      </div >
    </>
  )
}