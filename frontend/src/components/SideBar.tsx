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
  const { handleLogout } = useLogout();

  const { totalUnread } = useWS();
  const badge = totalUnread > 99 ? "99+" : totalUnread.toString();
  const showBadge = totalUnread > 0;

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
        <Link href="/profile/1" className="navSection">
          <UserIcon />
          {hover ? <span>Profile</span> : null}
        </Link>
        <Link href="/groups" className="navSection">
          <GroupsIcon />
          {hover ? <span>Groups</span> : null}
        </Link>
        <Link href="/notifications" className="navSection">
          <NotificationIcon />
          {hover ? <span>Notifications</span> : null}
        </Link>
        <Link href="/chat" className="navSection iconWrap">
          <ChatsIcon />
          {showBadge && <span className="badge">{badge}</span>}
          {hover && <span>Chats</span>}
        </Link>

      </div>
      <button className="navSection" onClick={handleLogout}>
        <LogoutIcon />
        {hover ? (
          <span>Logout</span>
        ) : null}
      </button>
    </div>
  );
}
