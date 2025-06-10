import LeftMenu from "@/components/menus/LeftMenu";
import RightMenu from "@/components/menus/RightMenu";
import Feed from "@/components/posts/Feed";
import UserSearchMenu from "@/components/menus/UsersSearch";
import style from "@/components/chat/style/chat.module.css";

export default function NotificationsPage() {

    return (
        <div className="mainContent notifications">
            <LeftMenu />
            {/* <Feed /> */}
            <div className={`${style.menuLayout} ${style.menuLayoutRight}`}>
                <UserSearchMenu />
                <RightMenu />
            </div>
        </div >
    );

}