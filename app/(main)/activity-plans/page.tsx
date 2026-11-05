import { ActivityPlanListView } from "@/modules/activity";
import { getActivityFilterMasterData } from "@/modules/activity/server";

export const dynamic = "force-dynamic";

export default async function ActivityPlansPage() {
  const filterData = await getActivityFilterMasterData();
  return <ActivityPlanListView initialFilterData={filterData} />;
}
