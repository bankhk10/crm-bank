"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { bulkAssignTemplates } from "@/modules/activity-plan/application/actions";

type Employee = { 
  id: string; 
  name: string; 
  positionTitle: string | null;
  employeeApprovalRoutes: { templateId: string }[];
};
type Template = { id: string; name: string };

export default function EmployeeAssignment({ employees, templates }: { employees: Employee[], templates: Template[] }) {
  // state storing mapping of employeeId -> templateId
  const [assignments, setAssignments] = useState<Record<string, string>>(
    employees.reduce((acc, emp) => {
      acc[emp.id] = emp.employeeApprovalRoutes[0]?.templateId || "";
      return acc;
    }, {} as Record<string, string>)
  );
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = Object.entries(assignments).map(([employeeId, templateId]) => ({
        employeeId,
        templateId: templateId || null
      }));
      await bulkAssignTemplates(payload);
      alert("บันทึกการกำหนดสิทธิ์สำเร็จ");
    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">กำหนดสายอนุมัติให้พนักงาน</h3>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "กำลังบันทึก..." : "บันทึกการกำหนดสิทธิ์ทั้งหมด"}
        </Button>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">พนักงาน</th>
              <th className="px-4 py-3 font-medium text-gray-700">ตำแหน่ง</th>
              <th className="px-4 py-3 font-medium text-gray-700 w-1/2">เทมเพลตสายอนุมัติ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{emp.name}</td>
                <td className="px-4 py-3 text-gray-600">{emp.positionTitle || "-"}</td>
                <td className="px-4 py-2">
                  <select 
                    className="w-full border rounded-md p-1.5 bg-white text-sm focus:ring-2 focus:ring-blue-100"
                    value={assignments[emp.id] || ""}
                    onChange={(e) => setAssignments({ ...assignments, [emp.id]: e.target.value })}
                  >
                    <option value="">-- ไม่ใช้สายอนุมัติ --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
