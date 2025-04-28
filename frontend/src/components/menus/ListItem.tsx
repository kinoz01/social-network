import Image from "next/image";
import styles from "./menus.module.css";
import { AcceptIcon, ChatIcon, RejectIcon } from "../icons";
import GroupCard from "./GroupCard";

function ListItem({ type }: { type: "friendRequests" | "followers" | "followings" | "suggestions" | "chat" | "group" | "groups" | "event" }) {
    return (
        <div className={`${styles.ListItem} ${styles[type]}`}>
            <div className={styles.ListItemInfo}>
                {
                    type !== "groups" ?
                        <>
                            <Image
                                className={styles.userIcon}
                                src="https://images.unsplash.com/photo-1742626157100-a25483dda2ea?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDM0fGJvOGpRS1RhRTBZfHxlbnwwfHx8fHw%3D"
                                alt=""
                                width={40}
                                height={40}
                            />
                        </>
                        : null
                }
                <span className={styles.ListItemName}>Wayne Burton</span>
            </div>
            <div className={styles.options}>
                {
                    type === "friendRequests" ?
                        <>
                            <AcceptIcon />
                            <RejectIcon />
                        </>
                        : type === "suggestions" ?
                            <>
                                <ChatIcon />
                                <RejectIcon />
                            </>
                            : type === "followers" || type === "followings" ?
                                <>
                                    <ChatIcon />
                                    {/* UNFOLLOW OCON */}
                                    <RejectIcon />
                                </>
                                : type === "chat" || type === "group" || "event" ?
                                    null
                                    : type === "groups" ?
                                        <>
                                            <GroupCard />
                                            <GroupCard />
                                            <GroupCard />
                                            <GroupCard />
                                            <GroupCard />
                                            <GroupCard />
                                        </> : null
                }
            </div>
        </div>
    );
}

export default ListItem;
