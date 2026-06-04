"use client";

import { useEffect, useState } from "react";
import { BarChart3, User } from "lucide-react";
import type { SalesDashboardData, DashboardPeriod } from "../../types";
import { PeriodSwitcher } from "../../ui/period-switcher";
import { SalesKpiCards } from "./components/sales-kpi-cards";
import { SalesChartsSection } from "./components/sales-charts-section";

/* ================= Props ================= */
interface SalesDashboardViewProps {
  initialData: SalesDashboardData;
  employeeId: string;
}

/* ================= Component ================= */
export default function SalesDashboardView({
  initialData,
  employeeId,
}: SalesDashboardViewProps) {
  const [dashboardData, setDashboardData] =
    useState<SalesDashboardData>(initialData);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>(new Date());
  
  const { periodData, ytd, employeeName } = dashboardData;
  const [overviewPeriod, setOverviewPeriod] = useState<DashboardPeriod>("month");

  const periodOptions: { value: DashboardPeriod; label: string }[] = [
    { value: "day", label: "วันนี้" },
    { value: "month", label: "เดือนนี้" },
    { value: "year", label: "ปีนี้" },
  ];

  const periodLabels: Record<DashboardPeriod, string> = {
    day: "วันนี้",
    month: "เดือนนี้",
    year: "ปีนี้",
  };

  const monthlySales = periodData[overviewPeriod].monthlySales;
  const target = periodData[overviewPeriod].target;
  const jobStatus = periodData[overviewPeriod].jobStatus;

  // Auto-refresh every 30 seconds
  useEffect(() => {
    let isActive = true;
    const refreshDashboard = async () => {
      try {
        const response = await fetch(
          `/api/dashboard/sales?employeeId=${employeeId}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const nextData: SalesDashboardData = await response.json();
        if (!isActive) return;
        setDashboardData(nextData);
        setLastUpdatedAt(new Date());
      } catch (error) {
        console.error("Failed to refresh sales dashboard data", error);
      }
    };

    const intervalId = window.setInterval(refreshDashboard, 30000);
    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [employeeId]);

  return (
    <div className="min-h-screen bg-[#f0f2f8] px-3 py-4 sm:p-6 md:p-8 lg:p-10 space-y-5 sm:space-y-7 lg:space-y-8">
      {/* ================= Header ================= */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col items-center justify-center text-center w-full">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 bg-clip-text text-transparent leading-tight">
                แดชบอร์ดของฉัน
              </h1>
            </div>
          </div>

          {/* Employee name badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 shadow-sm mt-1">
            <User className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-semibold text-teal-800">
              {employeeName}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3 justify-center w-full max-w-sm">
            <div className="h-[3px] flex-1 bg-gradient-to-r from-transparent via-teal-300 to-teal-500 rounded-full" />
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-lg shadow-teal-500/50 animate-pulse" />
            <div className="h-[3px] flex-1 bg-gradient-to-l from-transparent via-teal-300 to-teal-500 rounded-full" />
          </div>
        </div>

        {/* Period Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 px-4 sm:px-4">
          <PeriodSwitcher
            value={overviewPeriod}
            onChange={setOverviewPeriod}
            options={periodOptions}
            variant="light"
          />
        </div>
      </div>

      {/* ================= KPI Cards ================= */}
      <SalesKpiCards 
        overviewPeriod={overviewPeriod}
        periodLabels={periodLabels}
        monthlySales={monthlySales}
        target={target}
        ytd={ytd}
        jobStatus={jobStatus}
      />

      {/* ================= Charts ================= */}
      <SalesChartsSection periodData={periodData} periodOptions={periodOptions} />
    </div>
  );
}
