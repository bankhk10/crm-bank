import { Suspense } from "react";
import { getFilterOptionsAction } from "@/modules/reports";
import { SalesReportDashboard } from "@/modules/reports";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "รายงานการขาย | CRM Bank",
};

export default async function SalesReportPage() {
  const { customers, employees, years } = await getFilterOptionsAction();

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Suspense
          fallback={
            <div className="flex h-[50vh] w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <SalesReportDashboard customers={customers} employees={employees} years={years} />
        </Suspense>
      </div>
    </div>
  );
}
