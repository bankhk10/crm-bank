import CompaniesKanbanBoard from "@/components/features/companies/companies-kanban-board";

interface CompanyDetailPageProps {
  params: {
    companyId: string;
  };
}

export default function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Company profile</h1>
        <p className="text-sm text-muted-foreground">
          Review and edit account #{params.companyId}.
        </p>
      </header>
      <CompaniesKanbanBoard selectedCompanyId={params.companyId} />
    </section>
  );
}
