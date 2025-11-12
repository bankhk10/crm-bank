import { Card } from "@/components/ui/card";
import type { Company } from "@/types/companies";

const mockCompanies: Company[] = [
  {
    id: "acme",
    name: "Acme Industries",
    industry: "Manufacturing",
    status: "active"
  },
  {
    id: "globex",
    name: "Globex Corporation",
    industry: "Technology",
    status: "prospect"
  }
];

interface CompaniesKanbanBoardProps {
  selectedCompanyId?: string;
}

export default function CompaniesKanbanBoard({ selectedCompanyId }: CompaniesKanbanBoardProps) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {mockCompanies.map((company) => (
        <Card key={company.id} className={selectedCompanyId === company.id ? "border-blue-500" : undefined}>
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">{company.name}</h2>
            <p className="text-sm text-slate-600">{company.industry}</p>
          </header>
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">
            Status: {company.status}
          </p>
        </Card>
      ))}
    </section>
  );
}
