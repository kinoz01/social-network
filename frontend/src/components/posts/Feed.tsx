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
import GroupPostInput from "./groupPostInput";
import Loading from "../Loading";
import ProfileHeader from "../profile/ProfileHeader";

// id is the profile id or group id
export default function Feed({ type, id }: { type?: string, id?: string }) {
    const [showFOrm, setShowForm] = useState(false)
    const [postedContent, setPostedContent] = useState<Post[]>([])
    const [currentPage, setPage] = useState(0)
    const [isLoading, setLoading] = useState(true)
    const [hasMOre, sethasMore] = useState(true)
    const [profileNotFound, setProfileNotFound] = useState(false);
    const [privateProfile, setPrivateProfile] = useState(false)

    const observer = useRef<IntersectionObserver | null>(null)
    const requestedPages = useRef<Set<number>>(new Set())

    const { user } = useUser();

    const loadMOre = useCallback(async () => {
        if (!hasMOre || requestedPages.current.has(currentPage)) return
        requestedPages.current.add(currentPage)

        setLoading(true)
        try {
            const oldPosts = await fetchOldPosts(currentPage, type, id)
            if (!oldPosts || oldPosts.length === 0) {
                sethasMore(false)
                return
            }

            
            console.log("----------------------////////-------", oldPosts);
            
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
            const { status } = err as { status: number };
            if (status === 404) {
                setProfileNotFound(true);
                sethasMore(false);
            } else if (status === 206) {
                setPrivateProfile(true);
                sethasMore(false);
            } else {
                console.error("error loading posts", err);
            }
        } finally {
            setLoading(false)
        }
    }, [currentPage, hasMOre, postedContent, isLoading])

    useEffect(() => {
        loadMOre()
        console.log("//////////////////////////////////////////////--");
        
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

    const showProfileHeader = type === "profile" && !(isLoading && currentPage === 0) && !profileNotFound;

    return (
        <>
            <div className={`${styles.feed}`}>
                {type === "home" && (
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
                )}
                {showFOrm && <NewPOst onSubmit={handleNewPOst} onClose={toggleFOrm} userData={user} />}
                {/* //here */}
                {showProfileHeader && <ProfileHeader profileId={id} />}

                {type === "group" && <GroupPostInput groupId={id} onAdd={handleNewPOst} />}

                {currentPage === 0 && postedContent.length === 0 && !isLoading ?
                    <div className={styles.status}>
                        <Image src={`/img/${privateProfile && type === "profile" ? "lock.svg" : "empty.svg"}`} alt="" width={200} height={200} />
                        <p className={styles.empty}>{profileNotFound && type === "profile" ? "User Not Found"
                            : privateProfile && type === "profile" ? "This Profile Is Private"
                                : "Empty Feed"}</p>
                    </div>
                    :
                    <>
                        {postedContent.map((post, index) => (
                            <div className={styles.post} key={post.id} ref={index === postedContent.length - 1 ? lastPostElementRef : null}>
                                <PostComponent post={post} type={type} />
                            </div>
                        )
                        )}
                        {isLoading && (<Loading />)}

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
