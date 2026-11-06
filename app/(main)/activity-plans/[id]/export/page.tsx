import { use } from "react";
import { ActivityPlanExportView } from "@/modules/activity";

export default function ActivityPlanExportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ActivityPlanExportView id={id} />;
}

