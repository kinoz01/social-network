import LeftMenu from "@/components/menus/LeftMenu";
import NotificationDashboard from "@/components/notifications/NotificationDashboard";

async function NotificationsPage({ params }: { params: any }) {
    const { id } = await params;

    return (
        <div className="mainContent">
            <LeftMenu type="home"></LeftMenu>
            <NotificationDashboard loggedUser={id} />
        </div>
    )
}

export default NotificationsPage