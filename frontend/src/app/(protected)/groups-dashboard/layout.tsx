import Sidebar from "./components/Sidebar";
import styles from "./style/groups.module.css";

export default function GroupsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.groupsLayout}>
            <Sidebar />
            {children}
        </div>
    );
}
