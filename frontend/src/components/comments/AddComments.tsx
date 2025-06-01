import Image from "next/image";
import styles from "./comments.module.css";
import Link from "next/link";
import TimeAgo from "../groups/TimeAgo";
import { CommentInfo, User } from "../types";
import { popup } from "../utils";
import { useState, useRef } from "react";
import { API_URL } from "@/lib/api_url";
import { Heart } from "../icons";

type FormParams = {
  userData: User | null
  postID: string
  onCOmmentAdded: () => void
  onNewCOmment: (newComment: CommentInfo) => void
}

export const CommentForm = (props: FormParams) => {
  const [comment, setComment] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileSelected, setFile] = useState(false);
  const canSend = comment.trim().length > 0;

  const handleComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    var commentINputs = e.currentTarget
    const formDAta = new FormData(commentINputs)
    const content = formDAta.get('content')?.toString().trim()

    if (!content) {
      popup("comment content cannot be empty", false)
      return
    }
    if (content && content.length > 500) {
      popup("Comment exceeds 500 characters", false)
      return
    }

    formDAta.append('avatar', props.userData?.profile_pic || '')
    formDAta.append('userID', props.userData?.id || '')
    formDAta.append('firstName', props.userData?.first_name || '')
    formDAta.append('lastName', props.userData?.last_name || '')
    formDAta.append('postID', props.postID)
    try {
      const res = await fetch(`${API_URL}/api/addcomment`,
        {
          method: "POST",
          body: formDAta,
          credentials: 'include',
        })
      if (!res.ok) {
        popup("creation of comment failed", false)
        throw new Error((await res.json()).msg || "creation of comment failed")
      }
      const data = await res.json()

      setComment('')
      setFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      document.querySelector(".popup")?.remove()
      popup("comment published successfully", true)
      // setNewComments(prev => [data, ...prev])
      props.onNewCOmment(data)
      props.onCOmmentAdded()
    } catch (err: any) {
      console.error("failed to send comment", err)
      document.querySelector(".popup")?.remove()
      setFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      popup(err, false)
    }
  }
  return (
    <form onSubmit={(e) => handleComment(e)} className={styles.commentForm}>
      <div className={styles.formWrapper}>
        <div className={styles.formContent}>
          <Image
            src={props.userData?.profile_pic ? `${API_URL}/api/storage/avatars/${props.userData?.profile_pic}` : "/img/default-avatar.png"}
            alt=""
            width={40}
            height={40}
            className={styles.avatar}
          />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (canSend) e.currentTarget.form?.requestSubmit();
              }
            }}
            name="content"
            placeholder="Add a comment…"
            rows={2}
            className={styles.commentInput}
            maxLength={500}
          />
        </div>
        <div className={styles.leftIcons}>
          <button
            type="submit"
            className={styles.addCommentBtn}
            disabled={!canSend}
          >
            <span className={styles.sendIcon}>
              <Image src="/img/arrow-up.svg" alt="" width={18} height={18} />
            </span>
          </button>
          <label htmlFor="postImage" className={styles.icon}>
            <span className={styles.uploadIcon}>
              <Image
                src="/img/upload.svg"
                alt="Upload Icon" width={28} height={28} />
            </span>
          </label>
          <input
            id="postImage"
            type="file"
            name="file"
            className={styles.uploadImgBtn}
            ref={fileInputRef}
            onChange={(e) => setFile((e.target.files?.length ?? 0) > 0)}
          />
        </div>
      </div>
    </form>
  )
}

export const COmmentComponent = ({ comments }: { comments: CommentInfo }) => {
  const [liked, setLiked] = useState(comments.hasReact === "1");
  const [count, setCount] = useState(comments.likesCount ?? 0);

  const toggle = async () => {
    /* 1 — decide new state from current one */
    const nextLiked = !liked;

    /* 2 — optimistic UI */
    setLiked(nextLiked);
    setCount(prev => prev + (nextLiked ? 1 : -1));

    try {
      /* 3 — tell backend *what we just did* */
      const res = await fetch(`${API_URL}/api/comment/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          commentId: comments.commentId,
          like: nextLiked          // explicit!
        }),
      });
      if (!res.ok) throw new Error();

      /* 4 — reconcile with truth from server */
      const { liked: srvLiked, count: srvCount } = await res.json();
      setLiked(srvLiked);
      setCount(srvCount);
    } catch (e) {
      /* 5 — rollback if request failed */
      setLiked(comments.hasReact === "1");
      setCount(comments.likesCount ?? 0);
    }
  };

  return (
    <div className={styles.bubble}>
      {/* ------- existing header ------- */}
      <div className={styles.headerRow}>
        <Link href={`/profile/${comments.userID}`} className={styles.linkWrapper}>
          <Image
            src={
              comments.avatar
                ? `${API_URL}/api/storage/avatars/${comments.avatar}`
                : "/img/default-avatar.png"
            }
            alt={comments.first_name}
            width={40}
            height={40}
            className={styles.avt}
          />
        </Link>
        <Link href={`/profile/${comments.avatar}`} className={styles.nameLink}>
          <span className={styles.name}>
            {comments.first_name} {comments.last_name}
          </span>
        </Link>
        <TimeAgo dateStr={comments.createdAt} />
      </div>

      {/* ------- existing body ------- */}
      <p>{comments.content}</p>
      {comments.img_comment && (
        <Image
          className={styles.img}
          src={`${API_URL}/api/storage/posts/${comments.img_comment}`}
          alt={comments.first_name}
          width={200}
          height={200}
        />
      )}

      <div className={styles.footer}>
        <button type="button" onClick={toggle} className={styles.likeBtn}>
          <Heart filled={liked} className={styles.heartIcon} />
        </button>
        <span className={styles.likeCnt}>{count}</span>
      </div>
    </div>
  );
};