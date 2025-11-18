"use client";

import EmployeeForm from "@/components/features/employee/employee-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";

export default function NewEmployeePage() {
  const { allowed, isLoading } = usePermission("employee.manage");
  const canCreate = !isLoading && allowed;
  const permissionHint = "จำเป็นต้องมีสิทธิ์ employee.manage เพื่อสร้างพนักงานใหม่";

  return (
    <section className="space-y-6">
      {!canCreate ? (
        <Alert variant="destructive">
          <AlertDescription>{permissionHint}</AlertDescription>
        </Alert>
      ) : null}
      <EmployeeForm />
    </section>
  );
}
