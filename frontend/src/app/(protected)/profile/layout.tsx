import type { ReactNode } from "react";
import LeftMenu from "@/components/menus/LeftMenu";
import RightMenu from "@/components/menus/RightMenu";
import UserSearchMenu from "@/components/menus/UsersSearch";
import style from "@/components/chat/style/chat.module.css";

export default function ProfileLayout({ children }: { children: ReactNode }) {

    return (
        <div className="mainContent">
            <LeftMenu />
            {children}
            <div className={`${style.menuLayout} ${style.menuLayoutRight}`}>
                <UserSearchMenu />
                <RightMenu />
            </div>
        </div >
    );
}