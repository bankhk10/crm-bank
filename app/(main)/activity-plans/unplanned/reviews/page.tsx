import { UnplannedReviewQueueView } from "@/modules/activity-plans";

export const metadata = {
  title: "คิวตรวจสอบกิจกรรมนอกแผนงาน | CRM Bank",
  description: "คิวตรวจสอบกิจกรรมนอกแผนงานสำหรับหัวหน้างานและผู้ดูแลระบบ",
};

export default function UnplannedReviewQueuePage() {
  return <UnplannedReviewQueueView />;
}
