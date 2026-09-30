import { use } from "react";
import ActivityPlanEditView from "@/modules/activity-plans/features/shared/form/activity-plan-edit-view";

export const metadata = {
  title: "แก้ไขกิจกรรมนอกแผน | CRM",
  description: "แก้ไขกิจกรรมนอกแผนงาน (Unplanned Activity)",
};

export default function EditUnplannedActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ActivityPlanEditView id={id} />;
}
