"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePermission } from "@/hooks/use-permission";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  ShieldCheck,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  RefreshCw,
  Search,
  DollarSign,
  Users,
  Clock,
  ArrowLeft,
  LayoutGrid,
  List as ListIcon,
  AlertCircle,
  Store as StoreIcon,
  Package,
  Calendar,
  MapPin,
  FileCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ActivityStatusBadge } from "../../ui/activity-status-badge";
import { getWorkTypeName } from "../../constants";
import type { ActivityPlanWithRelations } from "../../types";
import { getApprovalQueueDataAction } from "../../server/actions";
import {
  ApprovalActionDialog,
  type ApprovalActionType,
} from "./components/approval-action-dialog";
import { cn } from "@/lib/utils";

type TabType = "my_line" | "all" | "budget" | "helper" | "history";

export default function ActivityPlanApprovalListView() {
  const { data: session } = useSession();
  const { hasPermission, isLoading: permLoading } = usePermission(
    "menu.activity_plans",
  );

  const roles = (session?.user as any)?.roles ?? [];
  const isAdmin =
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo") ||
    (session?.user as any)?.role === "administrator" ||
    (session?.user as any)?.role === "ADMIN";

  const canApprove =
    isAdmin ||
    hasPermission("activity.approve") ||
    hasPermission("activity.manage") ||
    hasPermission("activity.view");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [pendingPlans, setPendingPlans] = useState<ActivityPlanWithRelations[]>(
    [],
  );
  const [historyPlans, setHistoryPlans] = useState<ActivityPlanWithRelations[]>(
    [],
  );
  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    totalPending: 0,
    myLinePending: 0,
    allLinePending: 0,
    budgetPending: 0,
    helperPending: 0,
    myHelperPending: 0,
    historyCount: 0,
    totalBudgetRequested: 0,
  });

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<TabType>("my_line");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // UI-only state for mobile filter sheet
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Quick Action Dialog states
  const [actionPlan, setActionPlan] =
    useState<ActivityPlanWithRelations | null>(null);
  const [actionType, setActionType] = useState<ApprovalActionType>("APPROVE");
  const [actionDialogOpen, setActionDialogOpen] = useState(false);

  const userEmployeeId = session?.user?.employeeId;

  // Load all queue data
  const loadQueueData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getApprovalQueueDataAction();
      if (res.success) {
        setPendingPlans(
          (res.pendingPlans as ActivityPlanWithRelations[]) || [],
        );
        setHistoryPlans(
          (res.historyPlans as ActivityPlanWithRelations[]) || [],
        );
        setActivityTypes(res.activityTypes || []);
        if (res.counts) {
          setCounts(res.counts);
          // If no items in my_line, switch active tab to 'all' if has other pending
          setActiveTab((prev) =>
            res.counts &&
            res.counts.myLinePending === 0 &&
            res.counts.totalPending > 0 &&
            prev === "my_line"
              ? "all"
              : prev,
          );
        }
      } else {
        setError(res.error || "เกิดข้อผิดพลาดในการโหลดคิวงานอนุมัติ");
      }
    } catch (err: any) {
      setError(err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueueData();
  }, [loadQueueData]);

  // Filtered plans based on tab, search, and type
  const filteredPlans = useMemo(() => {
    let source = activeTab === "history" ? historyPlans : pendingPlans;

    // Apply tab filter
    if (activeTab === "my_line") {
      source = source.filter(
        (p) =>
          p.status === "PENDING_LINE_APPROVAL" &&
          (isAdmin || p.currentApproverEmployeeId === userEmployeeId),
      );
    } else if (activeTab === "budget") {
      source = source.filter((p) => p.status === "PENDING_BUDGET_APPROVAL");
    } else if (activeTab === "helper") {
      source = source.filter((p) => p.status === "PENDING_HELPER_APPROVAL");
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      source = source.filter(
        (p) =>
          (p.code && p.code.toLowerCase().includes(q)) ||
          p.title.toLowerCase().includes(q) ||
          p.employee?.name.toLowerCase().includes(q) ||
          (p.location && p.location.toLowerCase().includes(q)) ||
          (p.province && p.province.toLowerCase().includes(q)) ||
          (p.stores &&
            p.stores.some((s) =>
              (s.store?.name || s.storeName || "").toLowerCase().includes(q),
            )) ||
          (p.tour?.store?.name &&
            p.tour.store.name.toLowerCase().includes(q)) ||
          (p.items &&
            p.items.some((it) =>
              (it.customerName || it.surveyStoreName || "")
                .toLowerCase()
                .includes(q),
            )),
      );
    }

    // Apply Activity Type Filter
    if (typeFilter !== "ALL") {
      source = source.filter((p) => {
        if (p.workTypes && p.workTypes.length > 0) {
          return p.workTypes.some(
            (wt) =>
              wt.activityType?.code === typeFilter ||
              wt.activityType?.id === typeFilter ||
              wt.activityType?.name === typeFilter,
          );
        }
        if (typeof p.activityType === "object" && p.activityType) {
          return (
            p.activityType?.code === typeFilter ||
            p.activityType?.id === typeFilter ||
            p.activityType?.name === typeFilter
          );
        }
        return p.activityType === typeFilter;
      });
    }

    return source;
  }, [
    activeTab,
    pendingPlans,
    historyPlans,
    searchQuery,
    typeFilter,
    userEmployeeId,
    isAdmin,
  ]);

  const handleOpenActionDialog = (
    plan: ActivityPlanWithRelations,
    type: ApprovalActionType,
  ) => {
    setActionPlan(plan);
    setActionType(type);
    setActionDialogOpen(true);
  };

  const hasActiveFilter = typeFilter !== "ALL";

  const clearFilters = () => {
    setTypeFilter("ALL");
    setSearchQuery("");
  };

  if (permLoading) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium space-y-2">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600" />
        <p>กำลังตรวจสอบสิทธิ์...</p>
      </div>
    );
  }

  if (!canApprove) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertDescription>
          คุณไม่มีสิทธิ์เข้าถึงหน้าอนุมัติ Trip Plan
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <section className="space-y-3 md:space-y-4 px-3 py-3 md:px-6 md:py-4 pb-28 md:pb-8 max-w-7xl mx-auto">
      {/* ─── 1. HEADER ─── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href="/activity-plans">
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl h-9 w-9 md:h-10 md:w-10 border-slate-200 text-slate-600 hover:text-slate-900 shrink-0"
              title="กลับหน้ารายการแผนงาน"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight truncate">
              อนุมัติแผนงาน
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              {counts.totalPending > 0 && (
                <span className="text-xs text-slate-500">
                  รออนุมัติ{" "}
                  <span className="font-bold text-amber-700">
                    {counts.totalPending}
                  </span>{" "}
                  รายการ
                </span>
              )}
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <ShieldCheck className="h-3 w-3" />
                  <span className="hidden sm:inline">Administrator</span>
                  <span className="sm:hidden">Admin</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={loadQueueData}
            disabled={loading}
            className="rounded-xl h-9 w-9 md:h-10 md:w-10 border-slate-200"
            title="รีเฟรชคิวงาน"
            aria-label="รีเฟรชคิวงาน"
          >
            <RefreshCw
              className={cn("h-4 w-4", loading && "animate-spin")}
            />
          </Button>
          <Link href="/activity-plans" className="hidden md:block">
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-xl h-9"
            >
              หน้ารายการแผนงาน
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ─── 2. KPI SUMMARY CARDS ─── */}
      {/* Mobile: horizontal scroll | Desktop: grid 5 cols */}
      <div className="lg:hidden -mx-3 px-3">
        <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide">
          {kpiCards.map((kpi) => (
            <KpiCard
              key={kpi.tab}
              {...kpi}
              count={getKpiCount(kpi.tab, counts)}
              subtitle={getKpiSubtitle(kpi.tab, counts)}
              isActive={activeTab === kpi.tab}
              onClick={() => setActiveTab(kpi.tab)}
            />
          ))}
        </div>
      </div>
      <div className="hidden lg:grid lg:grid-cols-5 gap-3">
        {kpiCards.map((kpi) => (
          <KpiCardDesktop
            key={kpi.tab}
            {...kpi}
            count={getKpiCount(kpi.tab, counts)}
            subtitle={getKpiSubtitle(kpi.tab, counts)}
            isActive={activeTab === kpi.tab}
            onClick={() => setActiveTab(kpi.tab)}
          />
        ))}
      </div>

      {/* ─── 3. TABS ─── */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 -mx-3 px-3 md:mx-0 md:px-0">
        <div className="flex items-center gap-1 overflow-x-auto pb-0 scrollbar-hide -mb-px">
          {tabItems.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer shrink-0",
                activeTab === tab.value
                  ? `${tab.activeClass} border-current`
                  : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300",
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="md:hidden">{tab.shortLabel}</span>
              <span className="hidden md:inline">{tab.label}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0 rounded-full font-bold min-w-[20px] text-center",
                  activeTab === tab.value
                    ? tab.badgeActiveClass
                    : "bg-slate-100 text-slate-600",
                )}
              >
                {getTabCount(tab.value, counts)}
              </span>
            </button>
          ))}
        </div>

        {/* View Mode Toggle — Desktop only */}
        <div className="hidden lg:flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg shrink-0 ml-2">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 rounded-md text-xs transition-colors cursor-pointer",
              viewMode === "grid"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500 hover:text-slate-800",
            )}
            title="มุมมองการ์ด"
            aria-label="มุมมองการ์ด"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "p-1.5 rounded-md text-xs transition-colors cursor-pointer",
              viewMode === "table"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500 hover:text-slate-800",
            )}
            title="มุมมองตาราง"
            aria-label="มุมมองตาราง"
          >
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── 4. SEARCH & FILTER ─── */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="ค้นหาแผนงาน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-10 bg-white rounded-xl border-slate-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="ล้างคำค้นหา"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Mobile: filter button → Sheet */}
        <div className="md:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFilterSheetOpen(true)}
            className={cn(
              "rounded-xl h-10 w-10 relative border-slate-200",
              hasActiveFilter && "border-blue-300 bg-blue-50",
            )}
            title="ตัวกรอง"
            aria-label="ตัวกรอง"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {hasActiveFilter && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                1
              </span>
            )}
          </Button>
        </div>

        {/* Desktop: inline select */}
        <div className="hidden md:block w-52">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">ทุกประเภทกิจกรรม</option>
            {activityTypes.map((t) => (
              <option key={t.id || t.code} value={t.code || t.id}>
                {t.name || t.code}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop: clear filter */}
        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="hidden md:flex text-xs text-slate-500 hover:text-slate-700 gap-1 rounded-xl h-10 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            ล้างตัวกรอง
          </Button>
        )}
      </div>

      {/* Mobile Filter Sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>ตัวกรอง</SheetTitle>
            <SheetDescription>เลือกประเภทกิจกรรมที่ต้องการกรอง</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                ประเภทกิจกรรม
              </label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                }}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">ทุกประเภท</option>
                {activityTypes.map((t) => (
                  <option key={t.id || t.code} value={t.code || t.id}>
                    {t.name || t.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              {hasActiveFilter && (
                <Button
                  variant="outline"
                  onClick={() => {
                    clearFilters();
                    setFilterSheetOpen(false);
                  }}
                  className="flex-1 h-11 rounded-xl text-sm cursor-pointer"
                >
                  ล้างตัวกรอง
                </Button>
              )}
              <Button
                onClick={() => setFilterSheetOpen(false)}
                className="flex-1 h-11 rounded-xl text-sm cursor-pointer"
              >
                ปิด
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ─── 5. CONTENT: LOADING / EMPTY / CARDS / TABLE ─── */}
      {loading ? (
        /* Skeleton Loading */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3"
            >
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-28 rounded-md" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-5 w-full rounded-md" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-3.5 w-40 rounded" />
                <Skeleton className="h-3.5 w-36 rounded" />
                <Skeleton className="h-3.5 w-32 rounded" />
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              <div className="pt-2">
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
              <div className="flex gap-1.5">
                <Skeleton className="h-10 flex-1 rounded-xl" />
                <Skeleton className="h-10 flex-1 rounded-xl" />
                <Skeleton className="h-10 flex-[1.3] rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPlans.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 md:p-12 text-center space-y-3">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-100 text-slate-400">
            {searchQuery || hasActiveFilter ? (
              <Search className="h-7 w-7" />
            ) : (
              <CheckCircle2 className="h-7 w-7" />
            )}
          </div>
          <h3 className="text-sm md:text-base font-bold text-slate-800">
            {searchQuery || hasActiveFilter
              ? "ไม่พบรายการที่ตรงกับเงื่อนไข"
              : activeTab === "my_line"
                ? "ไม่มีแผนงานรออนุมัติในสายงานคุณ"
                : activeTab === "budget"
                  ? "ไม่มีแผนงานรออนุมัติงบประมาณ"
                  : activeTab === "helper"
                    ? "ไม่มีแผนงานรออนุมัติคนช่วยงาน"
                    : activeTab === "history"
                      ? "ยังไม่มีประวัติการดำเนินการ"
                      : "ไม่มีรายการรออนุมัติ"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || hasActiveFilter
              ? "ลองปรับเงื่อนไขการค้นหาหรือตัวกรอง"
              : "รายการจะปรากฏที่นี่เมื่อพนักงานยื่นส่งแผนงาน"}
          </p>
          {(searchQuery || hasActiveFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-xs rounded-xl h-9 gap-1.5 mt-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              ล้างตัวกรอง
            </Button>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* Table View — Desktop only, force cards on smaller screens */
        <>
          {/* Cards fallback for mobile/tablet even in table mode */}
          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentUserEmployeeId={userEmployeeId}
                isAdmin={isAdmin}
                onAction={(type) => handleOpenActionDialog(plan, type)}
              />
            ))}
          </div>
          {/* Actual table for desktop */}
          <div className="hidden lg:block bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b">
                  <tr>
                    <th className="p-3.5">เลขที่แผน</th>
                    <th className="p-3.5">ชื่อกิจกรรม</th>
                    <th className="p-3.5">ประเภทงาน</th>
                    <th className="p-3.5">ผู้จัดทำ</th>
                    <th className="p-3.5">ร้านค้า</th>
                    <th className="p-3.5">ช่วงเวลาจัดงาน</th>
                    <th className="p-3.5">งบขอใช้</th>
                    <th className="p-3.5">สถานะ</th>
                    <th className="p-3.5 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPlans.map((plan) => {
                    const sp = plan.salesPromotionBudgetRequested
                      ? Number(plan.salesPromotionBudgetRequested)
                      : 0;
                    const mkt = plan.marketingBudgetRequested
                      ? Number(plan.marketingBudgetRequested)
                      : 0;
                    const total = sp + mkt;
                    const isMyLine =
                      plan.status === "PENDING_LINE_APPROVAL" &&
                      (isAdmin ||
                        plan.currentApproverEmployeeId === userEmployeeId);

                    const isPending =
                      plan.status === "PENDING_LINE_APPROVAL" ||
                      plan.status === "PENDING_BUDGET_APPROVAL" ||
                      plan.status === "PENDING_HELPER_APPROVAL";

                    // Work Types from Normalized Relation
                    const workTypeNames: string[] = [];
                    if (plan.workTypes && plan.workTypes.length > 0) {
                      for (const wt of plan.workTypes) {
                        if (wt.activityType?.name) {
                          workTypeNames.push(wt.activityType.name);
                        }
                      }
                    } else if (plan.activityType?.name) {
                      workTypeNames.push(plan.activityType.name);
                    }

                    // Store count
                    const storeCount =
                      (plan.stores?.length || 0) + (plan.tour?.store ? 1 : 0);

                    return (
                      <tr
                        key={plan.id}
                        className={cn(
                          "hover:bg-slate-50/80 transition-colors",
                          isMyLine && "bg-amber-50/30",
                        )}
                      >
                        <td className="p-3.5 font-mono font-bold text-blue-700">
                          <Link
                            href={`/activity-plans/approvals/${plan.id}`}
                            className="hover:underline"
                          >
                            {plan.code || plan.id.slice(0, 8)}
                          </Link>
                        </td>
                        <td
                          className="p-3.5 font-semibold text-slate-900 max-w-[180px] truncate"
                          title={plan.title}
                        >
                          <Link
                            href={`/activity-plans/approvals/${plan.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {plan.title}
                          </Link>
                        </td>
                        <td className="p-3.5 max-w-[140px]">
                          <div className="flex flex-wrap gap-1">
                            {workTypeNames.slice(0, 2).map((name, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className={cn(
                                  "text-[10px] px-1.5 py-0 font-medium truncate max-w-[120px]",
                                  name === "ทัวร์"
                                    ? "bg-sky-50 text-sky-800 border-sky-200"
                                    : "bg-slate-50 text-slate-700",
                                )}
                                title={name}
                              >
                                {name}
                              </Badge>
                            ))}
                            {workTypeNames.length > 2 && (
                              <span className="text-[10px] text-slate-400">
                                +{workTypeNames.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-700 whitespace-nowrap">
                          {plan.employee.name}
                        </td>
                        <td className="p-3.5 text-slate-600 whitespace-nowrap">
                          {storeCount > 0 ? (
                            <span className="inline-flex items-center gap-1 font-medium text-amber-900">
                              <StoreIcon className="w-3 h-3 text-amber-600" />
                              {storeCount} ร้าน
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-600 whitespace-nowrap">
                          {format(new Date(plan.startDate), "dd MMM yy", {
                            locale: th,
                          })}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800 whitespace-nowrap">
                          {total > 0 ? `${total.toLocaleString()} ฿` : "-"}
                        </td>
                        <td className="p-3.5">
                          <ActivityStatusBadge status={plan.status} />
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/activity-plans/approvals/${plan.id}`}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-xs font-semibold text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 gap-1 rounded-lg cursor-pointer"
                                title="ดูรายละเอียดแผนงานสำหรับการอนุมัติ"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                ดูข้อมูล
                              </Button>
                            </Link>
                            {isPending && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenActionDialog(
                                      plan,
                                      "REQUEST_CORRECTION",
                                    )
                                  }
                                  className="h-8 px-2 text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                                  title="ส่งกลับแก้ไข"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleOpenActionDialog(plan, "REJECT")
                                  }
                                  className="h-8 px-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                  title="ปฏิเสธ"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleOpenActionDialog(plan, "APPROVE")
                                  }
                                  className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs rounded-lg font-bold cursor-pointer"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  อนุมัติ
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Card / Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentUserEmployeeId={userEmployeeId}
              isAdmin={isAdmin}
              onAction={(type) => handleOpenActionDialog(plan, type)}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {!loading && filteredPlans.length > 0 && (
        <p className="text-[11px] text-slate-400 text-center pb-2">
          แสดง {filteredPlans.length} รายการ
        </p>
      )}

      {/* Quick Action Confirmation Dialog */}
      <ApprovalActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        plan={actionPlan}
        actionType={actionType}
        onSuccess={() => {
          loadQueueData();
        }}
      />
    </section>
  );
}

// ────────────────────────────────────────────────────────
// KPI Card Configuration
// ────────────────────────────────────────────────────────
const kpiCards: Array<{
  tab: TabType;
  label: string;
  icon: React.ElementType;
  color: string;
  activeColor: string;
  activeBg: string;
  activeBorder: string;
}> = [
  {
    tab: "all",
    label: "รออนุมัติทั้งหมด",
    icon: FileCheck,
    color: "text-slate-600",
    activeColor: "text-slate-900",
    activeBg: "bg-slate-50",
    activeBorder: "border-slate-400",
  },
  {
    tab: "my_line",
    label: "คิวของฉัน",
    icon: ShieldCheck,
    color: "text-amber-600",
    activeColor: "text-amber-900",
    activeBg: "bg-amber-50",
    activeBorder: "border-amber-400",
  },
  {
    tab: "budget",
    label: "งบประมาณ",
    icon: DollarSign,
    color: "text-blue-600",
    activeColor: "text-blue-900",
    activeBg: "bg-blue-50",
    activeBorder: "border-blue-400",
  },
  {
    tab: "helper",
    label: "คนช่วยงาน",
    icon: Users,
    color: "text-purple-600",
    activeColor: "text-purple-900",
    activeBg: "bg-purple-50",
    activeBorder: "border-purple-400",
  },
  {
    tab: "history",
    label: "ประวัติ",
    icon: Clock,
    color: "text-emerald-600",
    activeColor: "text-emerald-900",
    activeBg: "bg-emerald-50",
    activeBorder: "border-emerald-400",
  },
];

function getKpiCount(
  tab: TabType,
  counts: {
    totalPending: number;
    myLinePending: number;
    budgetPending: number;
    helperPending: number;
    historyCount: number;
    totalBudgetRequested: number;
  },
): number {
  switch (tab) {
    case "all":
      return counts.totalPending;
    case "my_line":
      return counts.myLinePending;
    case "budget":
      return counts.budgetPending;
    case "helper":
      return counts.helperPending;
    case "history":
      return counts.historyCount;
    default:
      return 0;
  }
}

function getKpiSubtitle(
  tab: TabType,
  counts: {
    totalPending: number;
    myLinePending: number;
    budgetPending: number;
    helperPending: number;
    historyCount: number;
    totalBudgetRequested: number;
  },
): string {
  switch (tab) {
    case "all":
      return "ทุกสายงาน";
    case "my_line":
      return counts.myLinePending > 0 ? "⚡ รอคุณตัดสินใจ" : "ไม่มีคิวค้าง";
    case "budget":
      return `รวม ${counts.totalBudgetRequested.toLocaleString()} ฿`;
    case "helper":
      return "พิจารณาตามแผนก";
    case "history":
      return "อนุมัติ/ตีกลับ/ปฏิเสธ";
    default:
      return "";
  }
}

// ────────────────────────────────────────────────────────
// Mobile KPI Card (Horizontal Scroll)
// ────────────────────────────────────────────────────────
function KpiCard({
  label,
  icon: Icon,
  color,
  activeColor,
  activeBg,
  activeBorder,
  count,
  subtitle,
  isActive,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  color: string;
  activeColor: string;
  activeBg: string;
  activeBorder: string;
  count: number;
  subtitle: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "min-w-[150px] max-w-[180px] flex-shrink-0 snap-start rounded-xl border p-3 text-left transition-all cursor-pointer",
        isActive
          ? `${activeBg} ${activeBorder} border-b-[3px] shadow-sm`
          : "bg-white border-slate-200 hover:border-slate-300",
      )}
    >
      <span
        className={cn(
          "flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide",
          isActive ? activeColor : color,
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </span>
      <div
        className={cn(
          "text-2xl font-black mt-1",
          isActive ? activeColor : "text-slate-900",
        )}
      >
        {count}
        <span className="text-xs font-medium text-slate-500 ml-1">
          รายการ
        </span>
      </div>
      <p
        className={cn(
          "text-[10px] font-medium mt-0.5 truncate",
          isActive ? activeColor : "text-slate-500",
        )}
      >
        {subtitle}
      </p>
    </button>
  );
}

// ────────────────────────────────────────────────────────
// Desktop KPI Card (Grid)
// ────────────────────────────────────────────────────────
function KpiCardDesktop({
  label,
  icon: Icon,
  color,
  activeColor,
  activeBg,
  activeBorder,
  count,
  subtitle,
  isActive,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  color: string;
  activeColor: string;
  activeBg: string;
  activeBorder: string;
  count: number;
  subtitle: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md border rounded-2xl",
        isActive
          ? `${activeBg} ${activeBorder} border-b-[3px] shadow-sm`
          : "bg-white border-slate-200/80",
      )}
    >
      <CardContent className="p-4 space-y-1">
        <span
          className={cn(
            "text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5",
            isActive ? activeColor : color,
          )}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          {label}
        </span>
        <div
          className={cn(
            "text-2xl font-black",
            isActive ? activeColor : "text-slate-900",
          )}
        >
          {count}
          <span className="text-xs font-medium text-slate-500 ml-1">
            รายการ
          </span>
        </div>
        <p
          className={cn(
            "text-[11px] font-medium truncate",
            isActive ? activeColor : "text-slate-500",
          )}
          title={subtitle}
        >
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────
// Tab Configuration
// ────────────────────────────────────────────────────────
const tabItems: Array<{
  value: TabType;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  activeClass: string;
  badgeActiveClass: string;
}> = [
  {
    value: "all",
    label: "คิวงานทั้งหมด",
    shortLabel: "ทั้งหมด",
    icon: FileCheck,
    activeClass: "text-slate-900",
    badgeActiveClass: "bg-slate-800 text-white",
  },
  {
    value: "my_line",
    label: "คิวสายงานของฉัน",
    shortLabel: "ของฉัน",
    icon: ShieldCheck,
    activeClass: "text-amber-700",
    badgeActiveClass: "bg-amber-600 text-white",
  },
  {
    value: "budget",
    label: "งบประมาณ",
    shortLabel: "งบ",
    icon: DollarSign,
    activeClass: "text-blue-700",
    badgeActiveClass: "bg-blue-600 text-white",
  },
  {
    value: "helper",
    label: "พนักงานช่วยงาน",
    shortLabel: "ช่วยงาน",
    icon: Users,
    activeClass: "text-purple-700",
    badgeActiveClass: "bg-purple-600 text-white",
  },
  {
    value: "history",
    label: "ประวัติการดำเนินการ",
    shortLabel: "ประวัติ",
    icon: Clock,
    activeClass: "text-emerald-700",
    badgeActiveClass: "bg-emerald-600 text-white",
  },
];

function getTabCount(
  tab: TabType,
  counts: {
    totalPending: number;
    myLinePending: number;
    budgetPending: number;
    helperPending: number;
    historyCount: number;
  },
): number {
  switch (tab) {
    case "all":
      return counts.totalPending;
    case "my_line":
      return counts.myLinePending;
    case "budget":
      return counts.budgetPending;
    case "helper":
      return counts.helperPending;
    case "history":
      return counts.historyCount;
    default:
      return 0;
  }
}

// ────────────────────────────────────────────────────────
// Subcomponent: Plan Approval Card (Redesigned)
// ────────────────────────────────────────────────────────
function PlanCard({
  plan,
  currentUserEmployeeId,
  isAdmin,
  onAction,
}: {
  plan: ActivityPlanWithRelations;
  currentUserEmployeeId?: string | null;
  isAdmin?: boolean;
  onAction: (type: ApprovalActionType) => void;
}) {
  const start = new Date(plan.startDate);
  const end = new Date(plan.endDate);

  const salesPromo = plan.salesPromotionBudgetRequested
    ? Number(plan.salesPromotionBudgetRequested)
    : 0;
  const marketing = plan.marketingBudgetRequested
    ? Number(plan.marketingBudgetRequested)
    : 0;
  const budgetTotal = salesPromo + marketing;

  const isDirectApprover =
    plan.status === "PENDING_LINE_APPROVAL" &&
    plan.currentApproverEmployeeId === currentUserEmployeeId;

  const isPending =
    plan.status === "PENDING_LINE_APPROVAL" ||
    plan.status === "PENDING_BUDGET_APPROVAL" ||
    plan.status === "PENDING_HELPER_APPROVAL";

  // Work Types from Normalized Relation (no regex, no heuristic, no fallback TYPE_1)
  const workTypeBadges: Array<{ code: string; name: string }> = [];
  if (plan.workTypes && plan.workTypes.length > 0) {
    for (const wt of plan.workTypes) {
      if (wt.activityType) {
        workTypeBadges.push({
          code: wt.activityType.code,
          name: wt.activityType.name || getWorkTypeName(wt.activityType.code),
        });
      }
    }
  } else if (plan.activityType) {
    workTypeBadges.push({
      code: plan.activityType.code,
      name: plan.activityType.name || getWorkTypeName(plan.activityType.code),
    });
  }

  // Related Stores count
  const storesCount = (plan.stores?.length || 0) + (plan.tour?.store ? 1 : 0);
  // Related Products count
  const productsCount = plan.products?.length || 0;

  return (
    <div
      className={cn(
        "bg-white border rounded-2xl p-3.5 md:p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3",
        isDirectApprover
          ? "border-amber-300 bg-amber-50/20"
          : isAdmin && isPending
            ? "border-indigo-200 bg-indigo-50/10"
            : "border-slate-200/80",
      )}
    >
      {/* ── Top: Code + Badges + Status ── */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              {plan.code || plan.id.slice(0, 8)}
            </span>
            {isDirectApprover ? (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded-md border border-amber-200">
                ⚡ คิวของคุณ
              </span>
            ) : isAdmin && isPending ? (
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-200">
                👑 Admin
              </span>
            ) : null}
          </div>
          <ActivityStatusBadge status={plan.status} className="shrink-0" />
        </div>

        {/* ── Title ── */}
        <Link href={`/activity-plans/approvals/${plan.id}`}>
          <h4
            className="font-bold text-slate-900 line-clamp-2 text-[15px] leading-snug hover:text-blue-600 cursor-pointer transition-colors"
            title={plan.title}
          >
            {plan.title}
          </h4>
        </Link>

        {/* ── Work Type Tags ── */}
        {workTypeBadges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {workTypeBadges.map((wt, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0 rounded-md border",
                  wt.code === "TYPE_12" || wt.name === "ทัวร์"
                    ? "bg-sky-50 text-sky-800 border-sky-200"
                    : "bg-indigo-50/70 text-indigo-700 border-indigo-200",
                )}
              >
                {wt.name}
              </Badge>
            ))}
          </div>
        )}

        {/* ── Metadata: Icon-based compact layout ── */}
        <div className="text-xs text-slate-600 space-y-1.5">
          <div className="flex items-center gap-1.5" title={plan.employee.name}>
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-800 truncate">
              {plan.employee.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-700">
              {format(start, "dd MMM yy", { locale: th })}
              {plan.durationDays > 1 &&
                ` – ${format(end, "dd MMM yy", { locale: th })}`}
            </span>
          </div>
          {(plan.location || plan.province) && (
            <div
              className="flex items-center gap-1.5"
              title={plan.location || undefined}
            >
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-700 truncate">
                {plan.location || plan.province}
                {plan.location && plan.province ? ` (${plan.province})` : ""}
              </span>
            </div>
          )}
        </div>

        {/* ── Summary Row: Stores · Products · Budget ── */}
        {(storesCount > 0 || productsCount > 0 || budgetTotal > 0 || (plan.helpers && plan.helpers.length > 0)) && (
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 pt-2 border-t border-slate-100 text-[11px]">
            {storesCount > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
                <StoreIcon className="w-3 h-3 text-amber-600" />
                {storesCount} ร้าน
              </span>
            )}
            {productsCount > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-teal-800">
                <Package className="w-3 h-3 text-teal-600" />
                {productsCount} สินค้า
              </span>
            )}
            {plan.helpers && plan.helpers.length > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-purple-800">
                <Users className="w-3 h-3 text-purple-600" />
                {plan.helpers.length} คนช่วย
              </span>
            )}
            {budgetTotal > 0 && (
              <span className="inline-flex items-center gap-1 font-bold text-blue-700 ml-auto">
                💰 {budgetTotal.toLocaleString()} ฿
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
        <Link href={`/activity-plans/approvals/${plan.id}`} className="w-full">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs font-semibold text-blue-700 bg-blue-50/60 border-blue-200 hover:bg-blue-100 flex items-center justify-center gap-1.5 rounded-xl h-9 cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            ดูรายละเอียด
          </Button>
        </Link>

        {isPending && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction("REJECT")}
              className="flex-1 text-[11px] text-red-600 border-red-200 hover:bg-red-50 rounded-xl h-10 font-semibold cursor-pointer"
              title="ปฏิเสธแผนงาน"
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              ปฏิเสธ
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction("REQUEST_CORRECTION")}
              className="flex-1 text-[11px] text-amber-700 border-amber-300 hover:bg-amber-50 rounded-xl h-10 font-semibold cursor-pointer"
              title="ส่งกลับให้แก้ไข"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              ตีกลับ
            </Button>

            <Button
              size="sm"
              onClick={() => onAction("APPROVE")}
              className="flex-[1.3] text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1 rounded-xl h-10 cursor-pointer"
              title="อนุมัติแผนงาน"
            >
              <CheckCircle2 className="h-4 w-4" />
              อนุมัติ
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
