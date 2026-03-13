import { auth } from "@/modules/auth/infrastructure/next-auth";
import { getDashboardDataAction } from "@/modules/dashboard";
import { ManagerDashboardView } from "@/modules/dashboard";

export default async function DashboardPage() {
  const session = await auth();
  const perms = session?.user?.permissionKeys ?? [];

  if (!perms.includes("menu.dashboard.manager")) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <h3 className="font-bold">Access Denied</h3>
          <p>คุณไม่มีสิทธิ์เข้าถึงแดชบอร์ดผู้จัดการ</p>
        </div>
      </div>
    );
  }

  const data = await getDashboardDataAction();

  return <ManagerDashboardView initialData={data} />;
}
