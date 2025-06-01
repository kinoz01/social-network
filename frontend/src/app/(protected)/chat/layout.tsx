import type { ReactNode } from "react";
import ChatMenu from "@/components/chat/ChatMenu";
import RightMenu from "@/components/menus/RightMenu";
import "@/app/globals.css";

export default function ChatLayout({ children }: { children: ReactNode }) {
    return (
        <div className="mainContent chat">
            <ChatMenu />
            <div className="chat-box">{children}</div>
            <RightMenu />
        </div>
    );
}