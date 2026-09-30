import { use } from "react";
import { ActivityPlanDetailView } from "@/modules/activity-plans";

export const metadata = {
  title: "รายละเอียดกิจกรรมนอกแผน | CRM Bank",
  description: "รายละเอียดกิจกรรมนอกแผนงาน",
};

export default function UnplannedReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ActivityPlanDetailView id={id} />;
}
