import { ActivityPlanActualView } from "@/modules/activity";
import { getActivityPlanActualInitialData } from "@/modules/activity/server";

export const dynamic = "force-dynamic";

export default async function ActivityPlanActualStandalonePage() {
  const initialActualData = await getActivityPlanActualInitialData();
  return <ActivityPlanActualView initialActualData={initialActualData} />;
}
