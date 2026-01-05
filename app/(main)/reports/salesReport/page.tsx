import { Suspense } from "react";
import { getFilterOptions } from "@/app/actions/sales-report";
import { SalesReportClient } from "./client";
import { Loader2 } from "lucide-react";

export default async function SalesReportPage() {
  const { customers, employees, years } = await getFilterOptions();

  return (
    <div className="h-full p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <Suspense
        fallback={
          <div className="flex h-[50vh] w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <SalesReportClient
          customers={customers}
          employees={employees}
          years={years}
        />
      </Suspense>
    </div>
  );
}
