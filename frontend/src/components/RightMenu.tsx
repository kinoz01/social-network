import FriendRequests from "./FriendReequests"
import UserInfoCard from "./UserInfoCard"
import styles from "../app/page.module.css"

function RightMenu({ userId }: { userId?: string }) {
    return (
        <div className={styles.rightMenu}>
            {userId ? (
                <>
                    <UserInfoCard userId={userId} />
                </>
            ) : null}
            <div className={styles.menuSection}>
                <FriendRequests />
            </div>

            <div className={styles.menuSection}>
                <FriendRequests />
            </div>
        </div >)

}

export default RightMenu