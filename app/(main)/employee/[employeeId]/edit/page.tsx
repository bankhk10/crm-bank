"use client";

import { useParams } from "next/navigation";
import { EmployeeFormWrapper } from "@/modules/employee/features/form/employee-form-wrapper";

export default function EditEmployeePage() {
  const { employeeId } = useParams() as { employeeId: string };
  return <EmployeeFormWrapper employeeId={employeeId} />;
}
