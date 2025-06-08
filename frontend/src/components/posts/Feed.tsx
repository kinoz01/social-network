'use client'

import styles from "./posts.module.css";
import "../../app/globals.css";
import { useState, useEffect } from "react";
import React from "react";
import { useRef, useCallback } from "react";
import { PostComponent } from "./Post";
import { NewPOst } from "./AddPost";
import { fetchOldPosts } from "@/lib/prevPost";
import Image from "next/image";
import { Post } from "../../lib/types";
import { useUser } from "@/context/UserContext";
import { API_URL } from "@/lib/api_url";

export default function Feed({ type }: { type: "home" | "group" }) {
    const [showFOrm, setShowForm] = useState(false)
    const [postedContent, setPostedContent] = useState<Post[]>([])
    const [currentPage, setPage] = useState(0)
    const [isLoading, setLoading] = useState(false)
    const [hasMOre, sethasMore] = useState(true)
    const observer = useRef<IntersectionObserver | null>(null)
    const requestedPages = useRef<Set<number>>(new Set())

    const { user } = useUser();

    const loadMOre = useCallback(async () => {
        if (!hasMOre || isLoading || requestedPages.current.has(currentPage)) return
        requestedPages.current.add(currentPage)

        setLoading(true)
        try {
            const oldPosts = await fetchOldPosts(currentPage)
            if (!oldPosts || oldPosts.length === 0) {
                sethasMore(false)
                return
            }

            const uniquePosts = oldPosts.filter(
                (post) => !postedContent.some((p) => p.id === post.id)
            )
            if (uniquePosts.length === 0) {
                setPage((prev) => prev + 1)
                return
            }

            await new Promise((resolve) => setTimeout(resolve, 50))

            setPostedContent((prev) => [...prev, ...uniquePosts])
        } catch (err) {
            console.error("error in loading posts", err)
        } finally {
            setLoading(false)
        }
    }, [currentPage, hasMOre, postedContent, isLoading])

    useEffect(() => {
        loadMOre()
    }, [currentPage, loadMOre])

    const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
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

    const handleNewPOst = (post: Post) => {
        const newPOst = { ...post }
        setPostedContent(posted => [newPOst, ...posted])
    }

    const toggleFOrm = () => {
        setShowForm(!showFOrm)
    }

    return (
        <>
            <div className={`${styles.feed} ${styles[type]}`}>
                <div className={styles.toggleFOrm} onClick={toggleFOrm}>
                    {<div className={styles.insideFOrm}>
                        <Image
                            src={user?.profile_pic ? `${API_URL}/api/storage/avatars/${user.profile_pic}` : "/img/default-avatar.png"}
                            alt=""
                            width={40}
                            height={40}
                            className={styles.userIcon}
                        />
                        What's on your mind, {user && user.first_name?.toUpperCase()} ??
                    </div>}
                </div>
                {showFOrm && <NewPOst onSubmit={handleNewPOst} onClose={toggleFOrm} userData={user} />}

                {currentPage === 0 && postedContent.length === 0 ?
                    <div className={styles.status}>
                        <p>EMPTY FEED.</p>
                        <Image src="/img/empty.svg" alt="" width={200} height={200} />
                    </div>
                    :
                    <>
                        {postedContent.map((post, index) => (
                            <div className={styles.post} key={post.id} ref={index === postedContent.length - 1 ? lastPostElementRef : null}>
                                <PostComponent post={post} />
                            </div>
                        )
                        )}

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
