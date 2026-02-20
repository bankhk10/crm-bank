"use client";

import { useParams } from "next/navigation";
import { CompanyFormWrapper } from "@/modules/companies/features/form/company-form-wrapper";

export default function EditCompanyPage() {
  const { companyId } = useParams() as { companyId: string };
  return <CompanyFormWrapper companyId={companyId} />;
}
