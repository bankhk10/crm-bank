import { use } from "react";
import { UnplannedEditView } from "@/modules/activity-plans";

export const metadata = {
  title: "แก้ไขกิจกรรมนอกแผน | CRM",
  description: "แก้ไขรายละเอียดและผลการปฏิบัติงานนอกแผนงาน",
};

export default function EditUnplannedActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <UnplannedEditView id={id} />;
}
