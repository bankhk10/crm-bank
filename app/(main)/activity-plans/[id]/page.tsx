import { ActivityPlanDetailView } from "@/modules/activity";
import { getActivityPlanAction } from "@/modules/activity/server";

export const dynamic = "force-dynamic";

export default async function ActivityPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const planRes = await getActivityPlanAction(id);
  return (
    <ActivityPlanDetailView
      id={id}
      initialPlan={planRes.success ? (planRes.plan ?? null) : null}
      initialError={planRes.success ? null : (planRes.error ?? null)}
    />
  );
}
