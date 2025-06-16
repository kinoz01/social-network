import Image from "next/image";
import style from "../posts/posts.module.css";
import styles from "./comments.module.css";
import { User, CommentInfo } from "../../lib/types";
import { createPortal } from "react-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import { COmmentComponent, CommentForm } from "./AddComments";
import { COmmentsGetter } from "@/lib/prevPost";

type Params = {
  userData: User | null
  postID: string
  postCreator: string
  onClose: () => void
  onCOmmentAdded: () => void
}

export default function Comment(props: Params) {
  const [curentPage, setPage] = useState(0)
  const [postedComments, setNewComments] = useState<CommentInfo[]>([]);
  const observer = useRef<IntersectionObserver | null>(null)
  const [hasMOre, sethasMore] = useState(true)
  const [isLoading, setLoading] = useState(false)
  const requestedPages = useRef<Set<number>>(new Set())

  const loadMOre = useCallback(async () => {
    if (!hasMOre || isLoading || requestedPages.current.has(curentPage)) return
    requestedPages.current.add(curentPage)

    setLoading(true)
    try {
      const oldComments = await CommentsGetter({ postID: props.postID, page: curentPage })
      if (!oldComments || oldComments.length === 0) {
        sethasMore(false)
        return
      }

      const uniqueCOmments = oldComments.filter(
        (comment) => !postedComments.some((p) => p.commentId === comment.commentId)
      )
      if (uniqueCOmments.length === 0) {
        setPage((prev) => prev + 1)
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 50))

      setNewComments((prev) => [...prev, ...uniqueCOmments])
    } catch (err) {
      console.error("error in loading comments", err)
    } finally {
      setLoading(false)
    }
  }, [curentPage, hasMOre, postedComments, isLoading])

  useEffect(() => {
    loadMOre()
  }, [curentPage, loadMOre])

  const lastCOmmentElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || !hasMOre) return
    if (observer.current) observer.current.disconnect()

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMOre) {
        setPage((prev) => prev + 1)
      }
    }, {
      rootMargin: '100px', threshold: 0.1
    })

    if (node) observer.current.observe(node)
  }, [isLoading, hasMOre])

  const handleNewCOmment = (newComment: CommentInfo) => {
    setNewComments(prev => [newComment, ...prev])
  }

  const modal = (
    <div className={styles.backdrop} onClick={props.onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={props.onClose}>
          ×
        </button>

        <h3 className={styles.title}>{props.postCreator}'s Post</h3>

        <div className={styles.listBox}>
          {postedComments.length > 0 ?
            (
              <>
                {postedComments.map((c, index) => (
                  <div
                    key={c.commentId}
                    className={styles.item}
                    ref={index === postedComments.length - 1 ? lastCOmmentElementRef : null}
                  >
                    <COmmentComponent comments={c} onClick={props.onClose}/>
                  </div>
                ))}

                {isLoading && (
                  <div className={style.loadingIndicator}>
                    <div className={style.loading}></div>
                    Loading more comments...
                  </div>
                )}

                {!hasMOre && !isLoading && curentPage > 3 && (
                  <div className={style.noMorePosts}>
                    no more comments to load - Check back later
                  </div>
                )}
              </>
            )
            :
            (<div className={styles.empty}>
              <Image src="/img/empty.svg" alt="empty" width={150} height={150} />
              <p>No comments yet</p>
            </div>)
          }
          <div id="comment-Loader" style={{ height: 1 }}></div>
        </div>


        <CommentForm userData={props.userData} postID={props.postID} onCOmmentAdded={props.onCOmmentAdded} onNewCOmment={handleNewCOmment} />

      </div>
    </div >
  )

  return createPortal(modal, document.body)
}
