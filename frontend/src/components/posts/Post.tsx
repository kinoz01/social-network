"use client";

import Image from "next/image";
import styles from "./posts.module.css";
import { useState, useEffect } from "react";
// import { Post } from "./Feed";
import { Post, User } from "../types";
import { CloseFriendIcon, CommentIcon, LikeIcon, PublicIcon, PrivateIcon } from "../icons";
import { getUser } from "@/lib/user";
import Comment from "../comments/Comment";
import TimeAgo from "../groups/TimeAgo";
import { popup } from "./utils";

export const PostComponent: React.FC<{ post: Post }> = ({ post }) => {
  // console.log("IN POST COMPONENTBEFORE", post);

  const [user, setUser] = useState<User | null>(null)
  const [showComments, setShowComments] = useState(false)
  const [totalLikes, setTotalLikes] = useState(post.totalLikes || 0)
  const [totalCOmments, setTotalCOmments] = useState(post.totalComments || 0)
  const [liked, setReaction] = useState(post.hasReact === "1")

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUser()
      setUser(userData)
    }
    fetchUser()
  }, [])

  const handleLike = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/react`, {
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

  return (
    <>
      <div key={post.id} >
        {/* HEADER */}
        <div className={styles.postHeader}>
          <Image
            className={styles.userIcon}
            src={`${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${post.profile_pic}`}
            alt={post.firstName}
            width={40}
            height={40}
          />
          <div className={styles.postInfo}>
            <div className={styles.postUser}>{post.firstName} {post.lastName}</div>
            <div className={styles.postCreationDate}>
              <div className={styles.timeAgo}>
                <TimeAgo dateStr={post.createdAt} />
              </div>
              {post.visibility === "private" ? <CloseFriendIcon /> : post.visibility === "public" ? <PublicIcon /> : <PrivateIcon />}
            </div>
          </div>
        </div >
        {/* CONTENT */}
        < div className={styles.postDesc} >
          <div className={styles.postContent}>
            {post.content}
          </div>
          {post.imag_post &&
            <Image
              className={styles.postImage}
              src={`${process.env.NEXT_PUBLIC_API_URL}/api/storage/posts/${post.imag_post}`}
              alt={post.firstName}
              width={450}
              height={450}
            />}
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
    </>

  )
}