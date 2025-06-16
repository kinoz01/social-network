import LeftMenu from "@/components/menus/LeftMenu";
import NotificationDashboard from "@/components/notifications/NotificationDashboard";

async function NotificationsPage({ params }: { params: any }) {
  return (
    <div className="mainContent">
      <LeftMenu type="home"></LeftMenu>
      <NotificationDashboard />
    </div>
  );
}

export default NotificationsPage;
