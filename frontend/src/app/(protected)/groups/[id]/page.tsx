import Feed from "@/components/groups/GroupFeed";
import GroupPostInput from "@/components/groups/GroupPostInput";
import styles from "@/components/groups/style/groupFeed.module.css";

export default async function GroupPage() {
    return (
        <div className={styles.feedContainer}>
            <GroupPostInput />
            <Feed  />
        </div>
    );
}
