"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Loading from "@/components/Loading";
import { throttle } from "@/lib/utils";
import { API_URL } from "@/lib/api_url";
import styles from "../chat/style/chatMenu.module.css";

interface Person {
    id: string;
    first_name: string;
    last_name: string;
    profile_pic: string | null;
    iFollow: boolean;
    followsMe: boolean;
}

const SLICE = 50;

export default function UserSearchMenu() {
    const pathname = usePathname();
    const boxRef = useRef<HTMLDivElement>(null);

    const [q, setQ] = useState("");
    const [list, setList] = useState<Person[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setMore] = useState(false);
    const [loading, setLoad] = useState(false);

    // fetch helper
    const fetchSlice = async (off = 0, query = ""): Promise<Person[]> => {
        const qs = new URLSearchParams({
            limit: String(SLICE),
            offset: String(off),
            q: query,
        }).toString();
        const r = await fetch(`${API_URL}/api/users/search?${qs}`,
            { credentials: "include" });
        if (r.status === 204) return [];
        if (!r.ok) throw new Error("fetch error");
        return r.json();
    };

    // search runner
    const runSearch = useCallback(async (query: string) => {
        const trimmed = query.trim();
        setQ(trimmed);
        setList([]);
        setOffset(0);
        setMore(false);
        if (!trimmed) return;                 // keep list empty

        setLoad(true);
        try {
            const slice = await fetchSlice(0, trimmed);
            setList(slice);
            setOffset(slice.length);
            setMore(slice.length === SLICE);
        } finally {
            setLoad(false);
        }
    }, []);

    // infinite scroll when list is showing
    useEffect(() => {
        const el = boxRef.current;
        if (!el || !hasMore || loading) return;
        const h = throttle(() => {
            if (!hasMore || loading) return;
            const nearBottom =
                el.scrollHeight - el.scrollTop - el.clientHeight < 200;
            if (nearBottom) {
                (async () => {
                    setLoad(true);
                    try {
                        const slice = await fetchSlice(offset, q);
                        setList(prev => [...prev, ...slice]);
                        setOffset(o => o + slice.length);
                        setMore(slice.length === SLICE);
                    } finally {
                        setLoad(false);
                    }
                })();
            }
        }, 300);
        el.addEventListener("scroll", h);
        return () => el.removeEventListener("scroll", h);
    }, [offset, q, hasMore, loading]);

    return (
        <aside className={`${styles.menu} ${styles.rightMenu}`}>
            <h4 className={styles.section}>SEARCH USERS</h4>

            <input
                className={styles.search}
                placeholder="Type a name…"
                value={q}
                onChange={(e) => runSearch(e.target.value)}
            />

            {/*  list is empty until first search  */}
            {q === "" && (
                <p className={styles.hint}>Please type to search.</p>
            )}

            <div ref={boxRef} className={styles.list}>
                {list.length === 0 && q !== "" && !loading && (
                    <p className={styles.end}>— no users —</p>
                )}

                {list.map((p) => {
                    const href = `/profile/${p.id}`;
                    const isSelected = pathname === href;

                    return (
                        <Link
                            key={p.id}
                            href={href}
                            className={`${styles.item} ${isSelected ? styles.selected : ""}`}
                        >
                            <Image
                                src={
                                    p.profile_pic
                                        ? `${API_URL}/api/storage/avatars/${p.profile_pic}`
                                        : "/img/default-avatar.png"
                                }
                                alt=""
                                width={32}
                                height={32}
                                className={styles.avt}
                            />

                            <span className={styles.name}>
                                {p.first_name} {p.last_name}
                            </span>

                            {p.iFollow && !p.followsMe && (
                                <span className={styles.badge} title="You follow">
                                    <Image src="/img/following.svg" alt="" width={16} height={16} />
                                </span>
                            )}
                            {p.followsMe && !p.iFollow && (
                                <span className={styles.badge} title="Follows you">
                                    <Image src="/img/followed-by.svg" alt="" width={16} height={16} />
                                </span>
                            )}
                            {p.iFollow && p.followsMe && (
                                <span className={styles.badge} title="Mutual follow">
                                    <Image src="/img/mutual-follow.svg" alt="" width={16} height={16} />
                                </span>
                            )}
                        </Link>
                    );
                })}

                {loading && <Loading />}
                {!hasMore && !loading && list.length >= SLICE && (
                    <p className={styles.end}>— end —</p>
                )}
            </div>
        </aside>
    );
}