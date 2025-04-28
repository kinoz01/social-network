"use client";

import { useState } from "react";
import {
  AddIcon,
  ChatsIcon,
  GroupsIcon,
  HomeIcon,
  NotificationIcon,
  UserIcon,
} from "./icons";
import Link from "next/link";

export default function SideBar() {
  const [hover, setHover] = useState(false);


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

      <div className="logo">SN</div>
      <div className="navIcons">
        <Link href="/" className="navSection">
          <HomeIcon />
          {hover ? <span>Home</span> : null}
        </Link>

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
        <div className="navSection" >
          {/* Add new icon */}
          <AddIcon />
          {hover ? <span>New post</span> : null}
        </div>
        <div className="navSection" >
          {/* Add new icon */}
          <AddIcon />
          {hover ? <span>New Group</span> : null}
        </div>
      </div>
      <div className="navSection">
        <UserIcon />
        {hover ? (
          <Link href="/profile/1">
            <span>Profile</span>
          </Link>
        ) : null}
      </div>

    </div >
  );
}
