import styles from "./posts.module.css";
import "../../app/globals.css";
import { useState, useEffect } from "react";
import React from "react";
import { useRef, useCallback } from "react";
import { PostComponent } from "./Post";
import { NewPOst } from "./AddPost";
// import { error } from "console";
import { fetchOldPosts } from "@/apiService/posts/prevPost";


export interface Post {
  id: string;
  userID: string;
  content: string;
  visibility: string;
  imag_post: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  profile_pic: string;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  profile_pic: string;
  first_name: string;
  last_name: string;
  birthday: string;
  about_me?: string;
  account_type: string;
}

const throttle = (func: (...args: any[]) => void, delay: number) => {
  let funcSchedule: NodeJS.Timeout | null = null
  return (...args: any[]) => {
    if (!funcSchedule) {
      func(...args)
      funcSchedule = setTimeout(() => {
        funcSchedule = null
      }, delay)
    }
  }
}


function Feed({ type }: { type: "home" | "group" }) {
  const [showFOrm, setShowForm] = useState(false)
  const [postedContent, setPostedContent] = useState<Post[]>([])
  const [currentPage, setPage] = useState(0)
  const [isLoading, setLoading] = useState(false)
  const [hasMOre, sethasMore] = useState(true)
  const observer = useRef<IntersectionObserver | null>(null)
  const [uniqueIDs, setUniqueIDs] = useState<Set<string>>(new Set())
  const [shouldFetch, setSOuldFetch] = useState(false)
  const delay = 1000

  const loadMOre = useCallback(async () => {
    if (!hasMOre || isLoading) return
    setLoading(true)
    try {
      const oldPOsts = await fetchOldPosts(currentPage)
      console.log("old dara", oldPOsts)
      if (!oldPOsts || oldPOsts.length == 0) {
        sethasMore(false)
        return
      }

      const uniquePosts = oldPOsts.filter((post) => !uniqueIDs.has(post.id))
      if (uniquePosts.length === 0) {
        setPage((prev) => prev + 1)
        return
      }

      await new Promise(show => setTimeout(show, 800))

      setUniqueIDs((prev) => {
        const newSet = new Set(prev)
        uniquePosts.forEach((post) => newSet.add(post.id))
        return newSet
      })

      setPostedContent((prev) => [...prev, ...uniquePosts])
    } catch (err) {
      console.error("error in loading posts", err)
    } finally {
      setLoading(false)
      setSOuldFetch(false)
    }
  }, [currentPage, hasMOre, uniqueIDs, isLoading])

  useEffect(() => {
    if (shouldFetch) {
      loadMOre()
    }
  }, [shouldFetch, loadMOre])

  useEffect(() => {
    if (postedContent.length === 0 && !isLoading && hasMOre) {
      loadMOre()
    }
  }, [postedContent.length, isLoading, hasMOre, loadMOre])

  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || !hasMOre) return
    if (observer.current) observer.current.disconnect()

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMOre) {
        setPage(prev => prev + 1)
        setSOuldFetch(true)
      }
    }, {
      rootMargin: '100px', threshold: 0.1
    })

    if (node) observer.current.observe(node)
  }, [isLoading, hasMOre])

  const handleNewPOst = (post: Omit<Post, "id">) => {
    const newPOst = { ...post, id: Date.now().toString() }
    setPostedContent(posted => [newPOst, ...posted])
    setUniqueIDs(prev => new Set(prev).add(newPOst.id))
  }

  const close = () => {
    setShowForm(!showFOrm)
  }
  const toggleFOrm = () => {
    setShowForm(!showFOrm)
  }

  return (
    <>
      <div className={`${styles.feed} ${styles[type]}`}>
        <div className={styles.toggleFOrm} onClick={toggleFOrm}>
          {<div className={styles.insideFOrm}>What's on your mind ??</div>}
        </div>
        {showFOrm && <NewPOst onSubmit={handleNewPOst} onClose={close} />}

        {currentPage === 0 && postedContent.length === 0 ?
          <div>EMPTY FEED</div>
          :
          <>
            {postedContent.map((post, index) => (
              <div className={styles.post} key={post.id} ref={index === postedContent.length - 1 ? lastPostElementRef : null}>
                <PostComponent post={post} />
              </div>
            )
            )}
            {/* {postedContent.length >= 2 && <button onClick={(e) => setPage(currentPage + 2)} className={styles.loadMore}>load more...</button>} */}
            {isLoading && (
              <div className={styles.loadingIndicator}>
                <div className={styles.loading}></div>
                Loading more posts...
              </div>
            )}

            {!hasMOre && !isLoading && (
              <div className={styles.noMorePosts}>
                no more posts to load - Check back later
              </div>
            )}
          </>
        }


      </div>
    </>
  )
}

export default Feed;
