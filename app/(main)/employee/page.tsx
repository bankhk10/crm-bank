import React from "react";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { isAuthorized } from "@/modules/rbac";
import { redirect } from "next/navigation";
import { findEmployees } from "@/modules/employee/infrastructure/employee.repository";
import { EmployeeTable } from "@/modules/employee";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/custom/page-header";

export default async function EmployeePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const perms = session.user.permissionKeys ?? [];
  const canView =
    perms.includes("menu.employees") || perms.includes("employee.view");
  const resourcePath = "/api/employee";
  const authorized = isAuthorized(resourcePath, perms);

  if (!canView && !authorized) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">คุณไม่มีสิทธิ์เปิดดูข้อมูลพนักงาน</span>
        </div>
      </div>
    );
  }

  const { employees } = await findEmployees({
    page: 1,
    perPage: 100,
  });

  const serializedEmployees = employees.map(e => ({
    ...e,
    createdAt: e.createdAt?.toISOString(),
    updatedAt: e.updatedAt?.toISOString(),
    deletedAt: e.deletedAt?.toISOString(),
  }));

  return (
    <section className="space-y-6">
      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <PageHeader
            icon={Users}
            iconClassName="text-blue-600"
            title="ข้อมูลพนักงาน"
          />
          <EmployeeTable employees={serializedEmployees as any} />
        </div>
      </div>
    </section>
  );
}

