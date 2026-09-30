import ActivityPlanCreateView from "@/modules/activity-plans/features/shared/form/activity-plan-create-view";

export const metadata = {
  title: "บันทึกกิจกรรมนอกแผน | CRM",
  description: "บันทึกกิจกรรมนอกแผนงาน (Unplanned Activity)",
};

export default function NewUnplannedActivityPage() {
  return <ActivityPlanCreateView planType="UNPLANNED" />;
}
