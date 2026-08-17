"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Calendar,
  MapPin,
  Target,
  FileText,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowLeft,
  Clock,
  ShieldCheck,
  User,
  ClipboardList,
  Layers,
  Package,
  Sparkles,
  Edit,
  Store,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Tag,
  Boxes,
  Gift,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ActivityStatusBadge } from "../../ui/activity-status-badge";
import type { ActivityPlanWithRelations } from "../../types";
import {
  getActivityPlanAction,
  approveActivityPlanAction,
  rejectActivityPlanAction,
  requestCorrectionPlanAction,
  cancelActivityPlanAction,
} from "../../server/actions";
import { WORK_TYPES, isFieldDayItem } from "../form/constants";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
}

interface ParsedWorkTypeSection {
  typeIndex: number;
  title: string;
  badge: string;
  items: Array<{
    title: string;
    subtitle?: string;
    badge?: string;
    details?: string;
    amount?: string;
    extraFields?: Array<{ label: string; value: string }>;
  }>;
  rawSummary?: string;
  // Target info derived from plan items for each work type
  targetCards?: Array<{ label: string; value: string; highlight?: boolean }>;
}

interface MarketingProductDetail {
  category: string;
  productName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
}

interface SalesPromotionDetail {
  budgetType: string;
  detail: string;
  amount: number;
}

interface RequisitionDetail {
  productName: string;
  quantity: number;
  unit: string;
  detail: string;
}

export default function ActivityPlanDetailView({ id }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [plan, setPlan] = useState<ActivityPlanWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load details
  async function loadData() {
    setLoading(true);
    try {
      const res = await getActivityPlanAction(id);
      if (res.success && res.plan) {
        setPlan(res.plan);
      } else {
        setError(res.error || "ไม่สามารถดึงข้อมูลรายละเอียด Trip Plan ได้");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการโหลดรายละเอียด Trip Plan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">กำลังโหลดข้อมูล Trip Plan...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "ไม่พบข้อมูล Trip Plan"}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.push("/activity-plans")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> กลับหน้ารายการแผนงาน
        </Button>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // Check if current user is an approver at the current state
  // ────────────────────────────────────────────────────────
  const userEmployeeId = session?.user?.employeeId;
  const roles = (session?.user as any)?.roles ?? [];
  const isAdmin =
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo") ||
    (session?.user as any)?.role === "administrator" ||
    (session?.user as any)?.role === "ADMIN";

  let canApproveThisStep = false;
  let approvalPrompt = "";

  const isPending =
    plan.status === "PENDING_LINE_APPROVAL" ||
    plan.status === "PENDING_BUDGET_APPROVAL" ||
    plan.status === "PENDING_HELPER_APPROVAL";

  if (isAdmin && isPending) {
    canApproveThisStep = true;
    approvalPrompt =
      "คุณมีสิทธิ์ Administrator ในการอนุมัติ/จัดการ Trip Plan นี้";
  } else if (plan.status === "PENDING_LINE_APPROVAL") {
    canApproveThisStep = userEmployeeId === plan.currentApproverEmployeeId;
    approvalPrompt = "คุณคือหัวหน้างานในสายการอนุมัติ Trip Plan นี้";
  } else if (plan.status === "PENDING_BUDGET_APPROVAL") {
    const canApproveBudget =
      session?.user?.permissionKeys?.includes("activity.approve") ||
      session?.user?.permissionKeys?.includes("activity.manage");
    if (canApproveBudget) {
      canApproveThisStep = true;
      approvalPrompt = "คุณมีสิทธิ์อนุมัติงบประมาณ Trip Plan";
    }
  } else if (plan.status === "PENDING_HELPER_APPROVAL") {
    const isHelperManager = plan.helpers.some(
      (h) =>
        h.employeeId === userEmployeeId || h.approvedById === userEmployeeId,
    );
    if (
      isHelperManager ||
      session?.user?.permissionKeys?.includes("activity.manage")
    ) {
      canApproveThisStep = true;
      approvalPrompt = "คุณคือผู้จัดการแผนกของพนักงานช่วยงาน";
    }
  }

  const handleApprove = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await approveActivityPlanAction(plan.id, comment);
      if (res.success) {
        setComment("");
        loadData();
      } else {
        setError(res.error || "เกิดข้อผิดพลาดในการอนุมัติ");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      setError("กรุณาระบุความเห็นกรณีปฏิเสธแผน");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await rejectActivityPlanAction(plan.id, comment);
      if (res.success) {
        setComment("");
        loadData();
      } else {
        setError(res.error || "เกิดข้อผิดพลาดในการปฏิเสธ");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestCorrection = async () => {
    if (!comment.trim()) {
      setError("กรุณาระบุสิ่งที่ต้องแก้ไขในความเห็น");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await requestCorrectionPlanAction(plan.id, comment);
      if (res.success) {
        setComment("");
        loadData();
      } else {
        setError(res.error || "เกิดข้อผิดพลาดในการตีกลับแก้ไข");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPlan = async () => {
    if (!window.confirm("ยืนยันการยกเลิก Trip Plan นี้ใช่หรือไม่?")) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await cancelActivityPlanAction(plan.id);
      if (res.success) {
        loadData();
      } else {
        setError(res.error || "เกิดข้อผิดพลาดในการยกเลิก");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const salesPromoVal = plan.salesPromotionBudgetRequested
    ? Number(plan.salesPromotionBudgetRequested)
    : 0;
  const marketingVal = plan.marketingBudgetRequested
    ? Number(plan.marketingBudgetRequested)
    : 0;
  const budgetTotal = salesPromoVal + marketingVal;

  const start = new Date(plan.startDate);
  const end = new Date(plan.endDate);

  // Extract structured sections using form mappings
  const workTypeSections = extractWorkTypeSections(plan);
  const marketingProducts = extractMarketingProducts(plan);
  const salesPromotions = extractSalesPromotions(plan);
  const requisitions = extractRequisitions(plan);

  return (
    <section className="space-y-6 p-4 md:p-6 pb-28 md:pb-12 max-w-6xl mx-auto">
      {/* ──────────────────────────────────────────────────────── */}
      {/* TOP ACTION BAR & TITLE */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/activity-plans")}
            className="rounded-full h-9 w-9 flex-shrink-0"
            title="กลับหน้ารายการแผนงาน"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                {plan.code || plan.id.slice(0, 8)}
              </span>
              <ActivityStatusBadge status={plan.status} />
              {(plan.activityType as any)?.name && (
                <Badge
                  variant="outline"
                  className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold"
                >
                  {(plan.activityType as any).name}
                </Badge>
              )}
              {plan.durationDays > 1 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-slate-50 text-slate-700"
                >
                  {plan.durationDays} วัน
                </Badge>
              )}
            </div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-1 leading-tight">
              {plan.title}
            </h1>
          </div>
        </div>

        {/* Action Button Group */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {(plan.status === "DRAFT" ||
            plan.status === "WAITING_FOR_CORRECTION") &&
            (plan.createdById === session?.user?.id || isAdmin) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/activity-plans/${plan.id}/edit`)}
                className="text-xs font-semibold gap-1.5 border-slate-300"
              >
                <Edit className="h-3.5 w-3.5" />
                แก้ไขแผนงาน
              </Button>
            )}

          <Button
            size="sm"
            onClick={() => router.push(`/activity-plans/${plan.id}/actual`)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-bold shadow-sm"
          >
            <ClipboardList className="h-4 w-4" />
            {plan.result
              ? "ดู / แก้ไขผลปฏิบัติงาน (Actual)"
              : "บันทึกผลปฏิบัติงาน (Actual)"}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* 4 HIGHLIGHT OVERVIEW CARDS */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Creator & Team */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              ผู้จัดทำแผน
            </span>
            <span className="font-bold text-slate-900 text-sm block truncate mt-0.5">
              {plan.employee.name}
            </span>
            <span className="text-xs text-slate-500 block truncate">
              {plan.employee.positionTitle ||
                plan.employee.departmentName ||
                "พนักงาน"}
            </span>
          </div>
        </div>

        {/* Card 2: Date & Time */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 flex-shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              วันเวลาจัดงาน ({plan.durationDays} วัน)
            </span>
            <span className="font-bold text-slate-900 text-sm block truncate mt-0.5">
              {format(start, "dd MMM yyyy", { locale: th })}
            </span>
            <span className="text-xs text-slate-500 block truncate">
              {format(start, "HH:mm")} - {format(end, "HH:mm")} น.
            </span>
          </div>
        </div>

        {/* Card 3: Location */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 flex-shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              สถานที่จัดกิจกรรม
            </span>
            <span
              className="font-bold text-slate-900 text-sm block truncate mt-0.5"
              title={plan.location}
            >
              {plan.location}
            </span>
            <span className="text-xs text-slate-500 block truncate">
              {[
                plan.district ? `อ.${plan.district}` : "",
                plan.province ? `จ.${plan.province}` : "",
              ]
                .filter(Boolean)
                .join(" ") || "-"}
            </span>
          </div>
        </div>

        {/* Card 4: Total Budget */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 flex-shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              งบประมาณขออนุมัติ
            </span>
            <span className="font-bold text-slate-900 text-sm block mt-0.5">
              {budgetTotal > 0
                ? `${budgetTotal.toLocaleString()} บาท`
                : "ไม่มีงบประมาณ"}
            </span>
            <span className="text-xs text-slate-500 block truncate">
              {salesPromoVal > 0
                ? `SP: ${salesPromoVal.toLocaleString()}฿`
                : ""}{" "}
              {marketingVal > 0 ? `MKT: ${marketingVal.toLocaleString()}฿` : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* POST-ACTIVITY ACTUAL RESULT BANNER (IF RECORDED) */}
      {/* ──────────────────────────────────────────────────────── */}
      {plan.result && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                บันทึกผลสำเร็จแล้ว (Actual Recorded)
              </span>
              {plan.result.resultStatus && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-semibold",
                    plan.result.resultStatus === "COMPLETED" &&
                      "bg-green-100 text-green-800 border-green-200",
                    plan.result.resultStatus === "PARTIAL" &&
                      "bg-amber-100 text-amber-800 border-amber-200",
                    plan.result.resultStatus === "POSTPONED" &&
                      "bg-blue-100 text-blue-800 border-blue-200",
                    plan.result.resultStatus === "CANCELLED" &&
                      "bg-red-100 text-red-800 border-red-200",
                  )}
                >
                  สถานะผล:{" "}
                  {plan.result.resultStatus === "COMPLETED"
                    ? "สำเร็จ"
                    : plan.result.resultStatus === "PARTIAL"
                      ? "สำเร็จบางส่วน"
                      : plan.result.resultStatus === "POSTPONED"
                        ? "เลื่อนกิจกรรม"
                        : "ยกเลิกกิจกรรม"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-600">
              บันทึกผลเมื่อ{" "}
              {format(
                new Date(plan.result.recordedAt || plan.result.actualStartDate),
                "dd MMM yyyy HH:mm",
                { locale: th },
              )}
              {plan.result.recordedBy?.name
                ? ` โดย ${plan.result.recordedBy.name}`
                : ""}
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/activity-plans/${plan.id}/actual`)}
            className="bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-bold shrink-0"
          >
            ดูรายละเอียดผลงานจริง (Actual)
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* MAIN TWO-COLUMN LAYOUT: Content (Col 2) + Sidebar (Col 1) */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* LEFT COLUMN: DETAILED WORK TYPES & BREAKDOWN (Col Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Objective & Notes */}
          {plan.objective && (
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                <FileText className="h-4 w-4 text-slate-500" />
                วัตถุประสงค์และสรุปแผนงาน
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {plan.objective}
              </p>
            </div>
          )}
          {(plan as any).notes && (
            <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-100">
              <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-2">
                <AlertCircle className="h-3.5 w-3.5" />
                หมายเหตุ
              </h4>
              <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line">
                {(plan as any).notes}
              </p>
            </div>
          )}

          {/* 2. Structured Work Types Activities Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600" />
                รายละเอียดกิจกรรมตามประเภทงานที่เลือก ({
                  workTypeSections.length
                }{" "}
                กิจกรรม)
              </h3>
            </div>

            {workTypeSections.length === 0 ? (
              <div className="bg-white rounded-xl p-6 border border-slate-200 text-center text-xs text-slate-400">
                ไม่มีรายการกิจกรรมเฉพาะ
              </div>
            ) : (
              <div className="space-y-4">
                {workTypeSections.map((sec) => (
                  <div
                    key={sec.typeIndex}
                    className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden"
                  >
                    {/* Section Header */}
                    <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          รูปแบบที่ {sec.typeIndex}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {sec.title}
                        </h4>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[11px] bg-white text-slate-700"
                      >
                        {sec.badge}
                      </Badge>
                    </div>

                    {/* Section Content */}
                    <div className="p-4 space-y-3">
                      {sec.rawSummary && (
                        <p className="text-xs text-slate-600 leading-relaxed bg-blue-50/30 p-3 rounded-lg border border-blue-50">
                          {sec.rawSummary}
                        </p>
                      )}

                      {sec.items.length > 0 && (
                        <div className="divide-y border rounded-lg overflow-hidden bg-slate-50/20">
                          {sec.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{idx + 1}.</span>
                                  <span>{item.title}</span>
                                  {item.badge && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] py-0"
                                    >
                                      {item.badge}
                                    </Badge>
                                  )}
                                </div>
                                {item.subtitle && (
                                  <div className="text-slate-500 pl-4">
                                    {item.subtitle}
                                  </div>
                                )}
                                {item.details && (
                                  <div className="text-slate-600 pl-4 italic">
                                    รายละเอียด: {item.details}
                                  </div>
                                )}
                                {item.extraFields &&
                                  item.extraFields.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pl-4 pt-1">
                                      {item.extraFields.map((f, fIdx) => (
                                        <span
                                          key={fIdx}
                                          className="inline-flex items-center gap-1 text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700"
                                        >
                                          <span className="font-semibold text-slate-500">
                                            {f.label}:
                                          </span>
                                          <span className="font-medium text-slate-900">
                                            {f.value}
                                          </span>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                              </div>

                              {item.amount && (
                                <div className="text-sm font-extrabold text-blue-700 sm:text-right shrink-0">
                                  {item.amount}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Target Summary Cards — สรุปเป้าหมายของ work type นี้ */}
                      {sec.targetCards && sec.targetCards.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {sec.targetCards.map((tc, tcIdx) => (
                            <div
                              key={tcIdx}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border",
                                tc.highlight
                                  ? "bg-blue-50 border-blue-200 text-blue-800"
                                  : "bg-slate-50 border-slate-200 text-slate-700",
                              )}
                            >
                              <TrendingUp
                                className={cn(
                                  "h-3.5 w-3.5 shrink-0",
                                  tc.highlight
                                    ? "text-blue-500"
                                    : "text-slate-400",
                                )}
                              />
                              <span className="text-slate-500">
                                {tc.label}:
                              </span>
                              <span
                                className={cn(
                                  "font-extrabold",
                                  tc.highlight
                                    ? "text-blue-700"
                                    : "text-slate-800",
                                )}
                              >
                                {tc.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Promotional Media & Materials Requisition (สื่อส่งเสริมการขายและขอเบิก) */}
          {(marketingProducts.length > 0 || requisitions.length > 0) && (
            <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="border-b pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Package className="h-4 w-4 text-teal-600" />
                  สื่อส่งเสริมการขายและรายการขอเบิกวัสดุ
                </h3>
              </div>

              {/* Marketing Products */}
              {marketingProducts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <Tag className="h-3.5 w-3.5 text-teal-600" />
                    สื่อส่งเสริมการขาย ({marketingProducts.length} รายการ)
                  </h4>
                  <div className="divide-y border rounded-lg overflow-hidden bg-slate-50/20 text-xs">
                    {marketingProducts.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{idx + 1}.</span>
                            <span>{m.productName}</span>
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-teal-50 text-teal-800 border-teal-200"
                            >
                              {m.category}
                            </Badge>
                          </div>
                          <div className="text-slate-500 pl-4">
                            จำนวน: {m.quantity} {m.unit}
                            {m.pricePerUnit > 0 &&
                              ` @ ฿${m.pricePerUnit.toLocaleString()}/${m.unit}`}
                          </div>
                        </div>
                        {m.totalAmount > 0 && (
                          <div className="text-sm font-extrabold text-teal-700 sm:text-right shrink-0">
                            ฿{m.totalAmount.toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General Requisitions */}
              {requisitions.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                    <Boxes className="h-3.5 w-3.5 text-blue-600" />
                    รายการขอเบิกสินค้า/อุปกรณ์ทดลอง ({requisitions.length}{" "}
                    รายการ)
                  </h4>
                  <div className="divide-y border rounded-lg overflow-hidden bg-slate-50/20 text-xs">
                    {requisitions.map((r, idx) => (
                      <div
                        key={idx}
                        className="p-3 flex items-center justify-between"
                      >
                        <span className="font-medium text-slate-800">
                          {idx + 1}. {r.productName}
                        </span>
                        {r.quantity > 0 && (
                          <span className="text-slate-500">
                            {r.quantity} {r.unit}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Budget Information Card */}
          <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                ข้อมูลและการอนุมัติงบประมาณ
              </h3>
              <span className="text-sm font-extrabold text-slate-900">
                ยอดขออนุมัติรวม: {budgetTotal.toLocaleString()} บาท
              </span>
            </div>

            {budgetTotal === 0 ? (
              <p className="text-xs text-slate-400 italic">
                ไม่มีความจำเป็นต้องใช้วงเงินงบประมาณในกิจกรรมนี้
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {/* Sales Promo Budget */}
                  <div
                    className={cn(
                      "p-4 rounded-xl border flex justify-between items-center",
                      salesPromoVal > 0
                        ? "bg-blue-50/40 border-blue-100"
                        : "bg-slate-50/40 border-slate-100",
                    )}
                  >
                    <div>
                      <span className="text-xs text-slate-500 font-semibold block">
                        งบส่งเสริมการขาย (Sales Promotion)
                      </span>
                      <span className="text-base font-extrabold text-slate-900 mt-1 block">
                        {salesPromoVal.toLocaleString()} ฿
                      </span>
                    </div>
                    {salesPromoVal > 0 && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-semibold",
                          plan.salesPromotionApproved
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200",
                        )}
                      >
                        {plan.salesPromotionApproved
                          ? "อนุมัติแล้ว"
                          : "รออนุมัติ"}
                      </Badge>
                    )}
                  </div>

                  {/* Marketing Budget */}
                  <div
                    className={cn(
                      "p-4 rounded-xl border flex justify-between items-center",
                      marketingVal > 0
                        ? "bg-purple-50/40 border-purple-100"
                        : "bg-slate-50/40 border-slate-100",
                    )}
                  >
                    <div>
                      <span className="text-xs text-slate-500 font-semibold block">
                        งบการตลาด (Marketing)
                      </span>
                      <span className="text-base font-extrabold text-purple-900 mt-1 block">
                        {marketingVal.toLocaleString()} ฿
                      </span>
                    </div>
                    {marketingVal > 0 && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-semibold",
                          plan.marketingApproved
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200",
                        )}
                      >
                        {plan.marketingApproved ? "อนุมัติแล้ว" : "รออนุมัติ"}
                      </Badge>
                    )}
                  </div>

                  {/* Overall Budget Status */}
                  {plan.status === "PENDING_BUDGET_APPROVAL" && (
                    <div className="sm:col-span-2 bg-blue-50/60 p-3 rounded-lg border border-blue-100 flex items-center gap-2 text-xs text-blue-800">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
                      <span>
                        สถานะภาพรวมงบประมาณ:{" "}
                        <strong>
                          {plan.salesManagerApproved
                            ? "ผ่านการอนุมัติงบภาพรวมจากฝ่ายขายแล้ว"
                            : "รอผู้จัดการฝ่ายขายอนุมัติงบประมาณภาพรวมทั้งหมด"}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Sales Promotion Items List Breakdown */}
                {salesPromotions.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                      <Gift className="h-3.5 w-3.5 text-blue-600" />
                      รายการงบประมาณส่งเสริมการขาย ({
                        salesPromotions.length
                      }{" "}
                      รายการ)
                    </h4>
                    <div className="divide-y border rounded-lg overflow-hidden bg-slate-50/20 text-xs">
                      {salesPromotions.map((sp, idx) => (
                        <div
                          key={idx}
                          className="p-3 flex items-center justify-between gap-2"
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 block">
                              {idx + 1}. {sp.detail}
                            </span>
                            <span className="text-slate-500">
                              ประเภทงบ: {sp.budgetType}
                            </span>
                          </div>
                          {sp.amount > 0 && (
                            <span className="font-extrabold text-blue-700 text-sm shrink-0">
                              ฿{sp.amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5. Helpers List Card */}
          <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                พนักงานเข้าร่วมช่วยงาน ({plan.helpers.length} คน)
              </h3>
            </div>

            {plan.helpers.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                ไม่มีพนักงานช่วยงานเพิ่มเติมในแผนกิจกรรมนี้
              </p>
            ) : (
              <div className="divide-y border rounded-xl overflow-hidden bg-slate-50/30">
                {plan.helpers.map((helper, idx) => (
                  <div
                    key={helper.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block text-sm">
                        {idx + 1}. {helper.employee.name}
                      </span>
                      <span className="text-slate-500 mt-0.5 block">
                        ตำแหน่ง: {helper.employee.positionTitle || "-"} | แผนก:{" "}
                        {helper.employee.departmentName ||
                          helper.departmentName ||
                          "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-semibold",
                          helper.status === "APPROVED" &&
                            "bg-emerald-50 text-emerald-700 border-emerald-200",
                          helper.status === "PENDING" &&
                            "bg-amber-50 text-amber-700 border-amber-200",
                          helper.status === "REJECTED" &&
                            "bg-red-50 text-red-700 border-red-200",
                        )}
                      >
                        {helper.status === "APPROVED" && "อนุมัติแล้ว"}
                        {helper.status === "PENDING" && "รออนุมัติ"}
                        {helper.status === "REJECTED" && "ปฏิเสธ/ติดขัด"}
                      </Badge>
                      {helper.rejectionReason && (
                        <span
                          className="text-red-500 font-medium max-w-[160px] truncate"
                          title={helper.rejectionReason}
                        >
                          เหตุผล: {helper.rejectionReason}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: APPROVAL WORKFLOW & ACTIONS (Col Span 1) */}
        <div className="space-y-6">
          {/* Approval Action Panel */}
          {canApproveThisStep && (
            <div className="bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/30 rounded-xl p-5 border-2 border-blue-200/80 shadow-md space-y-4">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <span>แผงควบคุมการพิจารณาอนุมัติ</span>
              </div>
              <p className="text-xs text-blue-900 bg-blue-50 p-2.5 rounded-lg border border-blue-100 leading-relaxed font-medium">
                {approvalPrompt}
              </p>
              <textarea
                placeholder="ระบุข้อเสนอแนะ, เหตุผลการอนุมัติ หรือสิ่งที่ต้องการให้แก้ไข..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full text-xs rounded-lg border border-slate-200 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
              <div className="grid gap-2 grid-cols-2">
                <Button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold col-span-2 flex items-center justify-center gap-1.5 text-xs shadow-sm h-9"
                >
                  <CheckCircle className="h-4 w-4" />
                  อนุมัติผ่านแผนงาน (Approve)
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRequestCorrection}
                  disabled={submitting || !comment.trim()}
                  className="text-amber-700 border-amber-300 hover:bg-amber-50 font-bold text-xs flex items-center justify-center gap-1 h-8"
                  title={
                    !comment.trim() ? "กรุณากรอกเหตุผลเพื่อส่งกลับแก้ไข" : ""
                  }
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  ส่งกลับแก้ไข
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={submitting}
                  className="font-bold text-xs flex items-center justify-center gap-1 h-8"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  ปฏิเสธแผน
                </Button>
              </div>
            </div>
          )}

          {/* Cancellation Option for Creator */}
          {plan.createdById === session?.user?.id &&
            plan.status !== "APPROVED" &&
            plan.status !== "REJECTED" &&
            plan.status !== "CANCELLED" && (
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
                <Button
                  variant="outline"
                  onClick={handleCancelPlan}
                  disabled={submitting}
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 text-xs font-semibold"
                >
                  ยกเลิกแผนกิจกรรมนี้
                </Button>
              </div>
            )}

          {/* Plan Meta Info Card */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs space-y-2">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Tag className="h-3.5 w-3.5 text-indigo-500" />
              ข้อมูลแผนงาน
            </h4>
            <div className="space-y-2 text-xs">
              {(plan.activityType as any)?.name && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 shrink-0">ประเภทงาน</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {(plan.activityType as any).name}
                  </span>
                </div>
              )}
              {(plan as any).fiscalYear && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 shrink-0">ปีงบประมาณ</span>
                  <span className="font-semibold text-slate-800">
                    {(plan as any).fiscalYear}
                  </span>
                </div>
              )}
              {(plan as any).fiscalMonth && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 shrink-0">เดือนงบประมาณ</span>
                  <span className="font-semibold text-slate-800">
                    {(plan as any).fiscalMonth}
                  </span>
                </div>
              )}
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 shrink-0">วันที่จัดทำ</span>
                <span className="font-semibold text-slate-800">
                  {format(new Date((plan as any).createdAt), "dd MMM yyyy", { locale: th })}
                </span>
              </div>
              {plan.durationDays > 1 && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 shrink-0">จำนวนวัน</span>
                  <span className="font-semibold text-slate-800">
                    {plan.durationDays} วัน
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Workflow Progress Timeline */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              บันทึกประวัติการอนุมัติ (Approval Logs)
            </h3>

            <div className="relative pl-5 border-l-2 border-slate-100 space-y-5">
              {plan.approvalLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  ไม่มีข้อมูลประวัติ
                </p>
              ) : (
                plan.approvalLogs.map((log) => {
                  let badgeColor = "bg-slate-400";
                  if (log.action === "APPROVE") badgeColor = "bg-emerald-500";
                  if (log.action === "REJECT") badgeColor = "bg-red-500";
                  if (log.action === "REQUEST_CORRECTION")
                    badgeColor = "bg-amber-500";
                  if (log.action === "SUBMIT") badgeColor = "bg-blue-500";

                  let actionText = log.action as string;
                  if (log.action === "SUBMIT") actionText = "ยื่นคำขออนุมัติ";
                  if (log.action === "APPROVE") actionText = "อนุมัติแล้ว";
                  if (log.action === "REJECT") actionText = "ปฏิเสธแผน";
                  if (log.action === "REQUEST_CORRECTION")
                    actionText = "ส่งกลับให้แก้ไข";
                  if (log.action === "CANCEL") actionText = "ยกเลิกคำขอ";

                  let stepText = log.step as string;
                  if (log.step === "LINE_APPROVAL") stepText = "ตรวจสอบสายงาน";
                  if (log.step === "BUDGET_APPROVAL")
                    stepText = "อนุมัติงบประมาณ";
                  if (log.step === "HELPER_APPROVAL")
                    stepText = "อนุมัติคนช่วยงาน";

                  return (
                    <div key={log.id} className="relative text-xs">
                      {/* Timeline Dot */}
                      <span
                        className={cn(
                          "absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white ring-2 ring-slate-100",
                          badgeColor,
                        )}
                      />

                      <div className="flex justify-between items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {actionText}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {format(new Date(log.createdAt), "dd MMM HH:mm", {
                            locale: th,
                          })}
                        </span>
                      </div>

                      <div className="text-slate-500 mt-0.5">
                        {stepText ? `ขั้นตอน: ${stepText} | ` : ""}โดย:{" "}
                        {log.user.name}
                      </div>

                      {log.comment && (
                        <div className="mt-1.5 p-2 bg-slate-50 rounded text-slate-700 border border-slate-100 font-medium">
                          "{log.comment}"
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────
// Helper function to extract structured work type cards
// ────────────────────────────────────────────────────────
function extractWorkTypeSections(
  plan: ActivityPlanWithRelations,
): ParsedWorkTypeSection[] {
  const sections: ParsedWorkTypeSection[] = [];
  const items = (plan.items as any[]) || [];
  const objectiveText = plan.objective || "";
  const objectiveLines = objectiveText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // ── 1. เข้าพบร้านค้า / Key Farmer ──────────────────────
  const type1DbItems = items.filter(
    (i) =>
      i.itemType === "TYPE_1" ||
      (i.visitTopic &&
        i.itemType !== "MARKETING_PRODUCT" &&
        i.itemType !== "SALES_PROMOTION" &&
        !i.followupProductName &&
        !i.saleProductName &&
        !i.collectAmount &&
        !i.surveyCompetitorProduct &&
        !i.plotActivityType &&
        !i.meetingTopic &&
        !i.storeProductName),
  );
  const t1Line = objectiveLines.find(
    (l) =>
      l.includes("[เข้าพบร้านค้า") ||
      l.includes("เข้าพบร้านค้า") ||
      l.includes("Key Farmer"),
  );
  if (type1DbItems.length > 0 || t1Line) {
    const list =
      type1DbItems.length > 0
        ? type1DbItems.map((i) => {
            const extraFields: Array<{ label: string; value: string }> = [];
            if (i.opportunity)
              extraFields.push({ label: "โอกาสการขาย", value: i.opportunity });
            if (i.nextMeetingDate)
              extraFields.push({
                label: "นัดหมายครั้งถัดไป",
                value: i.nextMeetingDate,
              });
            if (i.nextAction)
              extraFields.push({
                label: "สิ่งที่ต้องดำเนินการ",
                value: i.nextAction,
              });
            return {
              title: i.customerName || plan.location || "ลูกค้า/ร้านค้า",
              subtitle: i.visitTopic
                ? `หัวข้อเป้าหมาย: ${i.visitTopic}`
                : undefined,
              details: i.detail || undefined,
              extraFields: extraFields.length > 0 ? extraFields : undefined,
            };
          })
        : [];
    sections.push({
      typeIndex: 1,
      title: WORK_TYPES[0],
      badge: "เข้าพบ",
      items: list,
      rawSummary: t1Line ? t1Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 2. ติดตามผลการใช้สินค้า ────────────────────────────
  const type2DbItems = items.filter(
    (i) => i.itemType === "TYPE_2" || i.followupProductName,
  );
  const t2Line = objectiveLines.find(
    (l) =>
      l.includes("[ติดตามผลการใช้สินค้า]") ||
      l.includes("ติดตามผลการใช้สินค้า"),
  );
  if (type2DbItems.length > 0 || t2Line) {
    const list =
      type2DbItems.length > 0
        ? type2DbItems.map((i) => {
            const extraFields: Array<{ label: string; value: string }> = [];
            if (i.expectedResult)
              extraFields.push({
                label: "ผลที่คาดหวัง",
                value: i.expectedResult,
              });
            return {
              title: i.followupProductName || i.productName || "สินค้าติดตาม",
              subtitle: i.customerName
                ? `ลูกค้า/แปลง: ${i.customerName}`
                : undefined,
              details: i.detail || undefined,
              extraFields: extraFields.length > 0 ? extraFields : undefined,
            };
          })
        : [];
    sections.push({
      typeIndex: 2,
      title: WORK_TYPES[1],
      badge: "ติดตามผล",
      items: list,
      rawSummary: t2Line ? t2Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 3. เสนอขายสินค้า ────────────────────────────────────
  const type3DbItems = items.filter(
    (i) =>
      !isFieldDayItem(i) &&
      i.itemType !== "MARKETING_PRODUCT" &&
      i.itemType !== "SALES_PROMOTION" &&
      i.visitTopic !== "MARKETING_PRODUCT" &&
      i.visitTopic !== "SALES_PROMOTION" &&
      (i.itemType === "TYPE_3" ||
        i.saleProductName ||
        (i.saleQuantity != null && i.saleUnitPrice != null) ||
        (i.saleTotalPrice != null &&
          !i.storeTotalAmount &&
          !i.collectAmount &&
          i.meetingAttendeesCount == null)),
  );
  const t3Line = objectiveLines.find(
    (l) => l.includes("[เสนอขายสินค้า]") || l.includes("เสนอขายสินค้า"),
  );
  if (type3DbItems.length > 0 || t3Line) {
    const totalSales = type3DbItems.reduce(
      (sum, i) => sum + Number(i.saleTotalPrice || 0),
      0,
    );
    const list =
      type3DbItems.length > 0
        ? type3DbItems.map((i) => {
            const qty = i.saleQuantity ? `${i.saleQuantity} หน่วย` : "";
            const price = i.saleUnitPrice
              ? `@ ฿${Number(i.saleUnitPrice).toLocaleString()}`
              : "";
            const total = i.saleTotalPrice
              ? `รวม ฿${Number(i.saleTotalPrice).toLocaleString()}`
              : "";
            return {
              title: i.saleProductName || "สินค้าเสนอขาย",
              subtitle: i.customerName
                ? `ลูกค้า/ร้านค้า: ${i.customerName}`
                : undefined,
              amount: total || undefined,
              details: [qty, price, i.detail].filter(Boolean).join(" | "),
            };
          })
        : [];
    const targetCards: Array<{
      label: string;
      value: string;
      highlight?: boolean;
    }> = [];
    if (totalSales > 0) {
      targetCards.push({
        label: "เป้ายอดขายรวม",
        value: `฿${totalSales.toLocaleString()}`,
        highlight: true,
      });
    }
    sections.push({
      typeIndex: 3,
      title: WORK_TYPES[2],
      badge: "เสนอขาย",
      items: list,
      rawSummary: t3Line ? t3Line.replace(/^\[.*?\]\s*/, "") : undefined,
      targetCards: targetCards.length > 0 ? targetCards : undefined,
    });
  }

  // ── 4. วางบิล / เก็บเงิน ─────────────────────────────────
  const type4DbItems = items.filter(
    (i) =>
      !isFieldDayItem(i) &&
      i.itemType !== "MARKETING_PRODUCT" &&
      i.itemType !== "SALES_PROMOTION" &&
      i.visitTopic !== "MARKETING_PRODUCT" &&
      i.visitTopic !== "SALES_PROMOTION" &&
      (i.itemType === "TYPE_4" || (i.collectAmount != null && !i.visitTopic)),
  );
  const t4Line = objectiveLines.find(
    (l) =>
      l.includes("[วางบิล") ||
      l.includes("วางบิล / เก็บเงิน") ||
      l.includes("วางบิล/เก็บเงิน"),
  );
  if (type4DbItems.length > 0 || t4Line) {
    const totalCollect = type4DbItems.reduce(
      (sum, i) => sum + Number(i.collectAmount || 0),
      0,
    );
    const list =
      type4DbItems.length > 0
        ? type4DbItems.map((i) => ({
            title: i.customerName || "ลูกค้า/ร้านค้า",
            amount: i.collectAmount
              ? `เป้าเก็บเงิน: ฿${Number(i.collectAmount).toLocaleString()}`
              : undefined,
            details:
              i.detail || i.orderNo
                ? [i.detail, i.orderNo ? `เลขบิล: ${i.orderNo}` : ""]
                    .filter(Boolean)
                    .join(" | ")
                : undefined,
          }))
        : [];
    const targetCards: Array<{
      label: string;
      value: string;
      highlight?: boolean;
    }> = [];
    if (totalCollect > 0) {
      targetCards.push({
        label: "เป้ายอดเก็บเงินรวม",
        value: `฿${totalCollect.toLocaleString()}`,
        highlight: true,
      });
    }
    sections.push({
      typeIndex: 4,
      title: WORK_TYPES[3],
      badge: "วางบิล",
      items: list,
      rawSummary: t4Line ? t4Line.replace(/^\[.*?\]\s*/, "") : undefined,
      targetCards: targetCards.length > 0 ? targetCards : undefined,
    });
  }

  // ── 5. สำรวจตลาดของคู่แข่ง ──────────────────────────────
  const type5DbItems = items.filter(
    (i) =>
      !isFieldDayItem(i) &&
      (i.itemType === "TYPE_5" || i.surveyCompetitorProduct || i.surveyStoreName),
  );
  const t5Line = objectiveLines.find(
    (l) =>
      l.includes("[สำรวจตลาด") ||
      l.includes("สำรวจตลาดของคู่แข่ง") ||
      l.includes("สำรวจตลาดคู่แข่ง"),
  );
  if (type5DbItems.length > 0 || t5Line) {
    const list =
      type5DbItems.length > 0
        ? type5DbItems.map((i) => {
            const extraFields: Array<{ label: string; value: string }> = [];
            if (i.surveyCompetitorBrand)
              extraFields.push({
                label: "แบรนด์คู่แข่ง",
                value: i.surveyCompetitorBrand,
              });
            return {
              title: i.surveyStoreName || "ร้านค้าสำรวจ",
              subtitle: i.surveyCompetitorProduct
                ? `สินค้าคู่แข่ง: ${i.surveyCompetitorProduct}`
                : undefined,
              details: i.detail || undefined,
              extraFields: extraFields.length > 0 ? extraFields : undefined,
            };
          })
        : [];
    sections.push({
      typeIndex: 5,
      title: WORK_TYPES[4],
      badge: "สำรวจคู่แข่ง",
      items: list,
      rawSummary: t5Line ? t5Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 6. แก้ปัญหา / รับเรื่องร้องเรียน ───────────────────
  const type6DbItems = items.filter(
    (i) => !isFieldDayItem(i) && (i.itemType === "TYPE_6" || i.issueType),
  );
  const t6Line = objectiveLines.find(
    (l) =>
      l.includes("[แก้ปัญหา") ||
      l.includes("แก้ปัญหา / รับเรื่องร้องเรียน") ||
      l.includes("แก้ปัญหา/ร้องเรียน"),
  );
  if (type6DbItems.length > 0 || t6Line) {
    const list =
      type6DbItems.length > 0
        ? type6DbItems.map((i) => {
            const extraFields: Array<{ label: string; value: string }> = [];
            if (i.targetStatus)
              extraFields.push({ label: "เป้าสถานะ", value: i.targetStatus });
            return {
              title: i.customerName || "ลูกค้า/เกษตรกร",
              badge: i.issueType || "ข้อร้องเรียน",
              details: i.detail || undefined,
              extraFields: extraFields.length > 0 ? extraFields : undefined,
            };
          })
        : [];
    sections.push({
      typeIndex: 6,
      title: WORK_TYPES[5],
      badge: "แก้ปัญหา",
      items: list,
      rawSummary: t6Line ? t6Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 7. ติดตามแปลงสาธิต / ทำแปลง ────────────────────────
  const type7DbItems = items.filter(
    (i) =>
      !isFieldDayItem(i) &&
      i.itemType !== "MARKETING_PRODUCT" &&
      i.itemType !== "SALES_PROMOTION" &&
      i.itemType !== "TYPE_10" &&
      i.visitTopic !== "MARKETING_PRODUCT" &&
      i.visitTopic !== "SALES_PROMOTION" &&
      (i.itemType === "TYPE_7" ||
        i.plotActivityType ||
        i.existingPlotId ||
        ((i.plotCropName ||
          i.plotOwnerName ||
          i.plotAreaRai != null ||
          i.plotTreeCount != null) &&
          !i.storePricePerCase)),
  );
  const t7Line = objectiveLines.find(
    (l) =>
      l.includes("[ติดตามแปลงสาธิต") ||
      l.includes("ติดตามแปลงสาธิต / ทำแปลง") ||
      l.includes("ทำแปลงสาธิต") ||
      (l.includes("แปลงสาธิต") &&
        !l.includes("Field Day") &&
        !l.includes("[Field Day]")),
  );
  if (type7DbItems.length > 0 || t7Line) {
    const list =
      type7DbItems.length > 0
        ? type7DbItems.map((i) => {
            const mode =
              i.plotActivityType === "FOLLOW_UP"
                ? "ติดตามแปลงสาธิต"
                : i.plotActivityType === "NEW"
                  ? "ทำแปลงสาธิตใหม่"
                  : i.plotActivityType
                    ? i.plotActivityType
                    : "แปลงสาธิต";
            const crop = [i.plotCropCategory, i.plotCropName]
              .filter(Boolean)
              .join(" - ");
            const size = i.plotAreaRai
              ? `${Number(i.plotAreaRai)} ไร่`
              : i.plotTreeCount
                ? `${i.plotTreeCount} ต้น`
                : "";
            const extraFields: Array<{ label: string; value: string }> = [];
            if (i.plotProductName) {
              extraFields.push({ label: "สินค้า", value: i.plotProductName });
            }
            if (size) {
              extraFields.push({ label: "ขนาดแปลง", value: size });
            }
            if (i.growthStage) {
              extraFields.push({
                label: "ระยะการเจริญเติบโต",
                value: i.growthStage,
              });
            }
            if (i.targetCondition) {
              extraFields.push({
                label: "สภาพแปลงเป้าหมาย",
                value: i.targetCondition,
              });
            }

            return {
              title: i.plotOwnerName || i.plotCropName || "แปลงสาธิต",
              subtitle: crop || undefined,
              badge: mode,
              details: i.detail || undefined,
              extraFields: extraFields.length > 0 ? extraFields : undefined,
            };
          })
        : [];
    sections.push({
      typeIndex: 7,
      title: WORK_TYPES[6],
      badge: "แปลงสาธิต",
      items: list,
      rawSummary: t7Line ? t7Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 8. จัดประชุมการเกษตร / ดีลเลอร์ ─────────────────────
  const type8DbItems = items.filter(
    (i) =>
      !isFieldDayItem(i) &&
      i.itemType !== "MARKETING_PRODUCT" &&
      i.itemType !== "SALES_PROMOTION" &&
      (i.itemType === "TYPE_8" ||
        i.meetingTopic ||
        i.meetingTargetProducts ||
        (i.meetingAttendeesCount != null && !i.storeProductName)),
  );
  const t8Line = objectiveLines.find(
    (l) =>
      l.includes("[จัดประชุม") ||
      l.includes("จัดประชุมการเกษตร") ||
      l.includes("ประชุมการเกษตร"),
  );
  if (type8DbItems.length > 0 || t8Line) {
    const list =
      type8DbItems.length > 0
        ? type8DbItems.map((i) => {
            const extraFields: Array<{ label: string; value: string }> = [];
            if (i.meetingTargetProducts) {
              const prodStr = Array.isArray(i.meetingTargetProducts)
                ? i.meetingTargetProducts.join(", ")
                : String(i.meetingTargetProducts);
              extraFields.push({ label: "สินค้าเป้าหมาย", value: prodStr });
            }
            return {
              title: i.meetingTopic || "หัวข้อประชุม",
              badge: i.meetingAttendeesCount
                ? `เป้า ${i.meetingAttendeesCount} คน`
                : undefined,
              details: i.detail || undefined,
              extraFields: extraFields.length > 0 ? extraFields : undefined,
            };
          })
        : [];
    const totalAttendees = type8DbItems.reduce(
      (sum, i) => sum + Number(i.meetingAttendeesCount || 0),
      0,
    );
    const targetCards: Array<{
      label: string;
      value: string;
      highlight?: boolean;
    }> = [];
    if (totalAttendees > 0) {
      targetCards.push({
        label: "เป้าผู้เข้าร่วมรวม",
        value: `${totalAttendees} คน`,
        highlight: true,
      });
    }
    sections.push({
      typeIndex: 8,
      title: WORK_TYPES[7],
      badge: "จัดประชุม",
      items: list,
      rawSummary: t8Line ? t8Line.replace(/^\[.*?\]\s*/, "") : undefined,
      targetCards: targetCards.length > 0 ? targetCards : undefined,
    });
  }

  // ── 9. จัดกิจกรรมส่งเสริมการขายหน้าร้าน ─────────────────
  const type9DbItems = items.filter(
    (i) =>
      !isFieldDayItem(i) &&
      i.itemType !== "MARKETING_PRODUCT" &&
      i.itemType !== "SALES_PROMOTION" &&
      i.visitTopic !== "MARKETING_PRODUCT" &&
      i.visitTopic !== "SALES_PROMOTION" &&
      (i.itemType === "TYPE_9" ||
        (i.storeProductName && !i.plotCropCategory) ||
        (i.storeTotalAmount != null && !i.plotCropCategory)),
  );
  const t9Line = objectiveLines.find(
    (l) =>
      l.includes("[กิจกรรมหน้าร้าน]") ||
      l.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน") ||
      l.includes("ส่งเสริมการขายหน้าร้าน"),
  );
  if (type9DbItems.length > 0 || t9Line) {
    const totalStoreAmount = type9DbItems.reduce(
      (sum, i) => sum + Number(i.storeTotalAmount || 0),
      0,
    );
    const list =
      type9DbItems.length > 0
        ? type9DbItems.map((i) => {
            const extraFields: Array<{ label: string; value: string }> = [];
            if (i.storeQuantityCases) {
              extraFields.push({
                label: "จำนวน",
                value: `${i.storeQuantityCases} ลัง`,
              });
            }
            if (i.storePricePerCase) {
              extraFields.push({
                label: "ราคา/ลัง",
                value: `฿${Number(i.storePricePerCase).toLocaleString()}`,
              });
            }
            if (i.targetAttendees) {
              extraFields.push({
                label: "เป้าผู้เข้าร่วม",
                value: `${i.targetAttendees} คน`,
              });
            }
            return {
              title: i.storeProductName || "สินค้าโปรโมชันหน้าร้าน",
              subtitle:
                i.customerName || i.surveyStoreName
                  ? `ร้านค้า: ${i.customerName || i.surveyStoreName}`
                  : undefined,
              amount: i.storeTotalAmount
                ? `ยอดเงิน: ฿${Number(i.storeTotalAmount).toLocaleString()}`
                : undefined,
              details: i.detail || undefined,
              extraFields: extraFields.length > 0 ? extraFields : undefined,
            };
          })
        : [];
    const targetCards: Array<{
      label: string;
      value: string;
      highlight?: boolean;
    }> = [];
    if (totalStoreAmount > 0) {
      targetCards.push({
        label: "เป้ายอดขายรวม",
        value: `฿${totalStoreAmount.toLocaleString()}`,
        highlight: true,
      });
    }
    sections.push({
      typeIndex: 9,
      title: WORK_TYPES[8],
      badge: "กิจกรรมหน้าร้าน",
      items: list,
      rawSummary: t9Line ? t9Line.replace(/^\[.*?\]\s*/, "") : undefined,
      targetCards: targetCards.length > 0 ? targetCards : undefined,
    });
  }

  // ── 10. จัดงาน Field Day ─────────────────────────────────
  const type10DbItems = items.filter(
    (i) => i.itemType === "TYPE_10" || isFieldDayItem(i),
  );
  const t10Line = objectiveLines.find(
    (l) =>
      l.includes("[Field Day]") ||
      l.includes("Field Day") ||
      l.includes("จัดงาน Field Day"),
  );
  if (type10DbItems.length > 0 || t10Line) {
    const list =
      type10DbItems.length > 0
        ? type10DbItems.map((i) => {
            const extraFields: Array<{ label: string; value: string }> = [];
            if (i.plotCropName) {
              extraFields.push({ label: "พืชเป้าหมาย", value: i.plotCropName });
            }
            if (i.plotProductName) {
              extraFields.push({ label: "สินค้าโชว์", value: i.plotProductName });
            }
            if (i.targetAttendees || i.meetingAttendeesCount) {
              extraFields.push({
                label: "เป้าผู้เข้าร่วม",
                value: `${i.targetAttendees || i.meetingAttendeesCount} คน`,
              });
            }
            if (i.targetSales || i.saleTotalPrice) {
              extraFields.push({
                label: "เป้ายอดขาย/ยอดจอง",
                value: `฿${Number(i.targetSales || i.saleTotalPrice).toLocaleString()}`,
              });
            }
            return {
              title: i.customerName || i.plotOwnerName || "งาน Field Day",
              details: i.detail || undefined,
              extraFields: extraFields.length > 0 ? extraFields : undefined,
            };
          })
        : [];
    sections.push({
      typeIndex: 10,
      title: WORK_TYPES[9],
      badge: "Field Day",
      items: list,
      rawSummary: t10Line ? t10Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  // ── 11. ตรวจเช็กสต็อกหน้าร้าน ───────────────────────────
  const type11DbItems = items.filter(
    (i) =>
      !isFieldDayItem(i) &&
      (i.itemType === "TYPE_11" ||
        i.targetOpportunity ||
        (i.detail && i.detail.includes("ตรวจเช็กสต็อกหน้าร้าน"))),
  );
  const t11Line = objectiveLines.find(
    (l) =>
      l.includes("[ตรวจเช็กสต็อก") ||
      l.includes("ตรวจเช็กสต็อกหน้าร้าน") ||
      l.includes("เช็กสต็อก"),
  );
  if (type11DbItems.length > 0 || t11Line) {
    const list =
      type11DbItems.length > 0
        ? type11DbItems.map((i) => {
            const extraFields: Array<{ label: string; value: string }> = [];
            if (i.targetOpportunity)
              extraFields.push({
                label: "โอกาสสั่งซื้อ",
                value: i.targetOpportunity,
              });
            return {
              title: i.customerName || "ร้านค้าที่ตรวจเช็ก",
              details: i.detail || undefined,
              extraFields: extraFields.length > 0 ? extraFields : undefined,
            };
          })
        : [];
    sections.push({
      typeIndex: 11,
      title: WORK_TYPES[10],
      badge: "เช็กสต็อก",
      items: list,
      rawSummary: t11Line ? t11Line.replace(/^\[.*?\]\s*/, "") : undefined,
    });
  }

  return sections;
}

// ────────────────────────────────────────────────────────
// Helper function to extract promotional media from plan
// ────────────────────────────────────────────────────────
function extractMarketingProducts(
  plan: ActivityPlanWithRelations,
): MarketingProductDetail[] {
  const items = (plan.items as any[]) || [];

  // (A) From DB items with MARKETING_PRODUCT type
  const dbMkt = items.filter(
    (i) =>
      i.itemType === "MARKETING_PRODUCT" ||
      i.visitTopic === "MARKETING_PRODUCT",
  );
  if (dbMkt.length > 0) {
    return dbMkt.map((i) => ({
      category: i.plotCropCategory || i.category || "สื่อส่งเสริมการขาย",
      productName:
        i.storeProductName ||
        i.productName ||
        i.customerName ||
        "สื่อส่งเสริมการขาย",
      quantity: Number(i.storeQuantityCases || i.quantityCases || 1),
      unit: i.plotCropName || i.unit || "ชิ้น",
      pricePerUnit: Number(i.storePricePerCase || i.pricePerCase || 0),
      totalAmount: Number(
        i.storeTotalAmount ||
          (i.storeQuantityCases || i.quantityCases || 1) *
            (i.storePricePerCase || i.pricePerCase || 0),
      ),
    }));
  }

  // (B) From description text block
  const desc = plan.description || "";
  const match = desc.match(/\[สื่อส่งเสริมการขาย\]\s*([\s\S]*?)(?=\n\n\[|$)/);
  if (match && match[1]) {
    const lines = match[1]
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return lines.map((line) => {
      const catMatch = line.match(/\[(.*?)\]/);
      const category = catMatch ? catMatch[1] : "สื่อส่งเสริมการขาย";
      const cleanLine = line.replace(/^\d+\.\s*/, "").replace(/\[.*?\]\s*/, "");
      return {
        category,
        productName: cleanLine,
        quantity: 1,
        unit: "ชิ้น",
        pricePerUnit: 0,
        totalAmount: 0,
      };
    });
  }
  return [];
}

// ────────────────────────────────────────────────────────
// Helper function to extract sales promotions from plan
// ────────────────────────────────────────────────────────
function extractSalesPromotions(
  plan: ActivityPlanWithRelations,
): SalesPromotionDetail[] {
  const items = (plan.items as any[]) || [];

  // (A) From DB items with SALES_PROMOTION type
  const dbSp = items.filter(
    (i) =>
      i.itemType === "SALES_PROMOTION" || i.visitTopic === "SALES_PROMOTION",
  );
  if (dbSp.length > 0) {
    return dbSp.map((i) => ({
      budgetType: i.plotCropCategory || i.budgetType || "งบส่งเสริมการขาย",
      detail: i.detail || i.storeProductName || "รายการส่งเสริมการขาย",
      amount: Number(i.collectAmount || i.storeTotalAmount || i.amount || 0),
    }));
  }

  // (B) From description text block
  const desc = plan.description || "";
  const match = desc.match(/\[รายการส่งเสริมการขาย\]\s*([\s\S]*?)(?=\n\n\[|$)/);
  if (match && match[1]) {
    const lines = match[1]
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return lines.map((line) => {
      const catMatch = line.match(/\[(.*?)\]/);
      const budgetType = catMatch ? catMatch[1] : "งบการตลาด";
      const amountMatch = line.match(/฿([\d,]+)/);
      const amount = amountMatch
        ? parseFloat(amountMatch[1].replace(/,/g, ""))
        : 0;
      const detail = line
        .replace(/^\d+\.\s*/, "")
        .replace(/\[.*?\]\s*/, "")
        .replace(/-\s*฿[\d,]+/, "")
        .trim();
      return {
        budgetType,
        detail,
        amount,
      };
    });
  }
  return [];
}

// ────────────────────────────────────────────────────────
// Helper function to extract general material requisitions
// ────────────────────────────────────────────────────────
function extractRequisitions(
  plan: ActivityPlanWithRelations,
): RequisitionDetail[] {
  const items = (plan.items as any[]) || [];

  // (A) From DB items with REQUISITION type
  const dbReq = items.filter(
    (i) =>
      i.itemType === "REQUISITION" ||
      i.itemType === "REQUISITION_ITEM" ||
      i.visitTopic === "REQUISITION",
  );
  if (dbReq.length > 0) {
    return dbReq.map((i) => ({
      productName:
        i.productName || i.storeProductName || i.customerName || "รายการเบิก",
      quantity: Number(i.quantity || i.storeQuantityCases || 1),
      unit: i.unit || i.plotCropName || "รายการ",
      detail: i.detail || "",
    }));
  }

  // (B) From description text block
  const desc = plan.description || "";
  const match = desc.match(/\[รายการขอเบิกสินค้า\]\s*([\s\S]*?)(?=\n\n\[|$)/);
  if (match && match[1]) {
    const lines = match[1]
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return lines.map((line) => ({
      productName: line.replace(/^\d+\.\s*/, ""),
      quantity: 1,
      unit: "รายการ",
      detail: "",
    }));
  }
  return [];
}
