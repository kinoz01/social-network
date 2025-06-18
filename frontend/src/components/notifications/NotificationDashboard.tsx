"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./notifications.module.css";
import Loading from "../Loading";
import NoData from "../NoData";
import NotificationItem from "./Notification";
import { useWS } from "@/context/wsClient";
import { throttle } from "@/lib/utils";
import { NotificationModel } from "@/lib/types";
import { API_URL } from "@/lib/api_url";

const LIMIT = 10;

export default function NotificationDashboard() {
    const {
        wsOpen,
        notifications,
        getNotifications,
        deleteNotification, // removes locally
    } = useWS();

    /* ───────── local state ───────── */
    const [items, setItems] = useState<NotificationModel[]>(notifications);
    const pageRef = useRef(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setMore] = useState(true);
    const [confirmOpen, setConfirmOpen] = useState(false); // modal flag

    /* ───────── sync from provider ───────── */
    useEffect(() => {
        setItems(notifications);
        setLoading(false);
        if (notifications.length % LIMIT !== 0) setMore(false);
    }, [notifications]);

    /* ───────── initial fetch ───────── */
    useEffect(() => {
        if (!wsOpen) return;
        if (notifications.length > 0) return;
        setLoading(true);
        getNotifications(1, LIMIT);
        pageRef.current = 2;
    }, [wsOpen]);

    /* ───────── infinite scroll ───────── */
    const boxRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = boxRef.current;
        if (!el) return;

        const handle = throttle(() => {
            if (loading || !hasMore) return;
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 250) {
                setLoading(true);
                getNotifications(pageRef.current, LIMIT);
                pageRef.current += 1;
            }
        }, 250);

        el.addEventListener("scroll", handle);
        return () => el.removeEventListener("scroll", handle);
    }, [loading, hasMore]);

    /* ───────── helpers ───────── */
    const drop = (key: string) => {
        setItems((prev) => prev.filter((n) =>
            n.id !== key &&
            n.invitationId !== key &&
            n.requestId !== key &&
            n.eventId !== key &&
            n.followId !== key,
        ));
        deleteNotification(key);
    };

    const clearAll = async () => {
        setConfirmOpen(false);
        setLoading(true);
        await fetch(`${API_URL}/api/clear-notifications`, {
            method: "DELETE",
            credentials: "include",
        });
        setItems([]);
        deleteNotification("ALL");
        setLoading(false);
        setMore(false);
    };

    /* ───────── JSX ───────── */
    return (
        <div className={styles.notificationDashboard} ref={boxRef}>
            <div className={styles.controlsRow}>
                <button
                    className={styles.clearAll}
                    onClick={() => setConfirmOpen(true)}
                    disabled={items.length === 0}
                >
                    Clear all
                </button>
            </div>

            <div className={styles.notifications}>
                {items.length === 0 && !loading && <NoData msg="No Notifications Yet!" />}

                {items.map((n) => (
                    <NotificationItem key={n.id} n={n} onRemove={drop} />
                ))}

                {!hasMore && notifications.length > LIMIT && (
                    <p className={styles.noMore}>No more notifications</p>
                )}
                {loading && <Loading />}
            </div>

            {/* ───────── confirmation modal ───────── */}
            {confirmOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setConfirmOpen(false);
                    }}
                >
                    <div className={styles.modalCard}>
                        <button
                            className={styles.modalClose}
                            onClick={() => setConfirmOpen(false)}
                            aria-label="Close"
                        >
                            ×
                        </button>
                        <p>Delete all notifications?</p>
                        <div className={styles.modalBtns}>
                            <button onClick={clearAll} className={styles.yesBtn}>
                                Yes, delete
                            </button>
                            <button onClick={() => setConfirmOpen(false)} className={styles.noBtn}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
