import { PlannedCreateView } from "@/modules/activity";
import { getPlannedActivityMasterData } from "@/modules/activity/server";

export const dynamic = "force-dynamic";

export default async function NewActivityPlanPage() {
  const masterData = await getPlannedActivityMasterData();
  return <PlannedCreateView initialMasterData={masterData} />;
}
