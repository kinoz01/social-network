"use client";

import Image from "next/image";
import styles from "./posts.module.css";
import AddComment from "../comments/AddComments";
import Comment from "../comments/Comment";
import { useState, useEffect } from "react";
import { Post } from "./Feed";
import { CloseFriendIcon, CommentIcon, LikeIcon, PublicIcon, PrivateIcon } from "../icons";

export function PostComponent({ post }: { post: Post }) {

  const [showComments, setComments] = useState(false)
  const [liked, setReaction] = useState(false)
  const [totalLikes, setTotalLikes] = useState(0)
  const [totalCOmments, setTotalCOmments] = useState(0)

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
          <div className={styles.postInfo} user-id={post.userID}>
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
          <div className={styles.postContent} >
            {post.content}
          </div>
          {post.imag_post?.String !== "" &&
            <img
              className={styles.postImage}
              src={`/storage/posts/${post.imag_post?.String}`}
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
                liked ? () => {
                  setReaction(!liked)
                  totalLikes > 0 && setTotalLikes(totalLikes - 1)
                } : () => {
                  setReaction(!liked)
                  setTotalLikes(totalLikes + 1)
                }
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
              <AddComment />
              <Comment />
            </div>
          ) : null
        }
      </div >

    </>

  );
}