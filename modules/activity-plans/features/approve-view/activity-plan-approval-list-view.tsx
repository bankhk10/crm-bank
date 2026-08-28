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
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/custom/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  const [pendingPlans, setPendingPlans] = useState<ActivityPlanWithRelations[]>([]);
  const [historyPlans, setHistoryPlans] = useState<ActivityPlanWithRelations[]>([]);
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
        setPendingPlans((res.pendingPlans as ActivityPlanWithRelations[]) || []);
        setHistoryPlans((res.historyPlans as ActivityPlanWithRelations[]) || []);
        setActivityTypes(res.activityTypes || []);
        if (res.counts) {
          setCounts(res.counts);
          // If no items in my_line, switch active tab to 'all' if has other pending
          setActiveTab((prev) =>
            res.counts && res.counts.myLinePending === 0 && res.counts.totalPending > 0 && prev === "my_line"
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
        <AlertDescription>คุณไม่มีสิทธิ์เข้าถึงหน้าอนุมัติ Trip Plan</AlertDescription>
      </Alert>
    );
  }

  return (
    <section className="space-y-6 p-4 md:p-6 pb-24 md:pb-8 max-w-7xl mx-auto">
      {/* 1. TOP PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/activity-plans">
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl h-10 w-10 border-slate-200 text-slate-600 hover:text-slate-900"
              title="กลับหน้ารายการแผนงาน"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <PageHeader
                title="อนุมัติแผนงาน (Trip Plan Approval)"
                description="ตรวจสอบรายละเอียดแผนงานก่อนดำเนินการอนุมัติ"
              />
              {counts.totalPending > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  รออนุมัติ {counts.totalPending} รายการ
                </span>
              )}
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                  สิทธิ์ Administrator: สามารถอนุมัติ, ส่งกลับแก้ไข หรือปฏิเสธได้ทุกแผนงาน
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={loadQueueData}
            disabled={loading}
            className="text-xs font-semibold gap-1.5 rounded-xl h-9"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            รีเฟรชคิวงาน
          </Button>
          <Link href="/activity-plans">
            <Button variant="outline" size="sm" className="text-xs rounded-xl h-9">
              หน้ารายการแผนงาน
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 2. KPI STATS SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: My Line Queue */}
        <Card
          onClick={() => setActiveTab("my_line")}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md border rounded-2xl",
            activeTab === "my_line"
              ? "ring-2 ring-amber-500 bg-amber-50/50 border-amber-200"
              : counts.myLinePending > 0
              ? "bg-amber-50/20 border-amber-200/80"
              : "bg-white border-slate-200/80",
          )}
        >
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 truncate">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                คิวสายงานคุณ
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-950">
                {counts.myLinePending}
                <span className="text-xs font-medium text-slate-500 ml-1">รายการ</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-amber-700 font-medium truncate">
                {counts.myLinePending > 0 ? "⚡ รอคุณตัดสินใจ" : "ไม่มีคิวค้าง"}
              </p>
            </div>
            {counts.myLinePending > 0 && (
              <span className="flex h-2.5 w-2.5 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            )}
          </CardContent>
        </Card>

        {/* Card 2: All Pending */}
        <Card
          onClick={() => setActiveTab("all")}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md border rounded-2xl",
            activeTab === "all"
              ? "ring-2 ring-slate-800 bg-slate-50 border-slate-300"
              : "bg-white border-slate-200/80",
          )}
        >
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 truncate">
                <FileCheck className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                รออนุมัติทั้งหมด
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {counts.totalPending}
                <span className="text-xs font-medium text-slate-500 ml-1">รายการ</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
                ทุกสายงานรวมกัน
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Budget Approvals */}
        <Card
          onClick={() => setActiveTab("budget")}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md border rounded-2xl",
            activeTab === "budget"
              ? "ring-2 ring-blue-500 bg-blue-50/50 border-blue-200"
              : "bg-white border-slate-200/80",
          )}
        >
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5 truncate">
                <DollarSign className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                คิวงบประมาณ
              </span>
              <div className="text-xl sm:text-2xl font-black text-blue-950">
                {counts.budgetPending}
                <span className="text-xs font-medium text-slate-500 ml-1">รายการ</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-blue-700 font-medium truncate" title={`ขอใช้รวม ${counts.totalBudgetRequested.toLocaleString()} ฿`}>
                รวม {counts.totalBudgetRequested.toLocaleString()} ฿
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Helper Approvals */}
        <Card
          onClick={() => setActiveTab("helper")}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md border rounded-2xl",
            activeTab === "helper"
              ? "ring-2 ring-purple-500 bg-purple-50/50 border-purple-200"
              : "bg-white border-slate-200/80",
          )}
        >
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5 truncate">
                <Users className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                คิวคนช่วยงาน
              </span>
              <div className="text-xl sm:text-2xl font-black text-purple-950">
                {counts.helperPending}
                <span className="text-xs font-medium text-slate-500 ml-1">รายการ</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-purple-700 font-medium truncate">
                พิจารณาตามแผนก
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: History / Processed */}
        <Card
          onClick={() => setActiveTab("history")}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md border rounded-2xl col-span-2 sm:col-span-1",
            activeTab === "history"
              ? "ring-2 ring-emerald-500 bg-emerald-50/50 border-emerald-200"
              : "bg-white border-slate-200/80",
          )}
        >
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 truncate">
                <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                ประวัติดำเนินการ
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-950">
                {counts.historyCount}
                <span className="text-xs font-medium text-slate-500 ml-1">รายการ</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-700 font-medium truncate">
                อนุมัติ/ตีกลับ/ปฏิเสธ
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. MAIN TABS & VIEW MODE TOGGLE */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("my_line")}
            className={cn(
              "px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === "my_line"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            คิวสายงานของฉัน
            <Badge
              variant="secondary"
              className={cn(
                "ml-1 text-[10px] px-1.5 py-0 rounded-full",
                activeTab === "my_line"
                  ? "bg-amber-700 text-white"
                  : "bg-slate-200 text-slate-700",
              )}
            >
              {counts.myLinePending}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            คิวงานทั้งหมดที่รออนุมัติ
            <Badge
              variant="secondary"
              className={cn(
                "ml-1 text-[10px] px-1.5 py-0 rounded-full",
                activeTab === "all"
                  ? "bg-slate-700 text-white"
                  : "bg-slate-200 text-slate-700",
              )}
            >
              {counts.totalPending}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab("budget")}
            className={cn(
              "px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === "budget"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            <DollarSign className="h-3.5 w-3.5" />
            งบประมาณ
            <Badge
              variant="secondary"
              className={cn(
                "ml-1 text-[10px] px-1.5 py-0 rounded-full",
                activeTab === "budget"
                  ? "bg-blue-700 text-white"
                  : "bg-slate-200 text-slate-700",
              )}
            >
              {counts.budgetPending}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab("helper")}
            className={cn(
              "px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === "helper"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            <Users className="h-3.5 w-3.5" />
            พนักงานช่วยงาน
            <Badge
              variant="secondary"
              className={cn(
                "ml-1 text-[10px] px-1.5 py-0 rounded-full",
                activeTab === "helper"
                  ? "bg-purple-700 text-white"
                  : "bg-slate-200 text-slate-700",
              )}
            >
              {counts.helperPending}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === "history"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            ประวัติการดำเนินการ
            <Badge
              variant="secondary"
              className={cn(
                "ml-1 text-[10px] px-1.5 py-0 rounded-full",
                activeTab === "history"
                  ? "bg-emerald-700 text-white"
                  : "bg-slate-200 text-slate-700",
              )}
            >
              {counts.historyCount}
            </Badge>
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 rounded-lg text-xs transition-colors cursor-pointer",
              viewMode === "grid"
                ? "bg-white shadow-sm text-slate-900 font-semibold"
                : "text-slate-500 hover:text-slate-800",
            )}
            title="มุมมองการ์ด (Grid)"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "p-1.5 rounded-lg text-xs transition-colors cursor-pointer",
              viewMode === "table"
                ? "bg-white shadow-sm text-slate-900 font-semibold"
                : "text-slate-500 hover:text-slate-800",
            )}
            title="มุมมองตาราง (Table)"
          >
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 4. SEARCH & FILTER TOOLBAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="ค้นหาเลขที่แผน, ชื่อกิจกรรม, ผู้จัดทำ, ร้านค้า หรือสถานที่..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-xs h-10 bg-white rounded-xl border-slate-200"
          />
        </div>

        <div>
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
      </div>

      {/* 5. CONTENT SECTION (CARD VS TABLE) */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 font-medium space-y-2">
          <RefreshCw className="h-7 w-7 animate-spin mx-auto text-blue-600" />
          <p className="text-sm">กำลังค้นหาและประมวลผลคิวงานอนุมัติ...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-slate-100 text-slate-400">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {activeTab === "my_line"
              ? "ไม่มี Trip Plan ที่รอการอนุมัติตามสายงานของคุณในขณะนี้"
              : activeTab === "budget"
              ? "ไม่มี Trip Plan ที่รออนุมัติงบประมาณ"
              : activeTab === "helper"
              ? "ไม่มี Trip Plan ที่รออนุมัติพนักงานช่วยงาน"
              : "ไม่พบรายการแผนงานตามเงื่อนไขที่ค้นหา"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            รายการคำขออนุมัติจะปรากฏที่นี่โดยอัตโนมัติเมื่อพนักงานยื่นส่งแผนงาน
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid / Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      ) : (
        /* Table View */
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
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
                  const storeCount = (plan.stores?.length || 0) + (plan.tour?.store ? 1 : 0);

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
                      <td className="p-3.5 font-semibold text-slate-900 max-w-[180px] truncate" title={plan.title}>
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
                        {format(new Date(plan.startDate), "dd MMM yy", { locale: th })}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800 whitespace-nowrap">
                        {total > 0 ? `${total.toLocaleString()} ฿` : "-"}
                      </td>
                      <td className="p-3.5">
                        <ActivityStatusBadge status={plan.status} />
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/activity-plans/approvals/${plan.id}`}>
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
                                onClick={() => handleOpenActionDialog(plan, "REQUEST_CORRECTION")}
                                className="h-8 px-2 text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                                title="ส่งกลับแก้ไข"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenActionDialog(plan, "REJECT")}
                                className="h-8 px-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                title="ปฏิเสธ"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleOpenActionDialog(plan, "APPROVE")}
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
// Subcomponent: Plan Approval Card (Grid View)
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
        "bg-white border rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4",
        isDirectApprover
          ? "border-amber-300 ring-1 ring-amber-400/30 bg-gradient-to-b from-amber-50/20 to-white"
          : isAdmin && isPending
          ? "border-indigo-200 ring-1 ring-indigo-300/20 bg-gradient-to-b from-indigo-50/15 to-white"
          : "border-slate-200/80",
      )}
    >
      <div className="space-y-3">
        {/* Top bar: Code & Status Badge */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
              {plan.code || plan.id.slice(0, 8)}
            </span>
            {isDirectApprover ? (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                ⚡ คิวของคุณ
              </span>
            ) : isAdmin && isPending ? (
              <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                👑 สิทธิ์ Admin
              </span>
            ) : null}
          </div>
          <ActivityStatusBadge status={plan.status} />
        </div>

        {/* Title */}
        <div>
          <Link href={`/activity-plans/approvals/${plan.id}`}>
            <h4
              className="font-bold text-slate-900 line-clamp-2 text-sm sm:text-base leading-snug hover:text-blue-600 cursor-pointer transition-colors"
              title={plan.title}
            >
              {plan.title}
            </h4>
          </Link>

          {/* Work Type Badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {workTypeBadges.length > 0 ? (
              workTypeBadges.map((wt, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-md border shadow-2xs",
                    wt.code === "TYPE_12" || wt.name === "ทัวร์"
                      ? "bg-sky-50 text-sky-800 border-sky-200"
                      : "bg-indigo-50 text-indigo-800 border-indigo-200",
                  )}
                >
                  {wt.name}
                </Badge>
              ))
            ) : (
              <span className="text-[11px] text-slate-400">ไม่ระบุประเภท</span>
            )}
          </div>
        </div>

        {/* Structured Details Box */}
        <div className="text-xs text-slate-600 space-y-2 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 flex items-center gap-1 shrink-0">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              ผู้จัดทำ:
            </span>
            <span className="font-semibold text-slate-800 truncate" title={plan.employee.name}>
              {plan.employee.name}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              ช่วงเวลา:
            </span>
            <span className="text-slate-700 font-medium">
              {format(start, "dd MMM yy", { locale: th })}
              {plan.durationDays > 1 && ` — ${format(end, "dd MMM yy", { locale: th })}`}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 flex items-center gap-1 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              สถานที่:
            </span>
            <span className="text-slate-700 truncate" title={plan.location || undefined}>
              {plan.location || "-"} {plan.province ? `(${plan.province})` : ""}
            </span>
          </div>

          {/* Stores and Products Summary */}
          {(storesCount > 0 || productsCount > 0) && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
              {storesCount > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                  <StoreIcon className="w-3 h-3 text-amber-600" />
                  {storesCount} ร้านค้า
                </span>
              )}
              {productsCount > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                  <Package className="w-3 h-3 text-teal-600" />
                  {productsCount} สินค้า
                </span>
              )}
            </div>
          )}

          {/* Budget */}
          {budgetTotal > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-blue-800 font-bold">
              <span className="text-slate-500 font-normal">งบขอใช้รวม:</span>
              <span>{budgetTotal.toLocaleString()} ฿</span>
            </div>
          )}

          {/* Helpers */}
          {plan.helpers && plan.helpers.length > 0 && (
            <div className="flex items-center justify-between text-purple-800 text-[11px] pt-0.5">
              <span className="text-slate-500">พนักงานช่วยงาน:</span>
              <span className="font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                {plan.helpers.length} คน
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
        {/* Prominent Full Page Detail Link */}
        <Link href={`/activity-plans/approvals/${plan.id}`} className="w-full">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs font-bold text-blue-700 bg-blue-50/70 border-blue-200 hover:bg-blue-100 flex items-center justify-center gap-1.5 rounded-xl h-9 shadow-2xs cursor-pointer"
          >
            <Eye className="h-4 w-4 text-blue-600" />
            ดูรายละเอียดแผนงานสำหรับการอนุมัติ
          </Button>
        </Link>

        {/* Approver Action Row (if pending) */}
        {isPending && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction("REJECT")}
              className="flex-1 text-[11px] text-red-600 border-red-200 hover:bg-red-50 rounded-xl h-8.5 font-semibold cursor-pointer"
              title="ปฏิเสธแผนงาน"
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              ปฏิเสธ
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction("REQUEST_CORRECTION")}
              className="flex-1 text-[11px] text-amber-700 border-amber-300 hover:bg-amber-50 rounded-xl h-8.5 font-semibold cursor-pointer"
              title="ส่งกลับให้แก้ไข"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              ตีกลับ
            </Button>

            <Button
              size="sm"
              onClick={() => onAction("APPROVE")}
              className="flex-[1.5] text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1 shadow-2xs rounded-xl h-8.5 cursor-pointer"
              title="อนุมัติแผนงาน"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              อนุมัติ
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
