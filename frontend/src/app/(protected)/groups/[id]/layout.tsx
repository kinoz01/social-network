import { checkMembership } from "@/lib/auth";
import { GroupSidebar } from "@/components/groups/GroupSidebar";
import styles from "@/components/groups/style/groupLayout.module.css";

export default async function GroupLayout({
    params,
    children,
}: {
    params: { id: string };
    children: React.ReactNode;
}) {
    await checkMembership(params.id); // server-side check if user is a member of the group
    return (
        <div className={styles.wrapper}>
            <div >{children}</div>
            <aside className={styles.sidebar}>
                <GroupSidebar />
            </aside>
        </div>
    );
}