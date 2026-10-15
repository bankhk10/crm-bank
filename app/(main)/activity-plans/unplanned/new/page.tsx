import { UnplannedCreateView } from "@/modules/activity";

export const metadata = {
  title: "บันทึกกิจกรรมนอกแผน | CRM",
  description: "บันทึกกิจกรรมนอกแผนงาน (Unplanned Activity)",
};

export default function NewUnplannedActivityPage() {
  return <UnplannedCreateView />;
}

