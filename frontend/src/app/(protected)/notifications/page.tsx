import LeftMenu from "@/components/menus/LeftMenu";
import RightMenu from "@/components/menus/RightMenu";
import UserSearchMenu from "@/components/menus/UsersSearch";
import style from "@/components/chat/style/chat.module.css";
import NotificationDashboard from "@/components/notifications/NotificationDashboard";

export default function NotificationsPage() {

    return (
        <div className="mainContent notifications">
            <LeftMenu className={style.notifLeftMenu}/>
            <NotificationDashboard />
            <div className={`${style.menuLayout} ${style.menuLayoutRight}`}>
                <UserSearchMenu />
                <RightMenu />
            </div>
        </div >
    );
}