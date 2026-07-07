import { redirect } from "next/navigation";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { listAnnouncementsAction } from "@/modules/login-announcements";
import LoginAnnouncementList from "@/modules/login-announcements/features/admin/login-announcement-list";

export const metadata = {
  title: "จัดการ Popup หลัง Login | CS ONE Admin",
  description: "จัดการรูปภาพ popup ที่แสดงหลัง login สำหรับแต่ละ Role",
};

export default async function LoginAnnouncementsAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const roles: string[] = session.user.roles ?? [];
  if (!roles.includes("admin")) redirect("/dashboard");

  const items = await listAnnouncementsAction();

  return (
    <div className="p-4 md:p-6">
      <LoginAnnouncementList initialItems={items} />
    </div>
  );
}
