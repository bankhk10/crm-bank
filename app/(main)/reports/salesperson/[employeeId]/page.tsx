import { SalespersonDetailView } from "@/modules/reports";

interface SalespersonReportPageProps {
  params: Promise<{
    employeeId: string;
  }>;
}

export async function generateMetadata({ params }: SalespersonReportPageProps) {
  const { employeeId } = await params;
  return {
    title: `ผลงานพนักงานขาย ${employeeId} | CRM Bank`,
  };
}

export default async function SalespersonReportDetailPage({
  params,
}: SalespersonReportPageProps) {
  const { employeeId } = await params;

  return (
    <div className="min-h-screen bg-slate-50/60">
      <SalespersonDetailView employeeId={employeeId} />
    </div>
  );
}
