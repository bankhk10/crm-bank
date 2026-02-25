import React from "react";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { isAuthorized } from "@/modules/rbac";
import { redirect } from "next/navigation";
import { findCompanyById } from "@/modules/companies/infrastructure/company.repository";
import { CompanyDetailView } from "@/modules/companies/features/detail-view/company-detail-view";
import { CompanyDetail } from "@/modules/companies/types/types";

interface PageProps {
  params: Promise<{ companyId: string }>;
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { companyId } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const perms = session.user.permissionKeys ?? [];
  const canView = perms.includes("company.view");
  const resourcePath = "/api/companies";
  const authorized = isAuthorized(resourcePath, perms);

  // We can handle permission check here or inside View if we want to show specific UI
  // But RSC should generally return 403 or redirect.
  // Given the previous implementation had a specific "Access Denied" UI, 
  // we can let the Client Component handle the logic or fetch logic handle it.

  // However, fetching data usually requires permission.
  // The API route had specific checks.
  // Let's enforce it here.
  if (!canView && !authorized) {
    // Return a wrapper that shows the alert, or redirect.
    // Since we want to preserve the UI, we can pass null company?
    // No, let's render the Alert directly here (server rendered).
    // But CompanyDetailView handles !canView check too.
    // So we can just fetch data (if we allowed server-side fetch without strict check, but we shouldn't).
    // Let's assume if strictly no permission, we don't fetch.
    // We'll pass a dummy or null to View and let it show error?
    // Actually `CompanyDetailView` expects `company` prop.
    // Let's render the error UI directly here if unauthorized.
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">คุณไม่มีสิทธิ์เปิดดูข้อมูลบริษัทนี้</span>
        </div>
      </div>
    );
  }

  const company = await findCompanyById(companyId);

  if (!company) {
    // Render "Not Found" UI
    return (
      <div className="container max-w-4xl mx-auto p-6 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">ไม่พบข้อมูล</strong>
          <span className="block sm:inline"> ไม่พบข้อมูลบริษัทที่คุณค้นหา</span>
        </div>
      </div>
    );
  }

  // Serialize dates
  const serializedCompany: CompanyDetail = {
    ...company,
    createdAt: company.createdAt?.toISOString() ?? null,
    updatedAt: company.updatedAt?.toISOString() ?? undefined, // optional in record?
    deletedAt: company.deletedAt?.toISOString() ?? undefined,
    // Add missing optional fields if they are null in DB but undefined in Type, 
    // but we updated Type to allow null.
  };

  return <CompanyDetailView company={serializedCompany} />;
}

