import { ActivityCalendarView } from "@/modules/activity";

export const metadata = {
  title: "ปฏิทินกิจกรรม | CRM",
  description: "ปฏิทินนัดหมายกิจกรรมสำหรับผู้สร้างแผนงานและพนักงานช่วยงาน",
};

export default function ActivityCalendarPage() {
  return <ActivityCalendarView />;
}
