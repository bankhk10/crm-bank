import { ActivityCalendarView } from "@/modules/activity";
import { getActivityFilterMasterData } from "@/modules/activity/server";

export const metadata = {
  title: "ปฏิทินกิจกรรม | CRM",
  description: "ปฏิทินนัดหมายกิจกรรมสำหรับผู้สร้างแผนงานและพนักงานช่วยงาน",
};

export const dynamic = "force-dynamic";

export default async function ActivityCalendarPage() {
  const filterData = await getActivityFilterMasterData();
  return <ActivityCalendarView initialFilterData={filterData} />;
}
