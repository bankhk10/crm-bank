import React from "react";
import { auth } from "@/lib/auth";
import { isAuthorized } from "@/src/core/rbac";
import { redirect } from "next/navigation";
import { getCompanies } from "@/modules/companies/_lib/data-access";
import { CompaniesView } from "@/modules/companies/_components/companies-view";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    perPage?: string;
    q?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const perms = session.user.permissionKeys ?? [];
  const canView = perms.includes("company.view");
  const resourcePath = "/api/companies"; // Using same resource path for consistency
  const authorized = isAuthorized(resourcePath, perms);

  // If strict RBAC is needed, handle it here. 
  // The client component also checks "menu.companies" & "company.view".
  // But we should protect data access here too.
  if (!canView && !authorized) {
    // If we want to be strict, redirect to 403 or show error.
    // However, the original page showed an Alert if !canView.
    // We can let the Client Component show the alert by passing empty data 
    // or we can just render the Alert here. 
    // Best practice: Server component returns Unauthorized UI or redirects.

    // Let's pass empty data and let Client Component handle the specific "You don't have permission" UI 
    // matching the original behavior, OR just show a simple Server "Forbidden".
    // The original code returned: <Alert>...</Alert> if !canView.
    // So if we detect !canView here, we can just return a localized error UI.
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">คุณไม่มีสิทธิ์เปิดดูข้อมูลบริษัท</span>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(params.perPage || "12", 10)));
  const q = (params.q || "").trim();

  const parseDate = (value: string | undefined): Date | undefined => {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const from = parseDate(params.from);
  const to = parseDate(params.to);

  const { total, companies } = await getCompanies({
    page,
    perPage,
    q,
    from,
    to
  });

  // Transform data if needed to match Client types (e.g. Dates to strings if strictly needed, 
  // but Next.js RSC can pass Date objects to Client Components? 
  // Warning: "Only plain objects can be passed to Client Components from Server Components. Date objects are not supported."
  // So we must serialize Dates.

  const serializedCompanies = companies.map(c => ({
    ...c,
    createdAt: c.createdAt?.toISOString(),
    updatedAt: c.updatedAt?.toISOString(),
    deletedAt: c.deletedAt?.toISOString(),
  }));

  return (
    <CompaniesView
      initialCompanies={serializedCompanies}
      total={total}
      initialPage={page}
      initialPerPage={perPage}
      initialQ={q}
      initialDateRange={from || to ? { from, to } : undefined}
    />
  );
}

