"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./notifications.module.css";
import { NotificationModel } from "@/lib/types";
import { API_URL } from "@/lib/api_url";
import TimeAgo from "../groups/TimeAgo";
import { addFollower } from "@/lib/followers";
import { useFollowSync } from "@/context/FollowSyncContext";

interface Props {
    n: NotificationModel;
    onRemove: (id: string) => void;
}

export default function NotificationItem({ n, onRemove }: Props) {
    const [busy, setBusy] = useState(false);
    const { refresh } = useFollowSync()

    /* ───────── helpers ───────── */
    const dropFromServer = async () =>
        fetch(`${API_URL}/api/delete-notification?id=${n.id}`, {
            method: "DELETE",
            credentials: "include",
        });

    const close = async () => {
        if (busy) return;
        setBusy(true);
        await dropFromServer();
        onRemove(n.id);
    };

    /* ========== group invitation ========== */
    const acceptInvitation = async () => {
        if (busy) return;
        setBusy(true);
        await fetch(`${API_URL}/api/groups/accept-invitation`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ invitation_id: n.invitationId }),
        });
        onRemove(n.invitationId || n.id);
    };

    const rejectInvitation = async () => {
        if (busy) return;
        setBusy(true);
        await fetch(`${API_URL}/api/groups/refuse-invitation`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ invitation_id: n.invitationId }),
        });
        onRemove(n.invitationId || n.id);
    };

    /* ========== join request ========== */
    const acceptJoinRequest = async () => {
        if (busy) return;
        setBusy(true);
        await fetch(`${API_URL}/api/groups/accept-request`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ request_id: n.requestId }),
        });
        onRemove(n.requestId || n.id);
    };

    const rejectJoinRequest = async () => {
        if (busy) return;
        setBusy(true);
        await fetch(`${API_URL}/api/groups/refuse-request`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ request_id: n.requestId }),
        });
        onRemove(n.requestId || n.id);
    };


    /* ========== event response (Going / Not-going) ========== */
    const respondToEvent = async (choice: "going" | "not_going") => {
        if (busy) return;
        setBusy(true);
        await fetch(`${API_URL}/api/groups/event-response?group_id=${n.groupId}`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_id: n.eventId, response: choice }),
        });
        onRemove(n.eventId || n.id); // remove the notification from front
    };

    const handleAction = async (
        action: "accepted" | "rejected",
    ) => {
        await addFollower(
            {
                action,
                status: action,
                followerID: n.sender.id,
                followedId: n.receiver,
            },
            "/api/followers/add"
        );
        onRemove(n.followId || n.id);
        refresh()
    };

    /* ───────── render ───────── */
    return (
        <div className={styles.notification}>
            <button
                className={styles.closeBtn}
                disabled={busy}
                onClick={close}
                aria-label="Close"
            >
                ×
            </button>

            <div className={styles.info}>
                <Image
                    className={styles.profilePic}
                    src={
                        n.sender.profile_pic
                            ? `${API_URL}/api/storage/avatars/${n.sender.profile_pic}`
                            : "/img/default-avatar.png"
                    }
                    alt=""
                    width={40}
                    height={40}
                    priority
                />

                <div className={styles.text}>
                    <Link className={styles.link} href={`/profile/${n.sender.id}`}>
                        @{`${n.sender.first_name} ${n.sender.last_name}`}
                    </Link>
                    <div className={styles.content}>{formatContent(n.content, n.groupId)}</div>
                </div>
            </div>

            <div className={styles.date}>
                <TimeAgo dateStr={n.createdAt} />
            </div>

            {/* ====== actions by type ====== */}
            {n.type === "group_invite" && (
                <div className={styles.options}>
                    <button onClick={acceptInvitation} disabled={busy}>
                        Accept
                    </button>
                    <button onClick={rejectInvitation} disabled={busy}>
                        Reject
                    </button>
                </div>
            )}

            {n.type === "join_request" && (
                <div className={styles.options}>
                    <button onClick={acceptJoinRequest} disabled={busy}>
                        Accept
                    </button>
                    <button onClick={rejectJoinRequest} disabled={busy}>
                        Reject
                    </button>
                </div>
            )}

            {n.type === "event_created" && (
                <div className={styles.options}>
                    <button onClick={() => respondToEvent("going")} disabled={busy}>
                        Going
                    </button>
                    <button onClick={() => respondToEvent("not_going")} disabled={busy}>
                        Not going
                    </button>
                </div>
            )}
            {n.type === "follow_request" && (
                <div className={styles.options}>
                    <button onClick={() => handleAction("accepted")} disabled={busy}>
                        Accept
                    </button>
                    <button onClick={() => handleAction("rejected")} disabled={busy}>
                        Reject
                    </button>
                </div>
            )}
        </div>
    );
}

function formatContent(text: string, groupId?: string) {    
    const parts = text.split(/('.*?')/); // keep quoted chunks
    const isEvent = /event/i.test(text); // contains the event"

    return parts.map((part, i) => {
        const isQuoted = part.startsWith("'") && part.endsWith("'");
        
        if (isQuoted && isEvent && groupId) {
            return (
                <Link
                    key={i}
                    href={`/groups/${groupId}/events`}
                    className={styles.highlighted}
                >
                    {part}
                </Link>
            );
        }

        if (isQuoted) {
            return (
                <span key={i} className={styles.highlighted}>
                    {part}
                </span>
            );
        }

        return <span key={i}>{part}</span>;
    });
}