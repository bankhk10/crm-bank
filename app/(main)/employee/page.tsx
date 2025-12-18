"use client";

import EmployeeTable from "@/components/features/employee/employee-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import { Users } from "lucide-react";

export default function EmployeePage() {
  const { allowed, isLoading } = usePermission("employee.manage");
  const canCreate = !isLoading && allowed;
  const permissionHint =
    "จำเป็นต้องมีสิทธิ์ employee.manage เพื่อเพิ่มพนักงานใหม่";

  return (
    <section className="space-y-6">
      {!canCreate ? (
        <Alert variant="destructive">
          <AlertDescription>{permissionHint}</AlertDescription>
        </Alert>
      ) : null}

      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3">
              <Users className="w-9 h-9 text-blue-600" />
              <h1 className="text-3xl font-bold tracking-tight">
                ข้อมูลพนักงาน
              </h1>
            </div>
          </div>

          <EmployeeTable />
        </div>
      </div>
    </section>
  );
}
