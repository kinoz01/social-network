import type { ReactNode } from "react";
import LeftMenu from "@/components/menus/LeftMenu";
import RightMenu from "@/components/menus/RightMenu";
import UserSearchMenu from "@/components/menus/UsersSearch";
import style from "@/components/chat/style/chat.module.css";

export default async function ProfileLayout({ children, params }: { children: ReactNode, params: any }) {
    return (
        <div className="mainContent">
            <LeftMenu />
            {children}
            <div className={`${style.menuLayout} ${style.menuLayoutRight}`}>
                <UserSearchMenu />
                <RightMenu page="profile" />
            </div>
        </div>
    );
}