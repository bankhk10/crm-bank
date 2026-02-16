import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/app/actions/dashboard";
import DashboardClient from "./dashboard-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Server component usage? No, Alert is client?
// Alert is "use client" likely if it uses context?
// Usually UI components are client.
// I can just return simple HTML if Alert is client-only and I'm in server component.
// Or make this page client?
// But getDashboardData is server action.
// I'll keep it server.

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

  const data = await getDashboardData();

  return <DashboardClient data={data} />;
}
