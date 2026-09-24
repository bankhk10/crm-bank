import { use } from "react";
import { ActivityPlanDetailView } from "@/modules/activity-plans";

export default function ActivityPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ActivityPlanDetailView id={id} />;
}
