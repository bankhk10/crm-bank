import { notFound } from "next/navigation";
import { CustomerSalesDetail } from "@/components/reports/customer-sales/customer-sales-detail";
import { fetchCustomerSalesShopDetail } from "@/lib/data/report-customer-sales";

interface CustomerSalesDetailPageProps {
  params: { shopId: string };
  searchParams?: Promise<{
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function CustomerSalesDetailPage({
  params,
  searchParams,
}: CustomerSalesDetailPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = resolvedSearchParams?.page ? Number(resolvedSearchParams.page) : 1;
  const data = await fetchCustomerSalesShopDetail(params.shopId, {
    from: resolvedSearchParams?.from,
    to: resolvedSearchParams?.to,
    page: Number.isNaN(page) ? 1 : page,
  });

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <CustomerSalesDetail initialData={data} />
      </div>
    </div>
  );
}
