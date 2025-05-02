"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "../style/groups.module.css";
import LoadingSpinner from "@/components/Loading";
import CreateGroupModal from "./CreateGroup";
import { useRouter } from "next/navigation";

interface Group {
    id: string;
    group_name: string;
    group_pic: string;
    description: string;
    request?: string;
    members?: number;
    invitation_id?: string;
}

export default function GroupCard({ title }: { title: string }) {
    const router = useRouter();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [openModal, setOpenModal] = useState(false);
    const [activeInfoId, setActiveInfoId] = useState<string | null>(null);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                let url = "";
                if (title === "Your Groups") {
                    url = `${process.env.NEXT_PUBLIC_API_URL}/api/groups/owned`;
                } else if (title === "Joined Groups") {
                    url = `${process.env.NEXT_PUBLIC_API_URL}/api/groups/joined`;
                } else if (title === "Available Groups") {
                    url = `${process.env.NEXT_PUBLIC_API_URL}/api/groups/available`;
                } else if (title === "Invitations") {
                    url = `${process.env.NEXT_PUBLIC_API_URL}/api/groups/invitations`;
                }

                if (url) {
                    const res = await fetch(url, { credentials: "include" });
                    if (!res.ok) throw new Error("Failed to fetch groups");
                    const data = await res.json();
                    setGroups(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Group fetch error:", err);
                setGroups([]);
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, [title, openModal]);

    const handleJoinRequest = async (groupId: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ group_id: groupId }),
            });
            if (!res.ok) throw new Error("Failed to send join request");
            setGroups((prev) =>
                prev.map((group) =>
                    group.id === groupId ? { ...group, request: "pending" } : group
                )
            );
        } catch (err) {
            console.error("Join request error:", err);
        }
    };

    const handleAcceptInvitation = async (invId: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/invitations/accept`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ invitation_id: invId }),
            });
            if (!res.ok) throw new Error("Accept failed");
            setGroups((prev) => prev.filter((g) => g.invitation_id !== invId));
        } catch (err) {
            console.error("Accept invitation error:", err);
        }
    };

    const handleRefuseInvitation = async (invId: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/invitations/refuse`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ invitation_id: invId }),
            });
            if (!res.ok) throw new Error("Refuse failed");
            setGroups((prev) => prev.filter((g) => g.invitation_id !== invId));
        } catch (err) {
            console.error("Refuse invitation error:", err);
        }
    };

    const renderGroup = (group: Group, manageOnly = false) => {
        const isYourOrJoined = title === "Your Groups" || title === "Joined Groups";
        const isInfoVisible = activeInfoId === group.id;

        return (
            <div
                key={group.id}
                className={styles.groupEntry}
                onClick={(e) => {
                    // Prevent navigation when clicking the info icon
                    if ((e.target as HTMLElement).closest(`.${styles.infoIcon}`)) return;
                    router.push(`/groups/${group.id}`);
                }}
                style={{ position: "relative" }}
            >
                <div className={styles.groupIcon}>
                    <Image
                        src={
                            group.group_pic
                                ? `${process.env.NEXT_PUBLIC_API_URL}/api/storage/group_pics/${group.group_pic}`
                                : "/img/default-group.jpg"
                        }
                        alt={group.group_name}
                        width={50}
                        height={50}
                        style={{ borderRadius: '50%', objectFit: 'cover' }}
                    />
                </div>

                <div className={styles.groupDetails}>
                    <span className={styles.groupName}>{group.group_name}</span>
                    <span className={styles.groupMembers}>
                        {group.members !== undefined
                            ? `${group.members} Member${group.members === 1 ? "" : "s"}`
                            : "okok"}
                    </span>
                </div>

                {title === "Available Groups" ? (
                    group.request === "pending" ? (
                        <span className={styles.pendingText}>Pending</span>
                    ) : (
                        <button
                            className={styles.groupBtn}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleJoinRequest(group.id);
                            }}
                        >
                            Join Group
                        </button>
                    )
                ) : title === "Invitations" ? (
                    <div className={styles.invitationActions}>
                        <button
                            className={styles.groupBtn}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptInvitation(group.invitation_id!);
                            }}
                        >
                            Accept
                        </button>
                        <button
                            className={styles.groupBtn}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRefuseInvitation(group.invitation_id!);
                            }}
                        >
                            Refuse
                        </button>
                    </div>
                ) : isYourOrJoined ? (
                    <div
                        className={styles.infoIcon}
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveInfoId(isInfoVisible ? null : group.id);
                        }}
                    >
                        <Image src="/img/info-icon.svg" alt="Info" width={22} height={22} />
                    </div>
                ) : (
                    <button className={styles.groupBtn}>
                        {manageOnly ? "Manage" : "View"}
                    </button>
                )}

                {isYourOrJoined && isInfoVisible && (
                    <div
                        className={styles.descriptionPopover}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p>{group.description}</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {openModal && <CreateGroupModal onClose={() => setOpenModal(false)} />}
            <div className={styles.groupCard}>
                <h3>{title}</h3>
                <div className={styles.groupCardContent}>
                    {loading ? (
                        <LoadingSpinner />
                    ) : groups.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Image src="/img/empty.svg" alt="No groups" width={150} height={150} />
                            {title === "Your Groups" ? (
                                <>
                                    <p>You have no groups yet.</p>
                                    <button className={styles.groupBtn} onClick={() => setOpenModal(true)}>Create a Group</button>
                                </>
                            ) : title === "Available Groups" ? (
                                <p>No available groups right now.</p>
                            ) : title === "Invitations" ? (
                                <p>No invitations.</p>
                            ) : (
                                <p>You are not part of any group yet.<br />Join a group.</p>
                            )}
                        </div>
                    ) : (
                        groups.map((group) => renderGroup(group, title === "Your Groups"))
                    )}
                </div>
            </div>
        </>
    );
}
