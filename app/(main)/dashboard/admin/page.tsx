import { getDashboardDataAction } from "@/modules/dashboard";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const data = await getDashboardDataAction();

  return <DashboardClient data={data} />;
}
