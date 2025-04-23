import Image from "next/image";
import Link from "next/link";
import styles from "../app/page.module.css";
import { AcceptIcon, RejectIcon } from "./icons";

const FriendRequests = () => {
  return (
    <div className={styles.friendRequests}>
      {/* TOP  */}
      <div className={styles.header}>
        <span className={styles.title}>Friend Requests</span>
        <Link href="/notifications" className={styles.link}>
          See all
        </Link>
      </div>
      <div className={styles.requests}>
      {/* USER */}
        <div className={styles.request}>
          <div className={styles.userRequest}>
            <Image
              className={styles.userIcon}
              src="https://images.unsplash.com/photo-1742626157100-a25483dda2ea?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDM0fGJvOGpRS1RhRTBZfHxlbnwwfHx8fHw%3D"
              alt=""
              width={40}
              height={40}
            />
            <span className={styles.requestUserName}>Wayne Burton</span>
          </div>
          <div className={styles.requestOptions}>
            <AcceptIcon />
            <RejectIcon />
          </div>
        </div>
        {/* USER */}
        <div className={styles.request}>
          <div className={styles.userRequest}>
            <Image
              className={styles.userIcon}
              src="https://images.unsplash.com/photo-1742626157100-a25483dda2ea?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDM0fGJvOGpRS1RhRTBZfHxlbnwwfHx8fHw%3D"
              alt=""
              width={40}
              height={40}
            />
            <span className={styles.requestUserName}>Wayne Burton</span>
          </div>
          <div className={styles.requestOptions}>
            <AcceptIcon />
            <RejectIcon />
          </div>
        </div>
        {/* USER */}
        <div className={styles.request}>
          <div className={styles.userRequest}>
            <Image
              className={styles.userIcon}
              src="https://images.unsplash.com/photo-1742626157100-a25483dda2ea?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDM0fGJvOGpRS1RhRTBZfHxlbnwwfHx8fHw%3D"
              alt=""
              width={40}
              height={40}
            />
            <span className={styles.requestUserName}>Wayne Burton</span>
          </div>
          <div className={styles.requestOptions}>
            <AcceptIcon />
            <RejectIcon />
          </div>
        </div>
        {/* USER */}
        <div className={styles.request}>
          <div className={styles.userRequest}>
            <Image
              className={styles.userIcon}
              src="https://images.unsplash.com/photo-1742626157100-a25483dda2ea?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDM0fGJvOGpRS1RhRTBZfHxlbnwwfHx8fHw%3D"
              alt=""
              width={40}
              height={40}
            />
            <span className={styles.requestUserName}>Wayne Burton</span>
          </div>
          <div className={styles.requestOptions}>
            <AcceptIcon />
            <RejectIcon />
          </div>
        </div>
        {/* USER */}
        <div className={styles.request}>
          <div className={styles.userRequest}>
            <Image
              className={styles.userIcon}
              src="https://images.unsplash.com/photo-1742626157100-a25483dda2ea?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDM0fGJvOGpRS1RhRTBZfHxlbnwwfHx8fHw%3D"
              alt=""
              width={40}
              height={40}
            />
            <span className={styles.requestUserName}>Wayne Burton</span>
          </div>
          <div className={styles.requestOptions}>
            <AcceptIcon />
            <RejectIcon />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendRequests;
