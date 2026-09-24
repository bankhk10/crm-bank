import { use } from "react";
import { ActivityPlanActualView } from "@/modules/activity-plans";

export default function ActivityPlanActualDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ActivityPlanActualView id={id} />;
}
