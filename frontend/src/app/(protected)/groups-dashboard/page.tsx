"use client";

import { useState } from "react";
import GroupCard from "../../../components/groups-dashboard/GroupCard";
import styles from "../../../components/groups-dashboard/style/groups.module.css";
import TopBar from "../../../components/groups-dashboard/TopBar";

export default function GroupsPage() {
    const [joinedRefreshKey, setJoinedRefreshKey] = useState(0);

    return (
        <div className={styles.groupsLayout}>
            <div className={styles.groupsContent}>
                <div className={styles.groupGrid}>
                    <GroupCard title="Your Groups" />
                    <GroupCard title="Joined Groups" refreshKey={joinedRefreshKey} />
                    <GroupCard title="Available Groups" />
                    <GroupCard
                        title="Invitations"
                        onAccept={() => setJoinedRefreshKey(prev => prev + 1)}
                    />
                </div>
            </div>
        </div>
    );
}
