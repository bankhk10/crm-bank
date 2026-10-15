import { use } from "react";
import { PlannedEditView } from "@/modules/activity";

export default function ActivityPlanEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <PlannedEditView id={id} />;
}
