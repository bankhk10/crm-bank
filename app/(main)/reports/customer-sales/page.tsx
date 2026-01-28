import { CustomerSalesList } from "@/components/reports/customer-sales/customer-sales-list";
import { fetchCustomerSalesShops } from "@/lib/data/report-customer-sales";

interface CustomerSalesPageProps {
  searchParams?: {
    from?: string;
    to?: string;
  };
}

export default async function CustomerSalesPage({
  searchParams,
}: CustomerSalesPageProps) {
  const { range, shops } = await fetchCustomerSalesShops({
    from: searchParams?.from,
    to: searchParams?.to,
  });

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <CustomerSalesList initialRange={range} initialShops={shops} />
      </div>
    </div>
  );
}
