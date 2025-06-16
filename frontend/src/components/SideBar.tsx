"use client";

import { useState } from "react";

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
import { useWS } from "@/context/wsClient";

export default function SideBar() {

  const [hover, setHover] = useState(false);
  const user = useUser();
  const { handleLogout } = useLogout();

  const { totalUnread, notifsCount } = useWS();
  const badge = totalUnread > 99 ? "99+" : totalUnread.toString();
  const showBadge = totalUnread > 0;

  // Show notification badge with how many notifications
  const notifbadge = notifsCount > 99 ? "99+" : notifsCount.toString();
  const showNotifBadge = notifsCount > 0;
  
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
        <Link href="/home" className="navSection">
          <HomeIcon />
          {hover ? <span>Home</span> : null}
        </Link>
        <Link href="/profile" className="navSection">
          <UserIcon />
          {hover ? <span>Profile</span> : null}
        </Link>
        <Link href="/groups" className="navSection">
          <GroupsIcon />
          {hover ? <span>Groups</span> : null}
        </Link>
        <Link href="/notifications" className="navSection iconWrap">
          {showNotifBadge && <span className="badge">{notifbadge}</span>}
          <NotificationIcon />
          {hover ? <span>Notifications</span> : null}
        </Link>
        <Link href="/chat" className="navSection iconWrap">
          <ChatsIcon />
          {showBadge && <span className="badge">{badge}</span>}
          {hover && <span>Chats</span>}
        </Link>

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
