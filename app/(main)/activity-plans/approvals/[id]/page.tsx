import { use } from "react";
import ActivityPlanApproveDetailView from "@/modules/activity-plans/features/approve-view/activity-plan-approve-detail-view";

export default function ActivityPlanApproveDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ActivityPlanApproveDetailView id={id} />;
}