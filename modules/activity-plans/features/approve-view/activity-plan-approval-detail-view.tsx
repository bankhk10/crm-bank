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
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActivityPlanWithRelations } from "../../types";
import { getActivityPlanAction } from "../../server/actions";
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

  // Budget calculations
  const salesPromo = plan.salesPromotionBudgetRequested
    ? Number(plan.salesPromotionBudgetRequested)
    : 0;
  const marketing = plan.marketingBudgetRequested
    ? Number(plan.marketingBudgetRequested)
    : 0;
  const budgetTotal = salesPromo + marketing;

  return (
    <section className="space-y-6 container mx-auto px-0 sm:px-0">
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-6 shadow-xs">
        {/* ─── 1. TOP HEADER (APPROVAL DETAIL) - Patterned after ActualViewHeader ─── */}
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          {/* Center: Icon + Title */}
          <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 shadow-2xs">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="font-bold text-lg sm:text-2xl text-slate-800 tracking-tight whitespace-nowrap">
                รายละเอียดแผนงานสำหรับการอนุมัติ
              </h1>
            </div>
          </div>

          {/* Right: Plan No + Status Badge */}
          <div className="ml-auto flex items-center gap-2 self-start sm:self-auto">
            {(plan.code || planSummary.planNo) && (
              <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-2xs">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>เลขที่แผน: {plan.code || planSummary.planNo}</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── 2. GENERAL PLAN INFORMATION (Activity Plan Overview) ─── */}
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Card 1: ชื่อแผนงาน / กิจกรรม */}
            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 font-medium mb-0.5">
                  ชื่อแผนงาน / กิจกรรม
                </p>
                <p
                  className="text-base font-bold text-slate-800 truncate"
                  title={plan.title}
                >
                  {plan.title || "-"}
                </p>
              </div>
            </div>

            {/* Card 2: วันที่เริ่ม - สิ้นสุด */}
            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 font-medium mb-0.5">
                  วันที่เริ่ม - สิ้นสุด ({plan.durationDays} วัน)
                </p>
                <p className="text-xs sm:text-sm font-bold text-slate-800 flex flex-wrap items-center gap-x-2 gap-y-0.5">
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
            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 font-medium mb-0.5">
                  ผู้จัดทำแผน
                </p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {plan.employee?.name || "-"}
                </p>
              </div>
            </div>

            {/* Card 4: สถานที่จัดงาน */}
            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    ประเภทงานที่ระบุในแผน ({resolvedWorkTypes.length} ประเภท):
                  </p>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {resolvedWorkTypes.map((wt, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className={cn(
                          "text-xs px-2.5 py-1 font-semibold rounded-lg border shadow-2xs",
                          wt.code === "TYPE_12"
                            ? "bg-sky-50 text-sky-800 border-sky-200"
                            : "bg-indigo-50 text-indigo-800 border-indigo-200",
                        )}
                      >
                        {wt.name}
                      </Badge>
                    ))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── BUDGETS & MARKETING MATERIALS SECTIONS (MATCHING ACTUAL VIEW) ─── */}
          <BudgetSection summary={planSummary} />
          <PromotionalMaterialsSection summary={planSummary} />
          <MarketingExpenseSection summary={planSummary} />

          {/* Card 6: หมายเหตุเพิ่มเติม (ถ้ามี) */}
          {plan.notes && (
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-1.5 shadow-2xs">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                หมายเหตุเพิ่มเติม:
              </span>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-white p-3 rounded-xl border border-slate-100">
                {plan.notes}
              </p>
            </div>
          )}
        </div>

        {/* ─── 3. รายละเอียดตามประเภทงาน (WORK TYPE SPECIFIC DETAILS) ─── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                รายละเอียดตามประเภทงาน (Work Type Details)
              </h3>
            </div>
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

        {/* Card 5: ประเภทงานที่เลือก */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-700">
              สถานที่จัดงาน : {plan.location || "-"}
            </span>
          </div>
        </div>

        {/* ─── 5. HELPERS SECTION (NORMALIZED) ─── */}
        {plan.helpers && plan.helpers.length > 0 && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                  <Users className="w-4 h-4" />
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
                className="text-xs font-semibold bg-purple-50 text-purple-800 border-purple-200"
              >
                {plan.helpers.length} คน
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plan.helpers.map((h, idx) => (
                <div
                  key={h.id || idx}
                  className="bg-slate-50/80 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {idx + 1}. {h.employee?.name || "พนักงาน"}
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
              ))}
            </div>
          </div>
        )}

        {/* ─── 6. APPROVAL AUDIT LOGS ─── */}
        {plan.approvalLogs && plan.approvalLogs.length > 0 && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <History className="h-4 w-4 text-slate-500" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                ประวัติการดำเนินการ (Approval Audit Logs)
              </h4>
            </div>

            <div className="space-y-2">
              {plan.approvalLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {log.user?.name || "ผู้ใช้งาน"}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {log.action}
                      </Badge>
                    </div>
                    {log.comment && (
                      <div className="text-slate-600 text-xs italic bg-white p-1.5 rounded border border-slate-100 mt-1">
                        &quot;{log.comment}&quot;
                      </div>
                    )}
                  </div>
                  <div className="text-slate-400 text-[11px] whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>
                      {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", {
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
