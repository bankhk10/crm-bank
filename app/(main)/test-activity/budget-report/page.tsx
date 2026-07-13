import { auth } from "@/modules/auth/infrastructure/next-auth";
import { BudgetReport } from "@/modules/test-activity";

export default async function BudgetReportPage() {
  const session = await auth();
  const perms = session?.user?.permissionKeys ?? [];

  // Fallback to allow access if user has parent test_activity permission to avoid locked screen.
  if (
    !perms.includes("menu.test_activity.budget_report") &&
    !perms.includes("menu.test_activity")
  ) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <h3 className="font-bold">Access Denied</h3>
          <p>คุณไม่มีสิทธิ์เข้าถึงหน้าจอรายงานงบประมาณ (Budget Report)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <BudgetReport />
    </div>
  );
}
