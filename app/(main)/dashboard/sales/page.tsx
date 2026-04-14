import { auth } from "@/modules/auth/infrastructure/next-auth";
import { getSalesDashboardDataAction } from "@/modules/dashboard";
import { SalesDashboardView } from "@/modules/dashboard";

export default async function SalesDashboardPage() {
  const session = await auth();
  const perms = session?.user?.permissionKeys ?? [];

  if (!perms.includes("menu.dashboard.sales")) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <h3 className="font-bold">Access Denied</h3>
          <p>คุณไม่มีสิทธิ์เข้าถึงแดชบอร์ดพนักงานฝ่ายขาย</p>
        </div>
      </div>
    );
  }

  const employeeId = session?.user?.employeeId;

  if (!employeeId) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
          <h3 className="font-bold">ไม่พบข้อมูลพนักงาน</h3>
          <p>บัญชีผู้ใช้ของคุณยังไม่ได้เชื่อมต่อกับข้อมูลพนักงาน</p>
        </div>
      </div>
    );
  }

  const data = await getSalesDashboardDataAction(employeeId);

  return <SalesDashboardView initialData={data} employeeId={employeeId} />;
}
