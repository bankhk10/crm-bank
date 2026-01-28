import { notFound } from "next/navigation";
import { CustomerSalesDetail } from "@/components/reports/customer-sales/customer-sales-detail";
import { fetchCustomerSalesShopDetail } from "@/lib/data/report-customer-sales";

interface CustomerSalesDetailPageProps {
  params: { shopId: string };
  searchParams?: {
    from?: string;
    to?: string;
    page?: string;
  };
}

export default async function CustomerSalesDetailPage({
  params,
  searchParams,
}: CustomerSalesDetailPageProps) {
  const page = searchParams?.page ? Number(searchParams.page) : 1;
  const data = await fetchCustomerSalesShopDetail(params.shopId, {
    from: searchParams?.from,
    to: searchParams?.to,
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
