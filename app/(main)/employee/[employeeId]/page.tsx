"use client";

import { useParams } from "next/navigation";
import { EmployeeDetailView } from "@/modules/employee/features/detail-view/employee-detail-view";

export default function EmployeeDetailPage() {
  const { employeeId } = useParams() as { employeeId: string };
  return <EmployeeDetailView employeeId={employeeId} />;
}
