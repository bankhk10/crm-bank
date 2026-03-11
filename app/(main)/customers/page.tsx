import React from "react";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { isAuthorized } from "@/modules/rbac";
import { redirect } from "next/navigation";
import { CustomersTable, type CustomerRecord } from "@/modules/customers";
import { UserCog } from "lucide-react";
import { PageHeader } from "@/components/custom/page-header";
import { getCustomersAction } from "@/modules/customers/server/actions";
import { PAGINATION } from "@/lib/constants";

export default async function CustomersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const perms = session.user.permissionKeys ?? [];
  const canView =
    perms.includes("menu.customers") || perms.includes("customer.view");
  const resourcePath = "/api/customers";
  const authorized = isAuthorized(resourcePath, perms);

  if (!canView && !authorized) {
    return (
      <div className="p-6">
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">คุณไม่มีสิทธิ์เปิดดูข้อมูลลูกค้า</span>
        </div>
      </div>
    );
  }

  const res = await getCustomersAction({
    page: PAGINATION.DEFAULT_PAGE,
    perPage: PAGINATION.DEFAULT_PER_PAGE,
  });

  const serializedCustomers = (res.customers ?? []).map((c: any) => ({
    ...c,
    email: c.email === null ? undefined : c.email,
    phone: c.phone === null ? undefined : c.phone,
    status: c.status === null ? undefined : c.status,
  }));

  return (
    <section className="space-y-6">
      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <PageHeader
            icon={UserCog}
            iconClassName="text-blue-600"
            title="ข้อมูลลูกค้า"
          />

          <CustomersTable
            initialData={serializedCustomers as CustomerRecord[]}
            initialTotal={typeof res.total === "number" ? res.total : 0}
          />
        </div>
      </div>
    </section>
  );
}
