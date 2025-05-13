import Feed from "@/components/groups/GroupFeed";
import GroupPostInput from "@/components/groups/GroupPostInput";
import styles from "@/components/groups/style/groupFeed.module.css";
import { GroupFeedProvider } from "@/context/GroupFeedContext";

export default function GroupPage() {
    return (
        <GroupFeedProvider>
            <div className={styles.feedContainer}>
                <GroupPostInput />
                <Feed />
            </div>
        </GroupFeedProvider>
    );
}
