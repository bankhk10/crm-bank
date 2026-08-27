"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Filter,
  DollarSign,
  Users,
  Clock,
  Layers,
  ArrowLeft,
  LayoutGrid,
  List as ListIcon,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/custom/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityStatusBadge } from "../../ui/activity-status-badge";
import type { ActivityPlanWithRelations } from "../../types";
import { getApprovalQueueDataAction } from "../../server/actions";
import {
  ApprovalActionDialog,
  type ApprovalActionType,
} from "./components/approval-action-dialog";
import { ApprovalDetailDrawer } from "./components/approval-detail-drawer";
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

  // Dialog & Drawer states
  const [selectedPlanForDetail, setSelectedPlanForDetail] =
    useState<ActivityPlanWithRelations | null>(null);
  const [actionPlan, setActionPlan] =
    useState<ActivityPlanWithRelations | null>(null);
  const [actionType, setActionType] = useState<ApprovalActionType>("APPROVE");
  const [actionDialogOpen, setActionDialogOpen] = useState(false);

  const userEmployeeId = session?.user?.employeeId;

  // Load all queue data
  const loadQueueData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getApprovalQueueDataAction();
      if (res.success) {
        setPendingPlans(res.pendingPlans as ActivityPlanWithRelations[]);
        setHistoryPlans(res.historyPlans as ActivityPlanWithRelations[]);
        setActivityTypes(res.activityTypes || []);
        if (res.counts) {
          setCounts(res.counts);
          // If no items in my_line, switch active tab to 'all' if has other pending
          if (res.counts.myLinePending === 0 && res.counts.totalPending > 0 && activeTab === "my_line") {
            setActiveTab("all");
          }
        }
      } else {
        setError(res.error || "เกิดข้อผิดพลาดในการโหลดคิวงานอนุมัติ");
      }
    } catch (err: any) {
      setError(err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueueData();
  }, []);

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
          p.employee.name.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          (p.province && p.province.toLowerCase().includes(q)),
      );
    }

    // Apply Activity Type Filter
    if (typeFilter !== "ALL") {
      source = source.filter((p) => {
        if (typeof p.activityType === "object") {
          return (
            p.activityType?.code === typeFilter ||
            p.activityType?.id === typeFilter
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
    return <div className="p-6 text-center text-slate-500 font-medium">กำลังตรวจสอบสิทธิ์...</div>;
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/activity-plans">
            <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <PageHeader
              title="ศูนย์อนุมัติแผนงานกิจกรรม (Trip Plan Approval Hub)"
              description="ศูนย์รวมคิวงานสำหรับตรวจสอบ Trip Plan, อนุมัติตามสายงาน, งบประมาณ และพนักงานช่วยงาน"
            />
            {isAdmin && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                  สิทธิ์ Administrator: สามารถอนุมัติ, ส่งกลับแก้ไข หรือปฏิเสธได้ทุกแผนงานและทุกขั้นตอน
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
            className="text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            รีเฟรชคิวงาน
          </Button>
          <Link href="/activity-plans">
            <Button variant="outline" size="sm" className="text-xs">
              หน้ารายการแผนงาน
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* KPI Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: My Line Queue */}
        <Card
          onClick={() => setActiveTab("my_line")}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md border",
            activeTab === "my_line"
              ? "ring-2 ring-amber-500 bg-amber-50/40 border-amber-200"
              : counts.myLinePending > 0
              ? "bg-amber-50/20 border-amber-200"
              : "bg-white border-slate-100",
          )}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                คิวสายงานของคุณ
              </span>
              <div className="text-2xl font-black text-amber-900">
                {counts.myLinePending}
                <span className="text-xs font-medium text-slate-500 ml-1">รายการ</span>
              </div>
              <p className="text-[11px] text-amber-700 font-medium">
                {counts.myLinePending > 0 ? "⚡ รอคุณตัดสินใจ" : "ไม่มีคิวค้าง"}
              </p>
            </div>
            {counts.myLinePending > 0 && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Budget Approvals */}
        <Card
          onClick={() => setActiveTab("budget")}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md border",
            activeTab === "budget"
              ? "ring-2 ring-blue-500 bg-blue-50/40 border-blue-200"
              : "bg-white border-slate-100",
          )}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-blue-600" />
                คิวพิจารณางบประมาณ
              </span>
              <div className="text-2xl font-black text-blue-900">
                {counts.budgetPending}
                <span className="text-xs font-medium text-slate-500 ml-1">รายการ</span>
              </div>
              <p className="text-[11px] text-blue-700 font-medium truncate">
                งบขอใช้รวม {counts.totalBudgetRequested.toLocaleString()} บาท
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Helper Approvals */}
        <Card
          onClick={() => setActiveTab("helper")}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md border",
            activeTab === "helper"
              ? "ring-2 ring-purple-500 bg-purple-50/40 border-purple-200"
              : "bg-white border-slate-100",
          )}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-purple-600" />
                คิวอนุมัติคนช่วยงาน
              </span>
              <div className="text-2xl font-black text-purple-900">
                {counts.helperPending}
                <span className="text-xs font-medium text-slate-500 ml-1">รายการ</span>
              </div>
              <p className="text-[11px] text-purple-700 font-medium">
                พิจารณาตามสังกัดแผนก
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: History / Processed */}
        <Card
          onClick={() => setActiveTab("history")}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md border",
            activeTab === "history"
              ? "ring-2 ring-emerald-500 bg-emerald-50/40 border-emerald-200"
              : "bg-white border-slate-100",
          )}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-emerald-600" />
                ประวัติการดำเนินการ
              </span>
              <div className="text-2xl font-black text-emerald-900">
                {counts.historyCount}
                <span className="text-xs font-medium text-slate-500 ml-1">รายการล่าสุด</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium">
                อนุมัติ / ตีกลับ / ปฏิเสธ
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("my_line")}
            className={cn(
              "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5",
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
                "ml-1 text-[10px] px-1.5 py-0",
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
              "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5",
              activeTab === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            คิวงานทั้งหมดที่รออนุมัติ
            <Badge
              variant="secondary"
              className={cn(
                "ml-1 text-[10px] px-1.5 py-0",
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
              "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5",
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
                "ml-1 text-[10px] px-1.5 py-0",
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
              "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5",
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
                "ml-1 text-[10px] px-1.5 py-0",
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
              "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5",
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
                "ml-1 text-[10px] px-1.5 py-0",
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
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 rounded text-xs transition-colors",
              viewMode === "grid"
                ? "bg-white shadow-sm text-slate-900 font-semibold"
                : "text-slate-500 hover:text-slate-800",
            )}
            title="มุมมองการ์ด"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "p-1.5 rounded text-xs transition-colors",
              viewMode === "table"
                ? "bg-white shadow-sm text-slate-900 font-semibold"
                : "text-slate-500 hover:text-slate-800",
            )}
            title="มุมมองตาราง"
          >
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="ค้นหาเลขที่แผน, ชื่อกิจกรรม, ผู้จัดทำ, หรือสถานที่..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-10 bg-white"
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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

      {/* Content Section */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 font-medium space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600" />
          <div>กำลังค้นหาและประมวลผลคิวงานอนุมัติ...</div>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-slate-100 text-slate-400">
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
            รายการคำขออนุมัติใหม่จะปรากฏที่นี่โดยอัตโนมัติเมื่อพนักงานยื่นส่งแผนงาน
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
              onInspect={() => setSelectedPlanForDetail(plan)}
              onAction={(type) => handleOpenActionDialog(plan, type)}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b">
                <tr>
                  <th className="p-3.5">เลขที่แผน</th>
                  <th className="p-3.5">ชื่อกิจกรรม</th>
                  <th className="p-3.5">ผู้จัดทำ</th>
                  <th className="p-3.5">ช่วงเวลาจัดงาน</th>
                  <th className="p-3.5">งบประมาณ</th>
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

                  return (
                    <tr
                      key={plan.id}
                      className={cn(
                        "hover:bg-slate-50/80 transition-colors",
                        isMyLine && "bg-amber-50/30",
                      )}
                    >
                      <td className="p-3.5 font-mono font-semibold text-blue-600">
                        {plan.code || plan.id.slice(0, 8)}
                      </td>
                      <td className="p-3.5 font-medium text-slate-900 max-w-[200px] truncate" title={plan.title}>
                        {plan.title}
                      </td>
                      <td className="p-3.5 text-slate-700">
                        {plan.employee.name}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPlanForDetail(plan)}
                            className="h-8 px-2 text-blue-600 hover:bg-blue-50"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenActionDialog(plan, "REQUEST_CORRECTION")}
                            className="h-8 px-2 text-amber-600 hover:bg-amber-50"
                            title="ส่งกลับแก้ไข"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenActionDialog(plan, "REJECT")}
                            className="h-8 px-2 text-red-600 hover:bg-red-50"
                            title="ปฏิเสธ"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleOpenActionDialog(plan, "APPROVE")}
                            className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            อนุมัติ
                          </Button>
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

      {/* Plan Detail Drawer */}
      <ApprovalDetailDrawer
        open={!!selectedPlanForDetail}
        onOpenChange={(open) => {
          if (!open) setSelectedPlanForDetail(null);
        }}
        plan={selectedPlanForDetail}
        onTriggerAction={(plan, type) => {
          handleOpenActionDialog(plan, type);
        }}
      />
    </section>
  );
}

// ────────────────────────────────────────────────────────
// Subcomponent: Plan Approval Card
// ────────────────────────────────────────────────────────
function PlanCard({
  plan,
  currentUserEmployeeId,
  isAdmin,
  onInspect,
  onAction,
}: {
  plan: ActivityPlanWithRelations;
  currentUserEmployeeId?: string | null;
  isAdmin?: boolean;
  onInspect: () => void;
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

  const isMyLine = isDirectApprover || (isAdmin && isPending);

  const typeDisplay =
    typeof plan.activityType === "object"
      ? plan.activityType?.name || plan.activityType?.code
      : plan.activityType || "กิจกรรม";

  return (
    <div
      className={cn(
        "bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4",
        isDirectApprover
          ? "border-amber-300 ring-1 ring-amber-400/40 bg-gradient-to-b from-amber-50/20 to-white"
          : isAdmin && isPending
            ? "border-indigo-200 ring-1 ring-indigo-300/30 bg-gradient-to-b from-indigo-50/15 to-white"
            : "border-slate-100",
      )}
    >
      <div className="space-y-3">
        {/* Top bar: Code & Status */}
        <div className="flex justify-between items-start gap-2">
          <div>
            <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {plan.code || plan.id.slice(0, 8)}
            </span>
            {isDirectApprover ? (
              <span className="ml-1.5 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                ⚡ คิวของคุณ
              </span>
            ) : isAdmin && isPending ? (
              <span className="ml-1.5 text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                👑 สิทธิ์ Admin
              </span>
            ) : null}
          </div>
          <ActivityStatusBadge status={plan.status} />
        </div>

        {/* Title */}
        <div>
          <h4
            className="font-bold text-slate-900 line-clamp-2 text-sm leading-snug hover:text-blue-600 cursor-pointer"
            onClick={onInspect}
            title={plan.title}
          >
            {plan.title}
          </h4>
          <span className="inline-block text-[11px] text-slate-500 mt-0.5 font-medium">
            {typeDisplay}
          </span>
        </div>

        {/* Details list */}
        <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">ผู้จัดทำ:</span>
            <span className="font-semibold text-slate-800 truncate max-w-[170px]">
              {plan.employee.name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">ช่วงเวลา:</span>
            <span className="text-slate-700">
              {format(start, "dd MMM yy", { locale: th })} - {format(end, "dd MMM yy", { locale: th })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">สถานที่:</span>
            <span className="text-slate-700 truncate max-w-[170px]" title={plan.location}>
              {plan.location} {plan.province ? `(${plan.province})` : ""}
            </span>
          </div>

          {budgetTotal > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-blue-700 font-bold">
              <span>งบขอใช้:</span>
              <span>{budgetTotal.toLocaleString()} บาท</span>
            </div>
          )}

          {plan.helpers && plan.helpers.length > 0 && (
            <div className="flex items-center justify-between pt-0.5 text-purple-700 text-[11px]">
              <span>พนักงานช่วยงาน:</span>
              <span className="font-semibold">{plan.helpers.length} คน</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onInspect}
            className="w-full text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1"
          >
            <Eye className="h-3.5 w-3.5 text-slate-500" />
            ดูรายละเอียด
          </Button>

          {isPending && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction("REQUEST_CORRECTION")}
              className="text-xs text-amber-600 border-amber-200 hover:bg-amber-50 px-2.5"
              title="ส่งกลับแก้ไข"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}

          {isPending && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction("REJECT")}
              className="text-xs text-red-600 border-red-200 hover:bg-red-50 px-2.5"
              title="ปฏิเสธ"
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {isPending && (
          <Button
            size="sm"
            onClick={() => onAction("APPROVE")}
            className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            อนุมัติแผนงาน
          </Button>
        )}
      </div>
    </div>
  );
}
