import { NotificationModel } from "@/lib/types";
import styles from "./notifications.module.css";
import Image from "next/image";
import Link from "next/link";
import { updateReadNotification } from "@/lib/notifications";
import { addFollower, getProfileInfo } from "@/lib/followers";
import { useState } from "react";

function Notification({ notification }: { notification: NotificationModel }) {
  const [isRead, setIsRead] = useState<boolean>(false);

  const handelFollowingRequest = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    console.log("users: ", {
      action: e.currentTarget.value,
      status: e.currentTarget.value,
      followerID: notification.sender.id,
      followedId: notification.receiver,
    });
    setIsRead(true);
    await addFollower(
      {
        action: e.currentTarget.value,
        status: e.currentTarget.value,
        followerID: notification.sender.id,
        followedId: notification.receiver,
      },
      "/api/followers/add"
    );

    await updateReadNotification(notification);
  };

  // function to handel group event and group invitations
  const handelGroupRequest = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {};

  // console.log("image url: ", `${process.env.NEXT_PUBLIC_API_URL}/api/image/${notification.sender.profile_pic}`);
  return (
    <div
      className={`${styles.notification} ${
        notification.isRead || isRead ? styles.read : styles.notRead
      }`}
    >
      <div className={styles.info}>
        <Image
          className={styles.profilePic}
          src={`${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${notification.sender.profile_pic}`}
          alt=""
          width={40}
          height={40}
        />
        <div className={styles.content}>{notification.content}</div>
        <Link
          className={styles.link}
          href={`/profile/${notification.sender.id}`}
        >
          {`@${notification.sender.first_name + " " + notification.sender.last_name}`}
        </Link>
      </div>

      <div className={styles.date}>{notification.createdAt}</div>

      {notification.type === "friend request" && (
        <div className={styles.options}>
          <button
            onClick={handelFollowingRequest}
            value="accepted"
            disabled={notification.isRead || isRead ? true : false}
          >
            Accept
          </button>
          <button
            onClick={handelFollowingRequest}
            value="rejected"
            disabled={notification.isRead || isRead ? true : false}
          >
            Reject
          </button>
        </div>
      )}

      {notification.type === "group invite" && (
        // buttons to handel group notifications
        <div className={styles.options}>
          <button
            onClick={handelGroupRequest}
            value="register"
            disabled={notification.isRead && true}
          >
            Register
          </button>
          <button
            onClick={handelGroupRequest}
            value="reject"
            disabled={notification.isRead && true}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

export default Notification;
