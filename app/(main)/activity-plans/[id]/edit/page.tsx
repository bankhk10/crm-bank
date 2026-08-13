import { use } from "react";
import { ActivityPlanEditView } from "@/modules/activity-plans";

export default function ActivityPlanEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ActivityPlanEditView id={id} />;
}
