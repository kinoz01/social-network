
import styles from "@/components/groups/style/groups.module.css";
import TopBar from "@/components/groups/TopBar";
import GroupsGrid from "@/components/groups/GroupsGrid";;

export default function GroupsPage() {
    return (
        <div className={styles.groupsLayout}>
            <TopBar />
            <GroupsGrid />
        </div>
    );
}
