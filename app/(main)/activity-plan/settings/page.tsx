import { Metadata } from "next";
import { db } from "@/lib/db";
import DynamicConfigForm from "./dynamic-config-form";

export const metadata: Metadata = {
  title: "ตั้งค่าสายอนุมัติแบบอิสระ",
};

export default async function SettingsPage() {
  const employees = await db.employee.findMany({
    select: { id: true, name: true, positionTitle: true }
  });

  const configs = await db.activityApprovalRouteConfig.findMany({
    include: { requester: true, approver: true },
    orderBy: [
      { requesterId: 'asc' },
      { stepOrder: 'asc' }
    ]
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">ตั้งค่าสายอนุมัติ</h2>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <DynamicConfigForm employees={employees} />
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm max-h-[800px] overflow-y-auto">
          <h3 className="text-lg font-medium mb-4">การตั้งค่าปัจจุบัน</h3>
          <div className="space-y-4">
            {configs.length === 0 ? (
              <p className="text-sm text-gray-500">ยังไม่มีข้อมูล</p>
            ) : (
              // Group by requester
              Object.entries(
                configs.reduce((acc, config) => {
                  if (!acc[config.requester.name]) acc[config.requester.name] = [];
                  acc[config.requester.name].push(config);
                  return acc;
                }, {} as Record<string, typeof configs>)
              ).map(([requesterName, userConfigs]) => (
                <div key={requesterName} className="border rounded-lg p-3 bg-gray-50">
                  <h4 className="font-semibold text-blue-700 mb-2 border-b pb-1">ผู้ขอ: {requesterName}</h4>
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-gray-500 text-xs uppercase">
                        <th className="pb-1 w-12">ลำดับ</th>
                        <th className="pb-1">ขั้น (ชื่อ)</th>
                        <th className="pb-1">ผู้อนุมัติ</th>
                        <th className="pb-1">เงื่อนไขงบ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userConfigs.map(config => (
                        <tr key={config.id} className="border-t border-gray-200">
                          <td className="py-1.5 font-medium">{config.stepOrder}</td>
                          <td className="py-1.5">{config.stepName}</td>
                          <td className="py-1.5">{config.approver.name}</td>
                          <td className="py-1.5 text-xs text-gray-500">{config.budgetCondition}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
