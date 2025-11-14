"use client";

import EmployeeForm from "@/components/features/employee/employee-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";

interface EmployeeDetailPageProps {
  params: {
    employeeId: string;
  };
}

export default function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const { allowed, isLoading } = usePermission("employee.manage");
  const canEdit = !isLoading && allowed;
  const permissionHint = "จำเป็นต้องมีสิทธิ์ employee.manage เพื่อแก้ไขข้อมูลพนักงาน";

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Edit employee</h1>
        <p className="text-sm text-muted-foreground">Update details for employee #{params.employeeId}.</p>
      </header>
      {!canEdit ? (
        <Alert variant="destructive">
          <AlertDescription>{permissionHint}</AlertDescription>
        </Alert>
      ) : null}
      <EmployeeForm employeeId={params.employeeId} />
    </section>
  );
}
