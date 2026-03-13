import { ReportListView } from "@/modules/reports";

export const metadata = {
  title: "หมวดรายงาน | CRM Bank",
  description: "รายงานวิเคราะห์ข้อมูลการขาย",
};

export default function ReportsPage() {
  return <ReportListView />;
}
