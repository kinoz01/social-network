import Image from "next/image";
import styles from "./comments.module.css";
import Link from "next/link";
import TimeAgo from "../groups/TimeAgo";
import { CommentInfo } from "../types";
import { popup } from "../posts/utils";
import { User } from "../types";
import { useState, useRef } from "react";

type FormParams = {
  userData: User | null
  postID: string
  onCOmmentAdded: () => void
  onNewCOmment: (newComment: CommentInfo) => void
}

export const CommentForm = (props: FormParams) => {
  const [comment, setComment] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    var commentINputs = e.currentTarget
    const formDAta = new FormData(commentINputs)
    const content = formDAta.get('content')?.toString().trim()

    if (!content && !fileInputRef.current?.value) {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/addcomment`,
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
      popup(err, false)

    }
  }
  return (
    <form onSubmit={(e) => handleComment(e)} className={styles.commentForm}>
      <div className={styles.formWrapper}>
        <div className={styles.formContent}>
          <Image
            src={props.userData?.profile_pic ? `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${props.userData?.profile_pic}` : "/img/default-avatar.png"}
            alt=""
            width={40}
            height={40}
            className={styles.avatar}
          />
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            type="text"
            name="content"
            className={styles.commentInput}
            placeholder="Add a comment..."
          />
        </div>
        <div className={styles.leftIcons}>
          <button type="submit" className={styles.addCommentBtn}>
            <span className={styles.sendIcon}>
              <Image src="/img/arrow-up.svg" alt="" width={18} height={18} />
            </span>
          </button>
          <label htmlFor="postImage" className={styles.icon}>
            <span className={styles.uploadIcon}>
              <Image
                src="/img/uploadA.svg"
                alt="Upload Icon" width={28} height={28} />
            </span>
          </label>
          <input id="postImage" type="file" name="file" className={styles.uploadImgBtn} ref={fileInputRef} />
        </div>
      </div>
    </form>
  )
}


export const COmmentComponent = ({ comments }: { comments: CommentInfo }) => {
  return (
    <div className={styles.bubble}>
      <div className={styles.headerRow}>
        <Link href={`/profile/${comments.userID}`} className={styles.linkWrapper}>
          <Image
            src={comments.avatar ? `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${comments.avatar}` : "/img/default-avatar.png"}
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
      <p>{comments.content}</p>
      {comments.img_comment &&
        <Image
          className={styles.img}
          src={`${process.env.NEXT_PUBLIC_API_URL}/api/storage/posts/${comments.img_comment}`}
          alt={comments.first_name}
          width={200}
          height={200}
        />}
    </div>
  )
}