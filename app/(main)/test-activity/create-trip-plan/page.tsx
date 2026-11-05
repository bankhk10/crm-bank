import { auth } from "@/modules/auth/infrastructure/next-auth";
import { CreateTripPlan } from "@/modules/test-activity";

export default async function CreateTripPlanPage() {
  const session = await auth();
  const perms = session?.user?.permissionKeys ?? [];

  if (
    !perms.includes("menu.test_activity.create_trip_plan") &&
    !perms.includes("menu.test_activity")
  ) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <h3 className="font-bold">Access Denied</h3>
          <p>คุณไม่มีสิทธิ์เข้าถึงหน้าจอสร้างแผนปฏิบัติงาน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <CreateTripPlan />
    </div>
  );
}
