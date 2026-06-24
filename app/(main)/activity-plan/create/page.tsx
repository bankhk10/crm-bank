import { Metadata } from "next";
import { db } from "@/lib/db";
import { createActivityPlan } from "@/modules/activity-plan/application/actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "สร้างแผนกิจกรรม",
};

export default async function CreatePlanPage() {
  const employees = await db.employee.findMany({
    select: { id: true, name: true, positionTitle: true },
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">สร้างแผนกิจกรรมใหม่</h2>

      <div className="bg-white p-6 rounded-xl border max-w-2xl">
        <form action={createActivityPlan} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              ชื่อแผนกิจกรรม
            </label>
            <input
              type="text"
              name="title"
              className="w-full border rounded-md p-2"
              required
              placeholder="เช่น แผนส่งเสริมการขาย ไตรมาส 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              รายละเอียด (ถ้ามี)
            </label>
            <textarea
              name="description"
              className="w-full border rounded-md p-2"
              rows={3}
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              ประเภทงบประมาณที่ใช้งาน (ไม่บังคับ -
              สามารถปล่อยว่างได้หากไม่ได้ใช้งบ)
            </label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="useSalesBudget"
                  value="true"
                  className="rounded"
                />
                <span>งบส่งเสริมการขาย</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="useMarketingBudget"
                  value="true"
                  className="rounded"
                />
                <span>งบการตลาด</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              ผู้สร้างแผน (จำลองการ Login)
            </label>
            <select
              name="requesterId"
              className="w-full border rounded-md p-2"
              required
            >
              <option value="">-- เลือกพนักงาน --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.positionTitle || "ไม่มีตำแหน่ง"})
                </option>
              ))}
            </select>
          </div>

          <Button type="submit">ส่งขออนุมัติ</Button>
        </form>
      </div>
    </div>
  );
}
