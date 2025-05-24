import Image from "next/image";
import styles from "../posts/posts.module.css";
import { useState, useRef } from "react";
import { popup } from "../posts/utils";
import { CommentInfo } from "./Comment";

type commentParams = {
  postID: string;
  userID?: string;
  onNewComment?: (comment: CommentInfo) => void;
}

export default function AddComment(props: commentParams) {
  // console.log("addcomment");
  const [comment, setComment] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    var commentINputs = e.currentTarget
    const formDAta = new FormData(commentINputs)
    const content = formDAta.get('content')?.toString()
    // console.log("heere content--", content, content?.trim())

    if (!content?.trim() || content.length > 500) {
      popup('Empty comment or exceeds 500 characters', false)
      return
    }

    formDAta.append('userID', props.userID || '')
    formDAta.append('postID', props.postID)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/addcomment`,
        {
          method: "POST",
          // headers: {
          //   'Content-Type': 'application/json'
          // },
          body: formDAta
        })
      if (!res.ok) {
        popup("creation of comment failed", false)
        throw new Error((await res.json()).msg || "creation of comment failed")
      }
      const data = await res.json()
      // console.log("in 00------", data);

      setComment('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      document.querySelector(".popup")?.remove()
      popup("comment published successfully", true)
      if (props.onNewComment) {
        props.onNewComment(data)
      }
    } catch (err: any) {
      console.error("failed to send comment", err)
      document.querySelector(".popup")?.remove()
      popup(err, false)

    }
  }

  return (
    <div >
      {/* FORM */}
      <form onSubmit={(e) => handleComment(e)} className={styles.commentForm}>
        <div className={styles.inputWrapper}>
          <div className={styles.leftIcons}>
            <label htmlFor="postImage" className={styles.icon}>
              <span className={styles.uploadIcon}>
                <Image src="/img/postImg.svg" alt="Upload Icon" width={28} height={28} />
              </span>
            </label>
            <input id="postImage" type="file" name="file" className={styles.uploadImgBtn} ref={fileInputRef} />
          </div>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            type="text"
            name="content"
            className={styles.commentInput}
            placeholder="Add a comment..."
          />
          <button type="submit" className={styles.addCommentBtn}>
            <span className={styles.sendIcon}>➤</span>
          </button>

        </div>
      </form>
    </div>
  )
}
