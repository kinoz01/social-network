"use client";

import TopBar from "./components/TopBar";
import GroupCard from "./components/GroupCard";
import styles from "./style/groups.module.css";

export default function GroupsPage() {
    return (
        <div className={styles.groupsLayout}>
            <div className={styles.groupsContent}>
                <div className={styles.groupGrid}>
                    <GroupCard title="Your Groups" />
                    <GroupCard title="Joined Groups" />
                    <GroupCard title="Available Groups" />
                    <GroupCard title="Invitations" />
                </div>
            </div>
        </div>
    );
}
