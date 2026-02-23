import React from "react";
import { auth } from "@/lib/auth";
import { isAuthorized } from "@/src/core/rbac";
import { redirect } from "next/navigation";
import { getEmployees } from "@/modules/employee/server/queries";
import { EmployeeTable } from "@/modules/employee";
import { Users } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    perPage?: string;
    q?: string;
  }>;
}

export default async function EmployeePage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const perms = session.user.permissionKeys ?? [];
  const canView = perms.includes("menu.employees") || perms.includes("employee.view") || perms.includes("employee.manage");
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

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(params.perPage || "200", 10)));
  const q = (params.q || "").trim();

  // Load mostly all for client-side filtering backward compatibility, 
  // or use the query params. Let's use server side pagination if possible, 
  // but EmployeeTable expects all records. Let's fetch perPage=100 for now.
  const { employees } = await getEmployees({
    page: 1,
    perPage: 500,
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
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3">
              <Users className="w-9 h-9 text-blue-600" />
              <h1 className="text-3xl font-bold tracking-tight">
                ข้อมูลพนักงาน
              </h1>
            </div>
          </div>
          <EmployeeTable employees={serializedEmployees as any} />
        </div>
      </div>
    </section>
  );
}
