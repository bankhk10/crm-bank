"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Target,
  FileText,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  RotateCcw,
  Clock,
  ShieldCheck,
  User,
  Briefcase,
  BadgeCheck,
  AlertTriangle,
  MessageSquare,
  ChevronRight,
  Layers,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ActivityStatusBadge } from "../../ui/activity-status-badge";
import type { ActivityPlanWithRelations } from "../../types";
import {
  getActivityPlanAction,
  approveActivityPlanAction,
  rejectActivityPlanAction,
  requestCorrectionPlanAction,
} from "../../server/actions";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
}

// ─── Log action config ────────────────────────────────────────────────────────
const LOG_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  APPROVE: {
    label: "อนุมัติแล้ว",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  REJECT: {
    label: "ปฏิเสธ/ยกเลิก",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  REQUEST_CORRECTION: {
    label: "ตีกลับแก้ไข",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  SUBMIT: {
    label: "ยื่นคำขออนุมัติ",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  CANCEL: {
    label: "ยกเลิกคำขอ",
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
};

const STEP_LABELS: Record<string, string> = {
  LINE_APPROVAL: "ตรวจสอบสายงาน",
  BUDGET_APPROVAL: "อนุมัติงบประมาณ",
  HELPER_APPROVAL: "อนุมัติคนช่วยงาน",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionCard({
  title,
  icon,
  iconBg,
  children,
  badge,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
              iconBg,
            )}
          >
            {icon}
          </div>
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        </div>
        {badge}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function WorkTypeBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 rounded-lg px-2.5 py-1">
      <ChevronRight className="h-3 w-3" />
      {label}
    </span>
  );
}

function BudgetCard({
  label,
  amount,
  approved,
  colorClass,
}: {
  label: string;
  amount: number;
  approved?: boolean;
  colorClass: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-2",
        amount > 0 ? colorClass : "bg-slate-50 border-slate-100",
      )}
    >
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </div>
      <div className="text-xl font-bold text-slate-800">
        {amount > 0
          ? new Intl.NumberFormat("th-TH", {
              style: "currency",
              currency: "THB",
              maximumFractionDigits: 0,
            }).format(amount)
          : "ไม่มีงบประมาณ"}
      </div>
      {amount > 0 && (
        <div
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-0.5",
            approved
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700",
          )}
        >
          {approved ? (
            <>
              <BadgeCheck className="h-3 w-3" /> อนุมัติแล้ว
            </>
          ) : (
            <>
              <Clock className="h-3 w-3" /> รออนุมัติ
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ActivityPlanApproveDetailView({ id }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [plan, setPlan] = useState<ActivityPlanWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await getActivityPlanAction(id);
      if (res.success && res.plan) {
        setPlan(res.plan);
      } else {
        setError(res.error || "ไม่สามารถดึงข้อมูล Trip Plan ได้");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  // ── Permission Logic ──────────────────────────────────────────────────────
  const userEmployeeId = session?.user?.employeeId;
  const userPermissions = session?.user?.permissionKeys ?? [];

  let canApproveThisStep = false;
  let approvalContext = "";
  let approvalContextIcon: React.ReactNode = null;

  if (plan) {
    if (plan.status === "PENDING_LINE_APPROVAL") {
      canApproveThisStep = userEmployeeId === plan.currentApproverId;
      approvalContext =
        "คุณคือหัวหน้างานในสายการอนุมัติ Trip Plan นี้ กรุณาตรวจสอบรายละเอียดทั้งหมดก่อนตัดสินใจ";
      approvalContextIcon = <ShieldCheck className="h-4 w-4 text-yellow-500" />;
    } else if (plan.status === "PENDING_BUDGET_APPROVAL") {
      const canApproveBudget =
        userPermissions.includes("activity.approve") ||
        userPermissions.includes("activity.manage");
      if (canApproveBudget) {
        canApproveThisStep = true;
        approvalContext =
          "คุณมีสิทธิ์อนุมัติงบประมาณในแผนกิจกรรมนี้ กรุณาตรวจสอบรายการงบประมาณก่อนตัดสินใจ";
        approvalContextIcon = (
          <DollarSign className="h-4 w-4 text-emerald-500" />
        );
      }
    } else if (plan.status === "PENDING_HELPER_APPROVAL") {
      const isHelperManager = plan.helpers.some(
        (h) =>
          h.employeeId === userEmployeeId || h.approvedById === userEmployeeId,
      );
      if (isHelperManager || userPermissions.includes("activity.manage")) {
        canApproveThisStep = true;
        approvalContext =
          "คุณคือผู้จัดการแผนกของพนักงานช่วยงาน กรุณาพิจารณาการเข้าร่วมของพนักงานในสังกัดของคุณ";
        approvalContextIcon = <Users className="h-4 w-4 text-purple-500" />;
      }
    }
  }

  // ── Action Handlers ───────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!plan) return;
    setSubmitting(true);
    setError(null);
    setActionSuccess(null);
    try {
      const res = await approveActivityPlanAction(
        plan.id,
        comment || undefined,
      );
      if (res.success) {
        setComment("");
        setActionSuccess("✅ อนุมัติ Trip Plan เรียบร้อยแล้ว");
        await loadData();
      } else {
        setError(res.error || "เกิดข้อผิดพลาดในการอนุมัติ");
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!plan) return;
    if (!comment.trim()) {
      setError("⚠️ กรุณาระบุเหตุผลในการปฏิเสธ (บังคับกรอก)");
      return;
    }
    setSubmitting(true);
    setError(null);
    setActionSuccess(null);
    try {
      const res = await rejectActivityPlanAction(plan.id, comment);
      if (res.success) {
        setComment("");
        setActionSuccess("❌ ปฏิเสธ Trip Plan เรียบร้อยแล้ว");
        await loadData();
      } else {
        setError(res.error || "เกิดข้อผิดพลาดในการปฏิเสธ");
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestCorrection = async () => {
    if (!plan) return;
    if (!comment.trim()) {
      setError("⚠️ กรุณาระบุสิ่งที่ต้องแก้ไข (บังคับกรอก)");
      return;
    }
    setSubmitting(true);
    setError(null);
    setActionSuccess(null);
    try {
      const res = await requestCorrectionPlanAction(plan.id, comment);
      if (res.success) {
        setComment("");
        setActionSuccess("🔄 ส่งตีกลับแก้ไขเรียบร้อยแล้ว");
        await loadData();
      } else {
        setError(res.error || "เกิดข้อผิดพลาดในการตีกลับ");
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / Error States ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto animate-pulse">
            <ShieldCheck className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-sm text-slate-500 font-medium">
            กำลังโหลดข้อมูลแผนกิจกรรม...
          </p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertDescription>{error || "ไม่พบ Trip Plan"}</AlertDescription>
      </Alert>
    );
  }

  // ── Computed Values ───────────────────────────────────────────────────────
  const salesPromoVal = plan.salesPromotionBudget
    ? Number(plan.salesPromotionBudget)
    : 0;
  const marketingVal = plan.marketingBudget ? Number(plan.marketingBudget) : 0;
  const budgetTotal = salesPromoVal + marketingVal;
  const workTypes = plan.activityType
    ? plan.activityType.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const startDate = new Date(plan.startDate);
  const endDate = new Date(plan.endDate);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/activity-plans/approvals")}
              className="rounded-xl flex-shrink-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 font-medium">
                คิวอนุมัติ Trip Plan
              </p>
              <h1
                className="text-sm font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs md:max-w-md"
                title={plan.title}
              >
                {plan.title}
              </h1>
            </div>
          </div>
          <ActivityStatusBadge status={plan.status} />
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-10 space-y-5">

        {/* Notification Banners */}
        {actionSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 font-semibold flex items-center gap-2 shadow-sm animate-in fade-in-0 slide-in-from-top-2">
            <BadgeCheck className="h-4 w-4 flex-shrink-0 text-green-600" />
            {actionSuccess}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800 font-semibold flex items-center gap-2 shadow-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
            {error}
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid gap-5 lg:grid-cols-3">

          {/* LEFT: Plan Details */}
          <div className="lg:col-span-2 space-y-5">

            {/* Hero card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 pt-5 pb-8">
                <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
                  แผนกิจกรรม (Trip Plan)
                </p>
                <h2 className="text-white text-xl font-bold leading-tight">
                  {plan.title}
                </h2>
                {plan.code && (
                  <p className="text-blue-200 text-xs mt-1 font-mono">
                    #{plan.code}
                  </p>
                )}
              </div>
              {/* Meta grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y border-t border-slate-100">
                {[
                  {
                    icon: <User className="h-3.5 w-3.5 text-slate-400" />,
                    label: "ผู้จัดทำ",
                    value: plan.employee.name,
                  },
                  {
                    icon: <Briefcase className="h-3.5 w-3.5 text-slate-400" />,
                    label: "ตำแหน่ง",
                    value: plan.employee.positionTitle || "ไม่ระบุ",
                  },
                  {
                    icon: <Calendar className="h-3.5 w-3.5 text-slate-400" />,
                    label: "วันที่เริ่ม",
                    value: format(startDate, "d MMM yyyy HH:mm", {
                      locale: th,
                    }),
                  },
                  {
                    icon: <Calendar className="h-3.5 w-3.5 text-slate-400" />,
                    label: "วันที่สิ้นสุด",
                    value: format(endDate, "d MMM yyyy HH:mm", { locale: th }),
                  },
                ].map((item, i) => (
                  <div key={i} className="p-3.5 space-y-0.5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      {item.icon}
                      {item.label}
                    </div>
                    <div className="text-xs font-semibold text-slate-800 leading-snug">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ประเภทงาน */}
            <SectionCard
              title="ประเภทงาน"
              icon={<Layers className="h-4 w-4 text-blue-500" />}
              iconBg="bg-blue-50"
              badge={
                <span className="text-xs bg-blue-100 text-blue-700 font-bold rounded-lg px-2.5 py-1">
                  {workTypes.length} ประเภท
                </span>
              }
            >
              {workTypes.length === 0 ? (
                <p className="text-sm text-slate-400 italic">ไม่ระบุประเภทงาน</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {workTypes.map((wt) => (
                    <WorkTypeBadge key={wt} label={wt} />
                  ))}
                </div>
              )}
            </SectionCard>

            {/* สถานที่และทีม */}
            <SectionCard
              title="สถานที่และทีมงาน"
              icon={<MapPin className="h-4 w-4 text-rose-500" />}
              iconBg="bg-rose-50"
            >
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  สถานที่ / พื้นที่จัดกิจกรรม
                </p>
                <p className="text-sm font-medium text-slate-800">
                  {plan.location || (
                    <span className="text-slate-400 italic font-normal">ไม่ระบุ</span>
                  )}
                </p>
              </div>

              {plan.helpers.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    พนักงานช่วยงาน ({plan.helpers.length} คน)
                  </p>
                  <div className="divide-y border rounded-xl overflow-hidden">
                    {plan.helpers.map((helper) => (
                      <div
                        key={helper.id}
                        className="flex items-center justify-between gap-3 px-3.5 py-3"
                      >
                        <div>
                          <span className="font-semibold text-slate-800 text-sm block">
                            {helper.employee.name}
                          </span>
                          <span className="text-xs text-slate-400">
                            {helper.employee.positionTitle || "ไม่ระบุตำแหน่ง"}{" "}
                            · {helper.employee.departmentName || "ไม่ระบุแผนก"}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-xs font-semibold rounded-full px-2.5 py-0.5 flex-shrink-0",
                            helper.status === "APPROVED" &&
                              "bg-green-100 text-green-700",
                            helper.status === "PENDING" &&
                              "bg-yellow-100 text-yellow-700",
                            helper.status === "REJECTED" &&
                              "bg-red-100 text-red-700",
                          )}
                        >
                          {helper.status === "APPROVED" && "อนุมัติแล้ว"}
                          {helper.status === "PENDING" && "รออนุมัติ"}
                          {helper.status === "REJECTED" && "ปฏิเสธ"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>

            {/* วัตถุประสงค์ */}
            <SectionCard
              title="วัตถุประสงค์กิจกรรม"
              icon={<Target className="h-4 w-4 text-amber-500" />}
              iconBg="bg-amber-50"
            >
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {plan.objective || (
                  <span className="text-slate-400 italic">
                    ไม่ระบุวัตถุประสงค์
                  </span>
                )}
              </p>
            </SectionCard>

            {/* รายละเอียด */}
            <SectionCard
              title="รายละเอียดกิจกรรม"
              icon={<FileText className="h-4 w-4 text-slate-500" />}
              iconBg="bg-slate-100"
            >
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {plan.description || (
                  <span className="text-slate-400 italic">
                    ไม่ระบุรายละเอียด
                  </span>
                )}
              </p>
              {plan.notes && (
                <div className="mt-4 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-xs font-semibold text-amber-700 mb-1">
                    หมายเหตุเพิ่มเติม
                  </p>
                  <p className="text-sm text-amber-800 italic whitespace-pre-line leading-relaxed">
                    &ldquo;{plan.notes}&rdquo;
                  </p>
                </div>
              )}
            </SectionCard>

            {/* งบประมาณ */}
            <SectionCard
              title="งบประมาณที่ต้องการใช้"
              icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
              iconBg="bg-emerald-50"
              badge={
                budgetTotal > 0 ? (
                  <span className="text-xs bg-emerald-100 text-emerald-700 font-bold rounded-lg px-2.5 py-1">
                    รวม{" "}
                    {new Intl.NumberFormat("th-TH", {
                      style: "currency",
                      currency: "THB",
                      maximumFractionDigits: 0,
                    }).format(budgetTotal)}
                  </span>
                ) : undefined
              }
            >
              {budgetTotal === 0 ? (
                <div className="flex items-center gap-2 text-sm text-slate-400 italic">
                  <CreditCard className="h-4 w-4" />
                  ไม่มีความจำเป็นต้องใช้วงเงินงบประมาณในกิจกรรมนี้
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <BudgetCard
                    label="งบส่งเสริมการขาย"
                    amount={salesPromoVal}
                    approved={plan.salesPromotionApproved ?? false}
                    colorClass="bg-blue-50 border-blue-200"
                  />
                  <BudgetCard
                    label="งบการตลาด"
                    amount={marketingVal}
                    approved={plan.marketingApproved ?? false}
                    colorClass="bg-purple-50 border-purple-200"
                  />
                  {plan.status === "PENDING_BUDGET_APPROVAL" && (
                    <div className="sm:col-span-2 flex items-center gap-2 text-xs text-blue-700 bg-blue-50/80 border border-blue-100 rounded-xl p-3">
                      <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                      <span>
                        สถานะส่วนกลาง:{" "}
                        <strong>
                          {plan.salesManagerApproved
                            ? "ผ่านการอนุมัติงบฝ่ายขายแล้ว"
                            : "รอผู้จัดการฝ่ายขายอนุมัติงบประมาณภาพรวม"}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>
          </div>

          {/* RIGHT: Action Panel + Progress + Timeline */}
          <div className="space-y-5">

            {/* Action Panel */}
            {canApproveThisStep ? (
              <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <ShieldCheck className="h-5 w-5" />
                    ดำเนินการพิจารณาแผนงาน
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 leading-relaxed">
                    {approvalContextIcon}
                    <span>{approvalContext}</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                      ความเห็น / เหตุผลประกอบการพิจารณา
                    </label>
                    <textarea
                      id="approval-comment"
                      placeholder={`กรอกความเห็น หรือเหตุผลประกอบการตัดสินใจ...\n(บังคับกรอกเมื่อตีกลับหรือปฏิเสธ)`}
                      value={comment}
                      onChange={(e) => {
                        setComment(e.target.value);
                        if (error) setError(null);
                      }}
                      rows={4}
                      disabled={submitting}
                      className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                    />
                    {comment.length > 0 && (
                      <p className="text-right text-[10px] text-slate-400">
                        {comment.length} ตัวอักษร
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {/* Approve */}
                    <button
                      id="btn-approve"
                      type="button"
                      onClick={handleApprove}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-bold rounded-xl h-11 shadow-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {submitting ? "กำลังดำเนินการ..." : "✅ อนุมัติผ่านแผนงาน"}
                    </button>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <div className="h-px flex-1 bg-slate-100" />
                      หรือ
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>

                    {/* Request Correction */}
                    <button
                      id="btn-request-correction"
                      type="button"
                      onClick={handleRequestCorrection}
                      disabled={submitting || !comment.trim()}
                      title={
                        !comment.trim()
                          ? "กรุณากรอกความเห็นก่อนตีกลับ"
                          : undefined
                      }
                      className="w-full flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 text-sm font-semibold rounded-xl h-10 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="h-4 w-4" />
                      🔄 ตีกลับแก้ไข
                    </button>

                    {/* Reject */}
                    <button
                      id="btn-reject"
                      type="button"
                      onClick={handleReject}
                      disabled={submitting || !comment.trim()}
                      title={
                        !comment.trim()
                          ? "กรุณากรอกความเห็นก่อนปฏิเสธ"
                          : undefined
                      }
                      className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-sm font-semibold rounded-xl h-10 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <XCircle className="h-4 w-4" />
                      ❌ ปฏิเสธแผนงาน
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                    การตีกลับและปฏิเสธจำเป็นต้องกรอกความเห็นก่อนกดปุ่ม
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
                  <ShieldCheck className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-600">
                  ไม่มีการดำเนินการในขณะนี้
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  สถานะแผนงานไม่อยู่ในขั้นตอนที่คุณต้องดำเนินการ
                  หรือคุณไม่ใช่ผู้รับผิดชอบขั้นตอนนี้
                </p>
              </div>
            )}

            {/* Approval Chain Progress */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-indigo-500" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  สถานะขั้นตอนอนุมัติ
                </h3>
              </div>
              <div className="p-5 space-y-1">
                {[
                  {
                    label: "1. ตรวจสอบสายงาน",
                    done:
                      plan.status !== "PENDING_LINE_APPROVAL" &&
                      plan.status !== "DRAFT",
                    current: plan.status === "PENDING_LINE_APPROVAL",
                    skip: false,
                  },
                  {
                    label: "2. อนุมัติงบประมาณ",
                    done:
                      plan.status === "PENDING_HELPER_APPROVAL" ||
                      plan.status === "APPROVED",
                    current: plan.status === "PENDING_BUDGET_APPROVAL",
                    skip: budgetTotal === 0,
                  },
                  {
                    label: "3. อนุมัติคนช่วยงาน",
                    done: plan.status === "APPROVED",
                    current: plan.status === "PENDING_HELPER_APPROVAL",
                    skip: plan.helpers.length === 0,
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-3 py-2 text-sm",
                      s.skip && "opacity-40",
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-white",
                        s.done && "bg-green-500",
                        s.current && "bg-blue-500 animate-pulse",
                        !s.done && !s.current && "bg-slate-200",
                      )}
                    >
                      {s.done && (
                        <CheckCircle className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "font-medium",
                        s.current && "text-blue-700 font-bold",
                        s.done && "text-green-700",
                        !s.done && !s.current && "text-slate-400",
                      )}
                    >
                      {s.label}
                      {s.skip && (
                        <span className="text-xs text-slate-400 font-normal ml-1">
                          (ข้าม)
                        </span>
                      )}
                      {s.current && (
                        <span className="text-xs ml-1 text-blue-500 font-normal">
                          (กำลังรออนุมัติ)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Log */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-slate-500" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  ประวัติดำเนินการ
                </h3>
              </div>
              <div className="p-5">
                {plan.approvalLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-2">
                    ยังไม่มีบันทึกในประวัติ
                  </p>
                ) : (
                  <div className="relative pl-5 border-l-2 border-slate-100 space-y-5">
                    {[...plan.approvalLogs].reverse().map((log) => {
                      const cfg =
                        LOG_CONFIG[log.action as string] || LOG_CONFIG.SUBMIT;
                      const stepLabel =
                        STEP_LABELS[log.step as string] || log.step;
                      return (
                        <div key={log.id} className="relative text-xs">
                          <span
                            className={cn(
                              "absolute -left-[25px] top-1 h-3 w-3 rounded-full border-2 border-white ring-2 ring-slate-100",
                              cfg.dot,
                            )}
                          />
                          <div className="flex justify-between items-start gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 font-bold rounded-md px-2 py-0.5 border text-[10px]",
                                cfg.bg,
                                cfg.color,
                                cfg.border,
                              )}
                            >
                              {cfg.label}
                            </span>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">
                              {format(new Date(log.createdAt), "d MMM HH:mm", {
                                locale: th,
                              })}
                            </span>
                          </div>
                          <div className="text-slate-500 mt-1.5 font-medium">
                            {stepLabel && (
                              <span className="text-slate-400">
                                ขั้นตอน:{" "}
                                <span className="text-slate-600">
                                  {stepLabel}
                                </span>{" "}
                                ·{" "}
                              </span>
                            )}
                            โดย:{" "}
                            <span className="text-slate-700 font-semibold">
                              {log.user.name}
                            </span>
                          </div>
                          {log.comment && (
                            <div className="mt-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-600 leading-relaxed">
                              &ldquo;{log.comment}&rdquo;
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
