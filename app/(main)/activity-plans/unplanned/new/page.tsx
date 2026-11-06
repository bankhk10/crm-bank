import { UnplannedCreateView } from "@/modules/activity";
import { getPlannedActivityMasterData } from "@/modules/activity/server";

export const metadata = {
  title: "บันทึกกิจกรรมนอกแผน | CRM",
  description: "บันทึกกิจกรรมนอกแผนงาน (Unplanned Activity)",
};

export const dynamic = "force-dynamic";

export default async function NewUnplannedActivityPage() {
  const masterData = await getPlannedActivityMasterData();
  return <UnplannedCreateView initialMasterData={masterData} />;
}
