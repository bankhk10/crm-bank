"use client";

import Link from "next/link";
import EmployeeTable from "@/components/features/employee/employee-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";

export default function EmployeePage() {
  const { allowed, isLoading } = usePermission("employee.manage");
  const canCreate = !isLoading && allowed;
  const permissionHint = "จำเป็นต้องมีสิทธิ์ employee.manage เพื่อเพิ่มพนักงานใหม่";

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {canCreate ? (
          <Link
            className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            href="/employee/new"
          >
            Add employee
          </Link>
        ) : (
          <button
            type="button"
            className="rounded bg-blue-600/50 px-3 py-2 text-sm font-semibold text-white"
            disabled
            title={permissionHint}
          >
            Add employee
          </button>
        )}
      </header>
      {!canCreate ? (
        <Alert variant="destructive">
          <AlertDescription>{permissionHint}</AlertDescription>
        </Alert>
      ) : null}
      <EmployeeTable />
    </section>
  );
}
