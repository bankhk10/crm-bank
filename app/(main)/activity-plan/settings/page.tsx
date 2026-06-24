import { Metadata } from "next";
import { db } from "@/lib/db";
import TemplateManager from "./template-manager";
import EmployeeAssignment from "./employee-assignment";

export const metadata: Metadata = {
  title: "ตั้งค่าเทมเพลตสายอนุมัติ",
};

export default async function SettingsPage() {
  const employees = await db.employee.findMany({
    select: { 
      id: true, 
      name: true, 
      positionTitle: true,
      employeeApprovalRoutes: {
        select: { templateId: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  const templates = await db.approvalRouteTemplate.findMany({
    include: { 
      steps: {
        orderBy: { stepOrder: 'asc' }
      } 
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">ตั้งค่าสายอนุมัติ (ระบบเทมเพลต)</h2>
      <p className="text-gray-500">สร้างแม่แบบสายอนุมัติ (Template) และกำหนดสิทธิ์ให้พนักงานแต่ละคน</p>
      
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="bg-white p-6 rounded-xl border shadow-sm h-fit">
          <TemplateManager employees={employees} templates={templates} />
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <EmployeeAssignment employees={employees} templates={templates} />
        </div>
      </div>
    </div>
  );
}
