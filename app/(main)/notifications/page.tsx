import { NotificationListView } from "@/modules/notifications";

export const metadata = {
  title: "การแจ้งเตือน | CRM Bank",
  description: "จัดการและดูการแจ้งเตือนทั้งหมดของคุณ",
};

export default function NotificationsPage() {
  return <NotificationListView />;
}
