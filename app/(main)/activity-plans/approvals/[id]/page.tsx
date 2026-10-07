import { use } from "react";
import { ActivityPlanApprovalDetailView } from "@/modules/activity-plans";

export default function ActivityPlanApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ActivityPlanApprovalDetailView id={id} />;
}
