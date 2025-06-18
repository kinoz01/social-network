import type { ReactNode } from "react";
import LeftMenu from "@/components/menus/LeftMenu";
import UserSearchMenu from "@/components/menus/UsersSearch";
import style from "@/components/chat/style/chat.module.css";


export default async function ProfileLayout({ children }: { children: ReactNode}) {
    return (
        <div className="mainContent">
            <div className={`${style.menuLayout} ${style.menuLayoutLeft}`}>
                <UserSearchMenu />
                <LeftMenu />
            </div>
            {children}
        </div>
    );
}