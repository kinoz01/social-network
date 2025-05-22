import Feed from "@/components/groups/GroupFeed";
import styles from "@/components/groups/style/groupFeed.module.css";

export default function GroupPage() {
    return (
        <div className={styles.feedContainer}>
            <Feed />
        </div>
    );
}
