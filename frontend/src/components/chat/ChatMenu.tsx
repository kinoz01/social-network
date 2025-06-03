"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Loading from "@/components/Loading";
import { throttle } from "@/components/utils";
import { API_URL } from "@/lib/api_url";
import styles from "./style/chatMenu.module.css";

/* ───────── type from handler ───────── */
interface Person {
    id: string;
    first_name: string;
    last_name: string;
    profile_pic: string | null;
    iFollow: boolean;
    followsMe: boolean;
}

/* ───────── constants ───────── */
const SLICE = 50;

export default function ChatMenu() {
    const [list, setList] = useState<Person[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setMore] = useState(true);
    const [loading, setLoad] = useState(false);

    const [q, setQ] = useState("");
    const boxRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    // Fetch a "slice" of users
    const fetchSlice = async (off = 0, qry = ""): Promise<Person[]> => {
        const qs = new URLSearchParams({
            limit: String(SLICE),
            offset: String(off),
            q: qry,
        }).toString();
        const res = await fetch(`${API_URL}/api/chat/list?${qs}`, {
            credentials: "include",
        });
        if (res.status === 204) return [];
        if (!res.ok) throw new Error("fetch error");
        return res.json();
    };

    // Initial load and search
    const runSearch = useCallback(
        async (qry: string) => {
            setQ(qry);
            setLoad(true);
            try {
                const slice = await fetchSlice(0, qry);
                setList(slice);
                setOffset(slice.length);
                setMore(slice.length === SLICE);
            } finally {
                setLoad(false);
            }
        },
        []
    );

    useEffect(() => {
        runSearch("");
    }, [runSearch]);

    // Infinite scroll (load next slice when near bottom)
    useEffect(() => {
        const el = boxRef.current;
        if (!el) return;
        const handler = throttle(() => {
            if (loading || !hasMore) return;
            const nearBottom =
                el.scrollHeight - el.scrollTop - el.clientHeight < 200;
            if (nearBottom) {
                (async () => {
                    setLoad(true);
                    try {
                        const slice = await fetchSlice(offset, q);
                        setList((prev) => [...prev, ...slice]);
                        setOffset((o) => o + slice.length);
                        setMore(slice.length === SLICE);
                    } finally {
                        setLoad(false);
                    }
                })();
            }
        }, 300);
        el.addEventListener("scroll", handler);
        return () => el.removeEventListener("scroll", handler);
    }, [offset, q, hasMore, loading]);

    return (
        <aside className={styles.menu}>
            <h4 className={styles.section}>AVAILABLE USERS</h4>

            <input
                className={styles.search}
                placeholder="Search users…"
                value={q}
                onChange={(e) => runSearch(e.target.value)}
            />

            <div ref={boxRef} className={styles.list}>
                {list.length === 0 && !loading ? (
                    <p className={styles.end}>— user not found —</p>
                ) : (
                    list.map((p) => {
                        const href = `/chat/${p.id}`;
                        const isSelected = pathname === href;

                        return (
                            <Link
                                key={p.id}
                                href={href}
                                className={`${styles.item} ${isSelected ? styles.selected : ""
                                    }`}
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
                                        <Image
                                            src="/img/following.svg"
                                            alt="You follow"
                                            width={16}
                                            height={16}
                                        />
                                    </span>
                                )}

                                {p.followsMe && !p.iFollow && (
                                    <span className={styles.badge} title="Follows you">
                                        <Image
                                            src="/img/followed-by.svg"
                                            alt="Follows you"
                                            width={16}
                                            height={16}
                                        />
                                    </span>
                                )}

                                {p.iFollow && p.followsMe && (
                                    <span className={styles.badge} title="Mutual follow">
                                        <Image
                                            src="/img/mutual-follow.svg"
                                            alt="Mutual follow"
                                            width={16}
                                            height={16}
                                        />
                                    </span>
                                )}
                            </Link>
                        );
                    })
                )}

                {loading && <Loading />}
                {!hasMore && !loading && offset > SLICE && (
                    <p className={styles.end}>— end —</p>
                )}
            </div>
        </aside>
    );
}
