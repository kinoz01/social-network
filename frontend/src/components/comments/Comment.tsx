import Image from "next/image";
import styles from "../posts/posts.module.css";
import { User } from "@/lib/user";

export interface CommentInfo {
  commentId: string;
  content: string;
  userID: string;
  postID: string;
  img_comment: string;
  createdAt: string;
}

type Params = {
  userData: User | null
  commentData: CommentInfo
}

export default function Comment({ userData, commentData }: Params) {
  // console.log(commentData);

  return (
    <div className={styles.comment}>
      {/* HEADER */}
      <div className={styles.commentHeader}>
        <img
          className={styles.userIcon}
          src={`/storage/avatars/${userData?.profile_pic}`}
          alt={userData?.first_name}
          width={40}
          height={40}
        />
        <div className={styles.commentInfo}>
          <div className={styles.commentUser}>{userData?.username}</div>
        </div>
      </div>
      {/* CONTENT */}
      <div className={styles.commentContent}>
        {commentData.content}
        {commentData.img_comment &&
          <img
            className={styles.postImage}
            src={`/storage/posts/${commentData.img_comment}`}
            alt={commentData.commentId}
            width={100}
            height={100}
          />}
        <div className={styles.commentCreationDate}>{commentData.createdAt}</div>
      </div>
    </div>
  );
}
