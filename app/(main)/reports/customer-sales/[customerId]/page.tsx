import { CustomerSalesDetailView } from "@/modules/reports";

interface CustomerReportPageProps {
  params: Promise<{
    customerId: string;
  }>;
}

export async function generateMetadata({ params }: CustomerReportPageProps) {
  const { customerId } = await params;
  return {
    title: `รายละเอียดลูกค้า ${customerId} | CRM Bank`,
  };
}

export default async function CustomerReportDetailPage({
  params,
}: CustomerReportPageProps) {
  const { customerId } = await params;

  return (
    <div className="min-h-screen bg-slate-50/60">
      <CustomerSalesDetailView customerId={customerId} />
    </div>
  );
}
