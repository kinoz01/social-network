import type { ReactNode } from "react";
import ChatMenu from "@/components/chat/ChatMenu";
import RightMenu from "@/components/menus/RightMenu";
import style from "@/components/groups/style/groupLayout.module.css";
import "@/app/globals.css";
import DMsMenu from "@/components/chat/DMsMenu";

export default function ChatLayout({ children }: { children: ReactNode }) {
    return (
        <div className="mainContent chat">
            <div className={style.menuLayout}>
                <DMsMenu />
                <ChatMenu />
            </div>
            <div className="chat-box">{children}</div>
            <RightMenu />
        </div>
    );
}