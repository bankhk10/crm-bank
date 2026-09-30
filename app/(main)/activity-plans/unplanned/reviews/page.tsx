import { redirect } from "next/navigation";

export const metadata = {
  title: "อนุมัติแผนงาน | CRM Bank",
  description: "อนุมัติแผนงานและตรวจสอบกิจกรรมนอกแผนงาน",
};

export default function UnplannedReviewQueuePage() {
  redirect("/activity-plans/approvals?tab=unplanned");
}
