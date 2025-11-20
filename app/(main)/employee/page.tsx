"use client";

import EmployeeTable from "@/components/features/employee/employee-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";

export default function EmployeePage() {
  const { allowed, isLoading } = usePermission("employee.manage");
  const canCreate = !isLoading && allowed;
  const permissionHint =
    "จำเป็นต้องมีสิทธิ์ employee.manage เพื่อเพิ่มพนักงานใหม่";

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"></header>
      {!canCreate ? (
        <Alert variant="destructive">
          <AlertDescription>{permissionHint}</AlertDescription>
        </Alert>
      ) : null}
      <EmployeeTable />
    </section>
  );
}
