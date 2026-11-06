import { ActivityPlanActualView } from "@/modules/activity";
import { getActivityPlanActualInitialData } from "@/modules/activity/server";

export const dynamic = "force-dynamic";

export default async function ActivityPlanActualDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialActualData = await getActivityPlanActualInitialData(id);
  return (
    <ActivityPlanActualView id={id} initialActualData={initialActualData} />
  );
}
