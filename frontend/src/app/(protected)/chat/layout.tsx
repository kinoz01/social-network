import type { ReactNode } from "react";
import ChatMenu from "@/components/chat/ChatMenu";
import DMsMenu from "@/components/chat/DMsMenu";
import style from "@/components/chat/style/chat.module.css";
import SuggestionsList from "@/components/menus/SuggestionsList";
import List from "@/components/menus/List";

export default function ChatLayout({ children }: { children: ReactNode }) {
    return (
        <div className={style.mainContent}>
            <div className={style.menuLayout}>
                <DMsMenu />
                <ChatMenu />
            </div>
            <div className={style.chatBox}>{children}</div>
            <div className={`${style.rMenuLayout}`}>
                <List type="friendRequests" title="Friend Requests" />
                <SuggestionsList className={style.usersSuggestionsChat} />
            </div>
        </div>
    );
}