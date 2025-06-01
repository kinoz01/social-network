"use client";

import { useState } from "react";
import GroupCard from "./GroupCard";
import styles from "./style/groups.module.css";

export default function GroupsGrid() {
    const [joinedRefreshKey, setJoinedRefreshKey] = useState(0);

    return (
        <div className={styles.groupsContent}>
            <div className={styles.groupGrid}>
                <GroupCard title="Your Groups" />
                <GroupCard title="Joined Groups" refreshKey={joinedRefreshKey} />
                <GroupCard title="Available Groups" />
                <GroupCard
                    title="Invitations"
                    onAccept={() => setJoinedRefreshKey((prev) => prev + 1)}
                />
            </div>
        </div>
    );
}