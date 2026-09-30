import { redirect } from "next/navigation";

export const metadata = {
  title: "อนุมัติแผนงาน | CRM Bank",
  description: "อนุมัติแผนงานและกิจกรรม",
};

export default function UnplannedReviewQueuePage() {
  redirect("/activity-plans/approvals");
}
