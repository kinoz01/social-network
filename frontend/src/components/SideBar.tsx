"use client";

import { useState } from "react";
import {
  AddIcon,
  ChatsIcon,
  GroupsIcon,
  HomeIcon,
  LogoutIcon,
  NotificationIcon,
  UserIcon,
} from "./icons";
import Link from "next/link";
import AddPost from "./posts/AddPost";
import { useLogout } from "@/lib/logout";

export default function SideBar() {
  const [hover, setHover] = useState(false);

  const { handleLogout } = useLogout();

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
        <div className="navSection">
          <UserIcon />
          {hover ? (
            <Link href="/profile/1">
              <span>Profile</span>
            </Link>
          ) : null}
        </div>
        <Link href="/groups" className="navSection">
          <GroupsIcon />
          {hover ? <span>Groups</span> : null}
        </Link>
        <Link href="/notifications/1" className="navSection">
          <NotificationIcon />
          {hover ? <span>Notifications</span> : null}
        </Link>
        <Link href="/chat/1" className="navSection">
          <ChatsIcon />
          {hover ? <span>Chats</span> : null}
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
