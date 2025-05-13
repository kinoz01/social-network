"use client";

import { useEffect, useState, startTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./style/groups.module.css";
import LoadingSpinner from "@/components/Loading";
import CreateGroupModal from "../groups/CreateGroup";

interface Group {
    id: string;
    group_name: string;
    group_pic: string;
    description: string;
    request?: string;        // for Available Groups
    members?: number;
    invitation_id?: string;  // Invitations
    invitation_status?: "pending" | "rejected";
}

export default function GroupCard({
    title,
    onAccept,
    refreshKey,
}: {
    title: string;
    onAccept?: () => void;
    refreshKey?: number;
}) {
    const router = useRouter();

    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpen] = useState(false);
    const [activeInfo, setInfo] = useState<string | null>(null);

    /* ---------- fetch list ---------- */
    const fetchList = async () => {
        try {
            setLoading(true);
            let url = "";
            if (title === "Your Groups") url = `${process.env.NEXT_PUBLIC_API_URL}/api/groups/owned`;
            else if (title === "Joined Groups") url = `${process.env.NEXT_PUBLIC_API_URL}/api/groups/joined`;
            else if (title === "Available Groups") url = `${process.env.NEXT_PUBLIC_API_URL}/api/groups/available`;
            else if (title === "Invitations") url = `${process.env.NEXT_PUBLIC_API_URL}/api/groups/invitations`;

            if (url) {
                const res = await fetch(url, { credentials: "include" });
                if (!res.ok) throw new Error();
                const data = await res.json();
                setGroups(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error(err);
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchList(); }, [title, openModal, refreshKey])

    /* ---------- invitation actions ---------- */
    const refreshInvitations = () => fetchList();

    const handleAccept = async (id: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/accept-invitation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ invitation_id: id }),
            });
            if (!res.ok) throw new Error();
            refreshInvitations();
            onAccept?.();
        } catch (err) { console.error(err); }
    };

    const handleRefuse = async (id: string) => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/groups/refuse-invitation`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ invitation_id: id }),
                }
            );
            if (!res.ok) throw new Error();

            /* --- instant UI update: drop the card locally --- */
            setGroups(prev => prev.filter(g => g.invitation_id !== id));

            /* no need to fetch again; server already stored rejected */
        } catch (err) {
            console.error(err);
        }
    };

    /* ---------- join request ---------- */
    const handleJoin = async (groupId: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/join-request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ group_id: groupId }),
            });
            if (!res.ok) throw new Error();
            setGroups(prev =>
                prev.map(g => g.id === groupId ? { ...g, request: "pending" } : g));
        } catch (err) { console.error(err); }
    };

    /* ---------- card renderer ---------- */
    const renderGroup = (g: Group) => {
        const isYourOrJoined = title === "Your Groups" || title === "Joined Groups";
        const isAvailable = title === "Available Groups";
        const isInvitation = title === "Invitations";
        const canNavigate = isYourOrJoined;
        const showInfo = isYourOrJoined || isAvailable || isInvitation;
        const infoOpen = activeInfo === g.id;

        return (
            <div
                key={g.id}
                className={`${styles.groupEntry} ${!canNavigate ? styles.noLink : ""}`}
                onClick={(e) => {
                    if (!canNavigate) return;
                    if ((e.target as HTMLElement).closest(`.${styles.infoIcon}`)) return;
                    router.push(`/groups/${g.id}`);
                }}
            >
                {/* avatar */}
                <div className={styles.groupIcon}>
                    <Image
                        src={g.group_pic
                            ? `${process.env.NEXT_PUBLIC_API_URL}/api/storage/groups_avatars/${g.group_pic}`
                            : "/img/default-group.jpg"}
                        alt={g.group_name}
                        width={50} height={50} style={{ borderRadius: "50%", objectFit: "cover" }}
                    />
                </div>

                {/* name + members */}
                <div className={styles.groupDetails}>
                    <span className={styles.groupName}>{g.group_name}</span>
                    <span className={styles.groupMembers}>
                        {g.members != null ? `${g.members} Member${g.members === 1 ? "" : "s"}` : ""}
                    </span>
                </div>

                {/* info icon + popover */}
                {showInfo && (
                    <div
                        className={styles.infoWrapper}
                        onClick={(e) => { e.stopPropagation(); setInfo(infoOpen ? null : g.id); }}
                    >
                        <Image
                            src="/img/info-icon.svg"
                            alt="info"
                            width={18}
                            height={18}
                            className={styles.infoIcon}
                        />

                        {infoOpen && (
                            <div className={styles.descriptionPopover}>{g.description}</div>
                        )}
                    </div>
                )}

                {/* right edge action */}
                {isAvailable ? (
                    g.request === "pending" ? (
                        <span className={styles.pendingText}>Pending</span>
                    ) : (
                        <button className={styles.joinBtn} onClick={(e) => {
                            e.stopPropagation(); handleJoin(g.id);
                        }}>Join</button>
                    )
                ) : isInvitation ? (
                    g.invitation_status === "rejected" ? (
                        <span className={styles.refusedText}>Rejected</span>
                    ) : (
                        <div className={styles.invitationActions}>
                            <button className={styles.inviteBtn} onClick={(e) => {
                                e.stopPropagation(); handleAccept(g.invitation_id!);
                            }}>
                                <Image src="/img/accept.svg" alt="accept" width={22} height={22} />
                            </button>
                            <button className={styles.inviteBtn} onClick={(e) => {
                                e.stopPropagation(); handleRefuse(g.invitation_id!);
                            }}>
                                <Image src="/img/refuse.svg" alt="refuse" width={22} height={22} />
                            </button>
                        </div>
                    )
                ) : null}
            </div>
        );
    };

    /* ---------- JSX ---------- */
    return (
        <>
            {openModal && <CreateGroupModal onClose={() => setOpen(false)} />}

            <div className={styles.groupCard}>
                <div className={styles.cardHeader}>
                    <h3>{title}</h3>
                    {title === "Your Groups" && (
                        <button className={styles.groupCreateBtn} onClick={() => setOpen(true)}>
                            Create
                        </button>
                    )}
                </div>

                <div className={styles.groupCardContent}>
                    {loading ? <LoadingSpinner /> : (
                        groups.length === 0 ? (
                            <div className={styles.emptyState}>
                                <Image src="/img/empty.svg" alt="empty" width={150} height={150} />
                                {title === "Your Groups"
                                    ? <p>You have no groups yet.</p>
                                    : title === "Available Groups"
                                        ? <p>No available groups right now.</p>
                                        : title === "Invitations"
                                            ? <p>No invitations.</p>
                                            : <p>You didn't join any group yet.<br />Join a group.</p>
                                }
                            </div>
                        ) : groups.map(renderGroup)
                    )}
                </div>
            </div>
        </>
    );
}
