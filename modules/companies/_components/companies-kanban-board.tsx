"use client";

import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import type { CompanyRecord } from "../_types/types";

const mockCompanies: CompanyRecord[] = [
  {
    id: "acme",
    name: "Acme Industries",
    status: "active"
  },
  {
    id: "globex",
    name: "Globex Corporation",
    status: "active"
  }
];

interface CompaniesKanbanBoardProps {
  selectedCompanyId?: string;
}

export default function CompaniesKanbanBoard({ selectedCompanyId }: CompaniesKanbanBoardProps) {
  const { allowed, isLoading } = usePermission("menu.companies");

  if (isLoading) {
    return <Card className="p-4 text-sm text-slate-500">กำลังโหลดบริษัท...</Card>;
  }

  if (!allowed) {
    return (
      <Alert variant="destructive">
        <AlertDescription>คุณไม่มีสิทธิ์ดูรายการบริษัท</AlertDescription>
      </Alert>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {mockCompanies.map((company) => (
        <Card key={company.id} className={selectedCompanyId === company.id ? "border-blue-500" : undefined}>
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">{company.name}</h2>
          </header>
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">
            Status: {company.status}
          </p>
        </Card>
      ))}
    </section>
  );
}
