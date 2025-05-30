"use client";

import { useEffect, useState } from "react";
import {
  ChatsIcon,
  GroupsIcon,
  HomeIcon,
  LogoutIcon,
  NotificationIcon,
  UserIcon,
} from "./icons";
import Link from "next/link";
import { useLogout } from "@/lib/logout";
import {
  getNotifications,
  getUnreadNotificationsCount,
} from "@/lib/notifications";
import NavButton from "./NavButton";
import { useUser } from "@/context/UserContext";

export default function SideBar() {
  const { user: loggedUser } = useUser();

  // side bar hovering state management
  const [hover, setHover] = useState(false);

  // logout state management
  const { handleLogout } = useLogout();

  // loading state
  const [isDataLoading, setIsDataLoading] = useState(false);

  // get unread notificatios count
  const [unreadNotificationsCount, setUnreadNotificationsCount] =
    useState<number>(0);

  useEffect(() => {
    async function fetchNotificationsCount() {
      if (!loggedUser) return;

      setIsDataLoading(true);

      const notifications = await getUnreadNotificationsCount("false");

      const unreadCount = notifications || 0;
      setUnreadNotificationsCount(unreadCount);
      setIsDataLoading(false);
    }

    fetchNotificationsCount();
  }, [loggedUser]);

  return (
    <div
      className="sideBar"
      onPointerEnter={() => {
        setHover(true);
      }}
      onPointerLeave={() => {
        setHover(false);
      }}
    >
      <Link href="/home">
        <div className="logo">SN</div>
      </Link>
      <div className="navIcons">
        <NavButton state={hover} title="Home" link="home" icon={<HomeIcon />} />

        <NavButton
          state={hover}
          title="Profile"
          link={`profile/${loggedUser?.id}`}
          icon={<UserIcon />}
        />

        <NavButton
          state={hover}
          title="Groups"
          link="groups"
          icon={<GroupsIcon />}
        />

        <NavButton
          state={hover}
          title="Notifications"
          link={`notifications/${loggedUser?.id}`}
          icon={<NotificationIcon />}
          count={unreadNotificationsCount}
          loading={isDataLoading}
        />

        <NavButton
          state={hover}
          title="Chats"
          link={`chat/${loggedUser?.id}`}
          icon={<ChatsIcon />}
        />
      </div>

      <button className="navSection" onClick={handleLogout}>
        <LogoutIcon />
        {hover ? <span>Logout</span> : null}
      </button>
    </div>
  );
}
