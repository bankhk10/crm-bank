import { UnplannedCreateView } from "@/modules/activity-plans";

export const metadata = {
  title: "บันทึกกิจกรรมนอกแผน | CRM",
  description: "บันทึกกิจกรรมและผลการปฏิบัติงานจริงนอกแผนงาน",
};

export default function NewUnplannedActivityPage() {
  return <UnplannedCreateView />;
}
