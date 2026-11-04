import { UnplannedEditView } from "@/modules/activity";
import { getActivityPlanEditData } from "@/modules/activity/server";

export const metadata = {
  title: "แก้ไขกิจกรรมนอกแผน | CRM",
  description: "แก้ไขกิจกรรมนอกแผนงาน (Unplanned Activity)",
};

export const dynamic = "force-dynamic";

export default async function EditUnplannedActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const editData = await getActivityPlanEditData(id);
  return <UnplannedEditView id={id} initialEditData={editData} />;
}
