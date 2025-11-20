"use client";

import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import type { Employee } from "@/types/Employee.ts";

const mockEmployees: Employee[] = [
  {
    id: "1",
    name: "Jane Doe",
    email: "jane@example.com",
    role: "Account Executive",
    phone: "+66 02-123-4567",
    companyId: "acme"
  },
  {
    id: "2",
    name: "John Smith",
    email: "john@example.com",
    role: "Customer Success",
    phone: "+66 02-987-6543",
    companyId: "globex"
  }
];

export default function EmployeeTable() {
  const { allowed, isLoading, dataAccess } = usePermission("menu.employees");
  const scope = dataAccess("employee");
  if (isLoading) {
    return <Card className="p-4 text-sm text-slate-500">กำลังโหลดรายการพนักงาน...</Card>;
  }

  if (!allowed) {
    return (
      <Alert variant="destructive">
        <AlertDescription>คุณไม่มีสิทธิ์เปิดดูเมนูพนักงาน</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      {scope ? (
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">
          Data scope: {scope === "VIEW_ALL" ? "ทุกคน" : scope === "VIEW_DEPARTMENT" ? "เฉพาะแผนก" : "เฉพาะฉัน"}
        </div>
      ) : null}
      <div className="w-full overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Name</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Email</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Role</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Phone</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {mockEmployees.map((employee) => (
            <tr key={employee.id}>
              <td className="px-4 py-3 font-medium text-slate-900">{employee.name}</td>
              <td className="px-4 py-3 text-slate-600">{employee.email}</td>
              <td className="px-4 py-3 text-slate-600">{employee.role}</td>
              <td className="px-4 py-3 text-slate-600">{employee.phone}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </Card>
  );
}
