"use client";

import Image from "next/image";
import styles from "./posts.module.css";
import AddComment from "../comments/AddComments";
import { useState, useEffect } from "react";
import { Post } from "./Feed";
import { CloseFriendIcon, CommentIcon, LikeIcon, PublicIcon, PrivateIcon } from "../icons";
import { User } from "./Feed";
import { getUser } from "@/lib/user";
import Comment from "../comments/Comment";
import { CommentInfo } from "../comments/Comment";

export const PostComponent: React.FC<{ post: Post }> = ({ post }) => {
  // console.log("post.hasReact.String", post.hasReact);
  const [user, setUser] = useState<User | null>(null)
  const [showComments, setComments] = useState(false)
  const [totalLikes, setTotalLikes] = useState(post.totalLikes || 0)
  const [totalCOmments, setTotalCOmments] = useState(0)
  const [liked, setReaction] = useState(post.hasReact?.String === "1")
  const [postedComments, setNewComments] = useState<CommentInfo[]>([]);


  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUser()
      setUser(userData)
    }
    fetchUser()
  }, [])

  const handleLike = async () => {
    if (liked) {
      setReaction(!liked)
      totalLikes > 0 && setTotalLikes(totalLikes - 1)
    } else {
      setReaction(!liked)
      setTotalLikes(totalLikes + 1)
    }
    // console.log("------->user inside FEED", user)
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

  const addNewComment = (newComment: CommentInfo) => {
    setNewComments(prev => [newComment, ...prev])
    setTotalCOmments(prev => prev + 1)
  }

  // console.log("here reaction--------", post.hasReact.String);
  console.log("pooooost", post);

  return (
    <>
      <div key={post.id} >
        {/* HEADER */}
        <div className={styles.postHeader}>
          <img
            className={styles.userIcon}
            src={`/storage/avatars/${post.profile_pic}`}
            alt={post.firstName}
            width={40}
            height={40}
          />
          <div className={styles.postInfo}>
            <div className={styles.postUser}>{post.firstName} {post.lastName}</div>
            <div className={styles.postCreationDate}>
              <div>{post.createdAt}</div>
              .
              {post.visibility === "private" ? <CloseFriendIcon /> : post.visibility === "public" ? <PublicIcon /> : <PrivateIcon />}
              {/* <span>{post.visibility}</span> */}
            </div>
          </div>
        </div >
        {/* CONTENT */}
        < div className={styles.postDesc} >
          <div className={styles.postContent}>
            {post.content}
          </div>
          {post.imag_post &&
            <img
              className={styles.postImage}
              src={`/storage/posts/${post.imag_post}`}
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
              onClick={
                !showComments ? () => setComments(true) : () => setComments(false)
              }
            >
              <CommentIcon />
              Comment
            </button>
          </div>
        </div >
        {/* COMMENTS */}
        {
          showComments ? (
            <div className={styles.comments}>
              <AddComment postID={post.id} userID={user?.id} onNewComment={addNewComment} />
              {postedComments && postedComments.map((comm) => (
                <div key={comm.commentId}>
                  <Comment userData={user} commentData={comm} />
                </div>
              ))}
            </div>
          ) : null
        }
      </div >

    </>

  )
}