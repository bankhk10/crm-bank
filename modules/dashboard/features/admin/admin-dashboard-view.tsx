"use client";

import { useEffect, useState } from "react";
import { Clock, BarChart3 } from "lucide-react";
import type { DashboardData, DashboardPeriod } from "../../types";
import { PeriodSwitcher } from "../../ui/period-switcher";
import { AdminKpiCards } from "./components/admin-kpi-cards";
import { AdminChartsSection } from "./components/admin-charts-section";

/* ================= Props ================= */
interface AdminDashboardViewProps {
  initialData: DashboardData;
}

/* ================= Component ================= */
export default function AdminDashboardView({
  initialData,
}: AdminDashboardViewProps) {
  const [dashboardData, setDashboardData] =
    useState<DashboardData>(initialData);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>(new Date());
  
  const { periodData, ytd } = dashboardData;
  const [overviewPeriod, setOverviewPeriod] = useState<DashboardPeriod>("month");

  const periodOptions: { value: DashboardPeriod; label: string }[] = [
    { value: "day", label: "วัน" },
    { value: "month", label: "เดือน" },
    { value: "year", label: "ปี" },
  ];

  const periodLabels: Record<DashboardPeriod, string> = {
    day: "วันนี้",
    month: "เดือนนี้",
    year: "ปีนี้",
  };

  const monthlySales = periodData[overviewPeriod].monthlySales;
  const target = periodData[overviewPeriod].target;

  // Auto-refresh every 30 seconds
  useEffect(() => {
    let isActive = true;
    const refreshDashboard = async () => {
      try {
        const response = await fetch("/api/dashboard/admin", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const nextData: DashboardData = await response.json();
        if (!isActive) return;
        setDashboardData(nextData);
        setLastUpdatedAt(new Date());
      } catch (error) {
        console.error("Failed to refresh dashboard data", error);
      }
    };

    const intervalId = window.setInterval(refreshDashboard, 30000);
    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f2f8] px-3 py-4 sm:p-6 md:p-8 lg:p-10 space-y-5 sm:space-y-7 lg:space-y-8">
      {/* ================= Header - Mobile First ================= */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Title */}
        <div className="flex flex-col items-center justify-center text-center w-full">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent leading-tight">
                ภาพรวมแดชบอร์ด
              </h1>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 justify-center w-full max-w-sm">
            <div className="h-[3px] flex-1 bg-gradient-to-r from-transparent via-blue-300 to-blue-500 rounded-full" />
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse" />
            <div className="h-[3px] flex-1 bg-gradient-to-l from-transparent via-blue-300 to-blue-500 rounded-full" />
          </div>
        </div>

        {/* Period Switcher & Last updated */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-4">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-600 bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm border border-slate-200/60">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">อัปเดตล่าสุด </span>
            <span className="font-medium">
              {lastUpdatedAt.toLocaleString("th-TH", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <PeriodSwitcher
            value={overviewPeriod}
            onChange={setOverviewPeriod}
            options={periodOptions}
            variant="light"
          />
        </div>
      </div>

      {/* ================= KPI Cards ================= */}
      <AdminKpiCards
        overviewPeriod={overviewPeriod}
        periodLabels={periodLabels}
        monthlySales={monthlySales}
        target={target}
        ytd={ytd}
      />

      {/* ================= Charts ================= */}
      <AdminChartsSection periodData={periodData} periodOptions={periodOptions} />
    </div>
  );
}
