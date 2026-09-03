"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePermission } from "@/hooks/use-permission";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Users,
  History,
  Clock,
  Target,
  Layers,
  Calendar,
  User,
  FileText,
  ShieldCheck,
  Info,
  MapPin,
  UserCheck,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ActivityStatusBadge, resolveCurrentOperator } from "@/modules/activity-plans/ui/activity-status-badge";
import type { ActivityPlanWithRelations } from "../../types";
import {
  getActivityPlanAction,
  reviewSingleActivityHelperAction,
} from "../../server/actions";
import { getWorkTypeCode } from "../../constants";
import { DetailViewActions } from "../detail-view/components/detail-view-actions";
import {
  ApprovalActionDialog,
  type ApprovalActionType,
} from "./components/approval-action-dialog";
import {
  ApprovalType1Visit,
  ApprovalType2Followup,
  ApprovalType3Sales,
  ApprovalType4Collect,
  ApprovalType5Survey,
  ApprovalType6Issue,
  ApprovalType7Demo,
  ApprovalType8Meeting,
  ApprovalType9Store,
  ApprovalType10FieldDay,
  ApprovalType11Stock,
  ApprovalType12Tour,
} from "./components/work-types";
import {
  BudgetSection,
  PromotionalMaterialsSection,
  MarketingExpenseSection,
} from "../actual-view/components";
import { extractPlanData } from "../actual-view/utils";
import type { PlanSummaryData, ActualTargetsState } from "../actual-view/types";

interface ActivityPlanApprovalDetailViewProps {
  id: string;
  onBack?: () => void;
}

const initialTargets: ActualTargetsState = {
  t1: { customer: "", topic: "", detail: "", opportunity: "", nextDate: "" },
  t2: { product: "", customer: "", detail: "", expectedResult: "", items: [] },
  t3: { product: "", customer: "", targetQty: "", targetSales: "", items: [] },
  t4: { customer: "", orderNo: "", targetCollect: "", items: [] },
  t5: { store: "", product: "", detail: "", items: [] },
  t6: { customer: "", issueType: "", detail: "", targetStatus: "", items: [] },
  t7: {
    owner: "",
    product: "",
    crop: "",
    plots: "",
    demoProductQuantity: "",
    objective: "",
    experimentDetail: "",
    detail: "",
    targetCondition: "",
    items: [],
  },
  t8: { topic: "", products: "", targetAttendees: "" },
  t9: {
    store: "",
    isSubDealer: false,
    subDealerStore: "",
    product: "",
    targetSales: "",
    targetAttendees: "",
    items: [],
  },
  t10: {
    plot: "",
    location: "",
    showcase: "",
    targetAttendees: "",
    targetSales: "",
  },
  t11: { store: "", detail: "", targetOpportunity: "" },
};

const initialPlanSummary: PlanSummaryData = {
  planNo: "",
  title: "",
  startDateStr: "",
  endDateStr: "",
  startTimeStr: "",
  endTimeStr: "",
  timeStr: "",
  locationStr: "",
  location: undefined,
  province: undefined,
  district: undefined,
  marketingBudget: undefined,
  salesPromotionBudget: undefined,
  extraExpenseAmount: undefined,
  extraExpenseDetail: "",
  targetSales: undefined,
  isPromotionalMediaSelected: false,
  marketingProductItems: [],
  isSalesPromotionSelected: false,
  salesPromotionItems: [],
  requisitionItems: [],
  objective: undefined,
  notes: undefined,
  helpers: undefined,
  helperEmployeeNames: undefined,
};

export default function ActivityPlanApprovalDetailView({
  id,
  onBack,
}: ActivityPlanApprovalDetailViewProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { hasPermission } = usePermission("menu.activity_plans");

  const roles = (session?.user as any)?.roles ?? [];
  const isAdmin =
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo") ||
    (session?.user as any)?.role === "administrator" ||
    (session?.user as any)?.role === "ADMIN";

  const canManageOrApprove =
    isAdmin ||
    hasPermission("activity.approve") ||
    hasPermission("activity.manage");

  const userEmployeeId = session?.user?.employeeId;

  const [plan, setPlan] = useState<ActivityPlanWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [planSummary, setPlanSummary] =
    useState<PlanSummaryData>(initialPlanSummary);
  const [planWorkTypes, setPlanWorkTypes] = useState<string[]>([]);
  const [targets, setTargets] = useState<ActualTargetsState>(initialTargets);

  // Approval Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<ApprovalActionType>("APPROVE");

  // Helper review state
  const [reviewingHelperId, setReviewingHelperId] = useState<string | null>(null);
  const [rejectHelperDialogOpen, setRejectHelperDialogOpen] = useState(false);
  const [helperRejectReason, setHelperRejectReason] = useState("");
  const [isProcessingHelper, setIsProcessingHelper] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getActivityPlanAction(id);
      if (res.success && res.plan) {
        const p = res.plan as ActivityPlanWithRelations;
        setPlan(p);

        // Extract plan summary & work types targets
        const extracted = extractPlanData(p, initialTargets);
        setPlanSummary(extracted.planSummary);
        setPlanWorkTypes(extracted.resolvedWorkTypes);
        setTargets(extracted.targets);
      } else {
        setError(res.error || "ไม่สามารถดึงข้อมูลรายละเอียด Trip Plan ได้");
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดรายละเอียด Trip Plan");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/activity-plans/approvals");
    }
  };

  const handleOpenActionDialog = (type: ApprovalActionType) => {
    setActionType(type);
    setActionDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">
          กำลังโหลดข้อมูลแผนงานสำหรับการอนุมัติ...
        </p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "ไม่พบข้อมูล Trip Plan สำหรับการอนุมัติ"}
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={handleBack}>
          กลับหน้ารายการอนุมัติ
        </Button>
      </div>
    );
  }

  // Approval Eligibility Check
  const isPendingStatus =
    plan.status === "PENDING_LINE_APPROVAL" ||
    plan.status === "PENDING_BUDGET_APPROVAL" ||
    plan.status === "PENDING_HELPER_APPROVAL";

  const isDirectLineApprover =
    plan.status === "PENDING_LINE_APPROVAL" &&
    plan.currentApproverEmployeeId === userEmployeeId;

  const canPerformApproval =
    isPendingStatus && (isAdmin || canManageOrApprove || isDirectLineApprover);

  // Tour (TYPE_12) resolution from Normalized Relational Source of Truth
  const isTourPlan = Boolean(
    plan.tour ||
    plan.activityType?.code === "TYPE_12" ||
    plan.activityType?.name === "ทัวร์" ||
    plan.workTypes?.some(
      (wt) =>
        wt.activityType?.code === "TYPE_12" ||
        wt.activityType?.name === "ทัวร์",
    ) ||
    planWorkTypes.includes("ทัวร์"),
  );

  const tourData = plan.tour;
  const item0 = (plan.items?.[0] || {}) as Record<string, any>;
  const tourType =
    tourData?.tourType ??
    (item0.visitTopic === "ทัวร์ร้านค้า" ? "STORE" : "CENTRAL");
  const tourSize = tourData?.tourSize ?? item0.tourSize ?? null;
  const tourCountry =
    tourData?.country ?? item0.country ?? item0.detail ?? null;
  const tourStoreName =
    tourData?.store?.name ?? item0.customerName ?? item0.store ?? null;
  const tourDestination =
    tourData?.destination ??
    item0.destination ??
    item0.location ??
    item0.detail ??
    null;

  // 1. Resolve Work Types from Normalized Relation
  const resolvedWorkTypes =
    plan.workTypes && plan.workTypes.length > 0
      ? plan.workTypes.map((wt) => ({
          code: wt.activityType?.code || "TYPE_1",
          name:
            wt.activityType?.name ||
            wt.activityType?.shortName ||
            "เข้าพบร้านค้า / Key Farmer",
        }))
      : plan.activityType
        ? [{ code: plan.activityType.code, name: plan.activityType.name }]
        : planWorkTypes.map((t) => ({ code: getWorkTypeCode(t), name: t }));

  const isTypeActive = (code: string, name: string) => {
    return (
      resolvedWorkTypes.some((wt) => wt.code === code || wt.name === name) ||
      planWorkTypes.includes(name)
    );
  };

  // Helper function to format Buddhist Era (พ.ศ.)
  const formatThaiYear = (dateStr?: string) => {
    if (!dateStr) return "-";
    return dateStr.replace(/\b(19\d\d|20\d\d)\b/g, (match) =>
      String(parseInt(match, 10) + 543),
    );
  };

  // Date and Time Calculations
  const start = new Date(plan.startDate);
  const end = new Date(plan.endDate);
  const startDateDisplay = formatThaiYear(
    planSummary.startDateStr || format(start, "dd/MM/yyyy"),
  );
  const endDateDisplay = formatThaiYear(
    planSummary.endDateStr || format(end, "dd/MM/yyyy"),
  );

  const formatTimeStr = (tRaw?: string, dFallback?: Date) => {
    if (tRaw && tRaw.trim()) {
      const t = tRaw.trim();
      return t.endsWith("น.") || t.endsWith("น") ? t : `${t} น.`;
    }
    return dFallback ? `${format(dFallback, "HH:mm")} น.` : "08:00 น.";
  };

  const startTimeDisplay = formatTimeStr(planSummary.startTimeStr, start);
  const endTimeDisplay = formatTimeStr(planSummary.endTimeStr, end);

  const renderAuditActionBadge = (action: string) => {
    switch (action) {
      case "APPROVE":
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0.5 font-bold bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            อนุมัติ
          </Badge>
        );
      case "REJECT":
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0.5 font-bold bg-red-50 text-red-700 border-red-200"
          >
            ปฏิเสธ
          </Badge>
        );
      case "REQUEST_CORRECTION":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0.5 font-bold bg-amber-50 text-amber-700 border-amber-200"
          >
            ส่งกลับแก้ไข
          </Badge>
        );
      case "SUBMIT":
      case "SUBMITTED":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0.5 font-bold bg-blue-50 text-blue-700 border-blue-200"
          >
            ยื่นขออนุมัติ
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0.5 font-medium bg-slate-50 text-slate-700 border-slate-200"
          >
            {action}
          </Badge>
        );
    }
  };

  const planLocation = plan.location || planSummary.locationStr;
  const hasLocation =
    !!planLocation &&
    planLocation.trim() !== "" &&
    planLocation.trim() !== "-" &&
    planLocation.trim() !== "ไม่ระบุสถานที่";

  return (
    <section className="space-y-6 container mx-auto px-0 sm:px-0">
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-6 shadow-xs">
        {/* ─── 1. TOP HEADER (APPROVAL DETAIL BANNER) ─── */}
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-50/90 via-indigo-50/30 to-blue-50/40 border border-slate-200/80 shadow-2xs">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="font-bold text-lg sm:text-2xl text-slate-900 tracking-tight">
                รายละเอียดแผนงานสำหรับการอนุมัติ
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                ระบบตรวจสอบและพิจารณาอนุมัติแผนงานกิจกรรม (Activity Plan Approval)
              </p>
            </div>
          </div>

          {/* Right: Plan No + Status Badge */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {(plan.code || planSummary.planNo) && (
              <div className="inline-flex items-center gap-1.5 bg-white/90 border border-blue-200/80 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs backdrop-blur-xs">
                <Info className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                <span>เลขที่แผน: {plan.code || planSummary.planNo}</span>
              </div>
            )}
            <ActivityStatusBadge status={plan.status} />
          </div>
        </div>

        {/* ─── 2. GENERAL PLAN INFORMATION (Activity Plan Overview) ─── */}
        <div className="space-y-4">
          {(() => {
            const operator = resolveCurrentOperator(plan);
            if (!operator) return null;
            return (
              <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <UserCheck className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-700 font-semibold uppercase tracking-wider">
                      ผู้ดำเนินการปัจจุบัน
                    </p>
                    <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                      {operator.displayRole}
                      {operator.employeeName && (
                        <span className="text-xs sm:text-sm font-medium text-slate-600 ml-2">
                          ({operator.employeeName})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-1 shrink-0 self-start sm:self-auto border-t sm:border-t-0 border-blue-100 pt-2 sm:pt-0">
                  <span className="text-[11px] text-slate-500 font-medium">สถานะ</span>
                  <ActivityStatusBadge status={plan.status} />
                </div>
              </div>
            );
          })()}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Card 1: ชื่อแผนงาน / กิจกรรม */}
            <div className="bg-gradient-to-br from-blue-50/80 via-sky-50/30 to-white border border-blue-200/70 rounded-2xl p-4 sm:p-4.5 flex items-center gap-3.5 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/80 shadow-2xs">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-blue-700 font-semibold mb-0.5 tracking-wide">
                  ชื่อแผนงาน / กิจกรรม
                </p>
                <p
                  className="text-sm sm:text-base font-bold text-slate-900 truncate"
                  title={plan.title}
                >
                  {plan.title || "-"}
                </p>
              </div>
            </div>

            {/* Card 2: วันที่เริ่ม - สิ้นสุด */}
            <div className="bg-gradient-to-br from-emerald-50/80 via-teal-50/30 to-white border border-emerald-200/70 rounded-2xl p-4 sm:p-4.5 flex items-center gap-3.5 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/80 shadow-2xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-xs text-emerald-700 font-semibold tracking-wide">
                    วันที่เริ่ม - สิ้นสุด
                  </p>
                  <span className="bg-emerald-100/90 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200/80">
                    {plan.durationDays} วัน
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span>
                    {startDateDisplay} {startTimeDisplay}
                  </span>
                  <span className="text-slate-400 font-normal">—</span>
                  <span>
                    {endDateDisplay} {endTimeDisplay}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Card 3: ผู้จัดทำแผน */}
            <div className="bg-gradient-to-br from-violet-50/80 via-purple-50/30 to-white border border-violet-200/70 rounded-2xl p-4 sm:p-4.5 flex items-center gap-3.5 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-violet-100/80 text-violet-600 flex items-center justify-center shrink-0 border border-violet-200/80 shadow-2xs">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-violet-700 font-semibold mb-0.5 tracking-wide">
                  ผู้จัดทำแผน
                </p>
                <p className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {plan.employee?.name || "-"}
                </p>
                {(plan.employee?.positionTitle ||
                  plan.employee?.position?.name ||
                  plan.employee?.departmentName ||
                  plan.employee?.department?.name) && (
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    {plan.employee?.positionTitle ||
                      plan.employee?.position?.name ||
                      ""}
                    {plan.employee?.positionTitle &&
                      plan.employee?.departmentName &&
                      " • "}
                    {plan.employee?.departmentName ||
                      plan.employee?.department?.name ||
                      ""}
                  </p>
                )}
              </div>
            </div>

            {/* Card 4: ประเภทงานที่ระบุในแผน */}
            <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/25 to-white border border-amber-200/70 rounded-2xl p-4 sm:p-4.5 flex items-center gap-3.5 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/80 shadow-2xs">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-amber-800 font-semibold mb-1 tracking-wide">
                  ประเภทงานที่ระบุในแผน ({resolvedWorkTypes.length} ประเภท):
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {resolvedWorkTypes.map((wt, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className={cn(
                        "text-xs px-2.5 py-0.5 font-semibold rounded-lg border shadow-2xs",
                        wt.code === "TYPE_12"
                          ? "bg-sky-50 text-sky-800 border-sky-200"
                          : "bg-white text-slate-800 border-amber-200/90",
                      )}
                    >
                      {wt.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 5 & Notes: สถานที่จัดงาน และ หมายเหตุเพิ่มเติม */}
          {(hasLocation || plan.notes) && (
            <div
              className={cn(
                "grid gap-3.5",
                hasLocation && plan.notes
                  ? "grid-cols-1 md:grid-cols-2"
                  : "grid-cols-1",
              )}
            >
              {/* สถานที่จัดงาน */}
              {hasLocation && (
                <div className="bg-gradient-to-br from-rose-50/70 via-pink-50/25 to-white border border-rose-200/70 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs hover:shadow-xs transition-shadow">
                  <div className="w-11 h-11 rounded-xl bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200/80 shadow-2xs">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-rose-700 font-semibold mb-0.5 tracking-wide">
                      สถานที่จัดงาน / พื้นที่ปฏิบัติงาน
                    </p>
                    <p className="text-sm font-bold text-slate-900 break-words">
                      {planLocation}
                    </p>
                  </div>
                </div>
              )}

              {/* หมายเหตุเพิ่มเติม */}
              {plan.notes && (
                <div className="bg-gradient-to-br from-amber-50/60 via-slate-50/40 to-white border border-amber-200/70 rounded-2xl p-4 space-y-2 shadow-2xs">
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    หมายเหตุเพิ่มเติม:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-white/90 p-3 rounded-xl border border-amber-100/80 shadow-2xs">
                    {plan.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ─── BUDGETS & MARKETING MATERIALS SECTIONS (MATCHING ACTUAL VIEW) ─── */}
          <BudgetSection summary={planSummary} />
          <PromotionalMaterialsSection summary={planSummary} />
          <MarketingExpenseSection summary={planSummary} />
        </div>

        {/* ─── 3. รายละเอียดตามประเภทงาน (WORK TYPE SPECIFIC DETAILS) ─── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  รายละเอียดตามประเภทงาน (Work Type Details)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  เป้าหมายและข้อมูลกิจกรรมของแต่ละประเภทงานที่กำหนดไว้ในแผน
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-xs font-semibold bg-blue-50 text-blue-800 border-blue-200"
            >
              {resolvedWorkTypes.length} ประเภทงาน
            </Badge>
          </div>

          {/* TYPE_1: เข้าพบร้านค้า / Key Farmer */}
          <ApprovalType1Visit
            isVisible={isTypeActive("TYPE_1", "เข้าพบร้านค้า / Key Farmer")}
            target={targets.t1}
          />

          {/* TYPE_2: ติดตามผลการใช้สินค้า */}
          <ApprovalType2Followup
            isVisible={isTypeActive("TYPE_2", "ติดตามผลการใช้สินค้า")}
            target={targets.t2}
          />

          {/* TYPE_3: เสนอขายสินค้า */}
          <ApprovalType3Sales
            isVisible={isTypeActive("TYPE_3", "เสนอขายสินค้า")}
            target={targets.t3}
          />

          {/* TYPE_4: วางบิล / เก็บเงิน */}
          <ApprovalType4Collect
            isVisible={isTypeActive("TYPE_4", "วางบิล / เก็บเงิน")}
            target={targets.t4}
          />

          {/* TYPE_5: สำรวจตลาดของคู่แข่ง */}
          <ApprovalType5Survey
            isVisible={isTypeActive("TYPE_5", "สำรวจตลาดของคู่แข่ง")}
            target={targets.t5}
          />

          {/* TYPE_6: แก้ปัญหา / รับเรื่องร้องเรียน */}
          <ApprovalType6Issue
            isVisible={isTypeActive("TYPE_6", "แก้ปัญหา / รับเรื่องร้องเรียน")}
            target={targets.t6}
          />

          {/* TYPE_7: ทำ / ติดตามแปลงสาธิต */}
          <ApprovalType7Demo
            isVisible={isTypeActive("TYPE_7", "ทำ / ติดตามแปลงสาธิต")}
            target={targets.t7}
          />

          {/* TYPE_8: จัดประชุมการเกษตร */}
          <ApprovalType8Meeting
            isVisible={isTypeActive("TYPE_8", "จัดประชุมการเกษตร")}
            target={targets.t8}
          />

          {/* TYPE_9: จัดกิจกรรมส่งเสริมการขายหน้าร้าน */}
          <ApprovalType9Store
            isVisible={isTypeActive(
              "TYPE_9",
              "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
            )}
            target={targets.t9}
          />

          {/* TYPE_10: จัดงาน Field Day */}
          <ApprovalType10FieldDay
            isVisible={isTypeActive("TYPE_10", "จัดงาน Field Day")}
            target={targets.t10}
          />

          {/* TYPE_11: ตรวจเช็กสต็อกหน้าร้าน */}
          <ApprovalType11Stock
            isVisible={isTypeActive("TYPE_11", "ตรวจเช็กสต็อกหน้าร้าน")}
            target={targets.t11}
          />

          {/* TYPE_12: TOUR SECTION (IF APPLICABLE) */}
          <ApprovalType12Tour
            isVisible={isTourPlan}
            tourType={tourType}
            tourSize={tourSize}
            country={tourCountry}
            storeName={tourStoreName}
            destination={tourDestination}
          />
        </div>

        {/* ─── 5. HELPERS SECTION (NORMALIZED) ─── */}
        {plan.helpers && plan.helpers.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50/40 via-purple-50/20 to-white border border-indigo-200/70 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-indigo-100/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200/80 shadow-2xs">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900">
                    พนักงานช่วยงาน ({plan.helpers.length} คน)
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    รายชื่อเพื่อนร่วมงานที่ขอตัวไปช่วยปฏิบัติงาน
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-xs font-bold bg-indigo-100/80 text-indigo-800 border-indigo-200"
              >
                {plan.helpers.length} คน
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plan.helpers.map((h, idx) => (
                <div
                  key={h.id || idx}
                  className="bg-white/95 border border-indigo-100/90 hover:border-indigo-200 rounded-xl p-3.5 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs transition-all"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {h.employee?.name || "พนักงาน"}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {h.employee?.positionTitle ||
                            h.employee?.position?.name ||
                            "-"}{" "}
                          •{" "}
                          {h.departmentName ||
                            h.employee?.departmentName ||
                            h.employee?.department?.name ||
                            "ไม่ระบุแผนก"}
                        </div>
                        {h.rejectionReason && (
                          <div className="text-[10px] text-red-600 mt-1 italic">
                            เหตุผลปฏิเสธ: {h.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 shrink-0 rounded-full",
                        h.status === "APPROVED" &&
                          "border-emerald-200 text-emerald-700 bg-emerald-50",
                        h.status === "REJECTED" &&
                          "border-red-200 text-red-700 bg-red-50",
                        h.status === "PENDING" &&
                          "border-amber-200 text-amber-700 bg-amber-50",
                      )}
                    >
                      {h.status === "APPROVED"
                        ? "อนุมัติแล้ว"
                        : h.status === "REJECTED"
                          ? "ปฏิเสธ"
                          : "รออนุมัติ"}
                    </Badge>
                  </div>

                  {/* Individual Helper Review Actions for Managers */}
                  {plan.status === "PENDING_HELPER_APPROVAL" &&
                    canManageOrApprove &&
                    h.status === "PENDING" && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isProcessingHelper}
                          onClick={() => {
                            setReviewingHelperId(h.employeeId);
                            setHelperRejectReason("");
                            setRejectHelperDialogOpen(true);
                          }}
                          className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 rounded-lg"
                        >
                          ไม่อนุมัติ
                        </Button>
                        <Button
                          size="sm"
                          disabled={isProcessingHelper}
                          onClick={async () => {
                            setIsProcessingHelper(true);
                            const res = await reviewSingleActivityHelperAction(
                              id,
                              h.employeeId,
                              "APPROVE",
                            );
                            setIsProcessingHelper(false);
                            if (res.success) {
                              loadData();
                            } else {
                              alert(res.error || "ไม่สามารถอนุมัติได้");
                            }
                          }}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 rounded-lg"
                        >
                          อนุมัติคนช่วย
                        </Button>
                      </div>
                    )}
                </div>
              ))}
            </div>

            {/* Modal for rejecting individual helper */}
            {rejectHelperDialogOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
                  <h3 className="text-base font-bold text-slate-900">
                    ระบุเหตุผลที่ไม่อนุมัติพนักงานช่วยงาน
                  </h3>
                  <p className="text-xs text-slate-500">
                    ระบบจะส่งแผนงานนี้กลับไปยังผู้สร้างเพื่อให้แก้ไขรายชื่อผู้ช่วยงานใหม่
                  </p>
                  <textarea
                    rows={3}
                    value={helperRejectReason}
                    onChange={(e) => setHelperRejectReason(e.target.value)}
                    placeholder="ระบุเหตุผล เช่น ติดภารกิจอื่น, ไม่อนุญาต ฯลฯ"
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      disabled={isProcessingHelper}
                      onClick={() => setRejectHelperDialogOpen(false)}
                      className="rounded-xl"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      disabled={isProcessingHelper || !helperRejectReason.trim()}
                      onClick={async () => {
                        if (!reviewingHelperId) return;
                        setIsProcessingHelper(true);
                        const res = await reviewSingleActivityHelperAction(
                          id,
                          reviewingHelperId,
                          "REJECT",
                          helperRejectReason.trim(),
                        );
                        setIsProcessingHelper(false);
                        setRejectHelperDialogOpen(false);
                        if (res.success) {
                          loadData();
                        } else {
                          alert(res.error || "ไม่สามารถดำเนินการได้");
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                    >
                      ยืนยันปฏิเสธ
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── 6. APPROVAL AUDIT LOGS ─── */}
        {plan.approvalLogs && plan.approvalLogs.length > 0 && (
          <div className="bg-gradient-to-br from-slate-50/80 via-white to-slate-50/40 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs">
                <History className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  ประวัติการดำเนินการ (Approval Audit Logs)
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  บันทึกประวัติการส่งแผนงาน พิจารณา และอนุมัติตามลำดับขั้นตอน
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {plan.approvalLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white p-3.5 rounded-xl border border-slate-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {log.user?.name || "ผู้ใช้งาน"}
                      </span>
                      {renderAuditActionBadge(log.action)}
                    </div>
                    {log.comment && (
                      <div className="text-slate-600 text-xs italic bg-slate-50/80 p-2 rounded-lg border border-slate-100 mt-1">
                        &quot;{log.comment}&quot;
                      </div>
                    )}
                  </div>
                  <div className="text-slate-400 text-[11px] whitespace-nowrap flex items-center gap-1.5 self-end sm:self-center">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm น.", {
                        locale: th,
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── 7. BOTTOM ACTIONS & APPROVAL ACTION BAR (READ-ONLY DETAIL) ─── */}
        <DetailViewActions
          onBack={handleBack}
          backLabel="กลับหน้ารายการอนุมัติ"
        >
          {canPerformApproval && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenActionDialog("REJECT")}
                className="text-xs text-red-600 border-red-200 hover:bg-red-50 rounded-xl h-10 px-4 font-semibold shadow-2xs cursor-pointer"
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                ปฏิเสธ
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenActionDialog("REQUEST_CORRECTION")}
                className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50 rounded-xl h-10 px-4 font-semibold shadow-2xs cursor-pointer"
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                ส่งกลับแก้ไข
              </Button>
              <Button
                size="sm"
                onClick={() => handleOpenActionDialog("APPROVE")}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs rounded-xl h-10 px-6 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                อนุมัติแผนงาน
              </Button>
            </>
          )}
        </DetailViewActions>
      </div>

      {/* Approval Confirmation Dialog */}
      <ApprovalActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        plan={plan}
        actionType={actionType}
        onSuccess={() => {
          router.push("/activity-plans/approvals");
        }}
      />
    </section>
  );
}
