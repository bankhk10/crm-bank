import { PlannedEditView } from "@/modules/activity";
import { getActivityPlanEditData } from "@/modules/activity/server";

export const dynamic = "force-dynamic";

export default async function ActivityPlanEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const editData = await getActivityPlanEditData(id);
  return <PlannedEditView id={id} initialEditData={editData} />;
}
