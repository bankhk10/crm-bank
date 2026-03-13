import { getDashboardDataAction } from "@/modules/dashboard";
import { AdminDashboardView } from "@/modules/dashboard";

export default async function DashboardPage() {
  const data = await getDashboardDataAction();

  return <AdminDashboardView initialData={data} />;
}
