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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/custom/page-header";
import { DetailItem } from "@/components/custom/detail-item";
import { ActivityStatusBadge } from "../../ui/activity-status-badge";
import type {
  ActivityPlanWithRelations,
  ActivityStatus,
  ActivityHelperStatus,
  ActivityApprovalStep,
} from "../../types";
import {
  getActivityPlanAction,
  approveActivityPlanAction,
  rejectActivityPlanAction,
  requestCorrectionPlanAction,
  cancelActivityPlanAction,
} from "../../server/actions";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
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
    return <div className="p-6 text-center">กำลังโหลดข้อมูล...</div>;
  }

  if (error || !plan) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertDescription>{error || "ไม่พบ Trip Plan"}</AlertDescription>
      </Alert>
    );
  }

  // ────────────────────────────────────────────────────────
  // Check if current user is an approver at the current state
  // ────────────────────────────────────────────────────────
  const userEmployeeId = session?.user?.employeeId;

  let canApproveThisStep = false;
  let approvalPrompt = "";

  if (plan.status === "PENDING_LINE_APPROVAL") {
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
  const marketingVal = plan.marketingBudgetRequested ? Number(plan.marketingBudgetRequested) : 0;
  const budgetTotal = salesPromoVal + marketingVal;

  return (
    <section className="space-y-6 p-6 pb-24 md:pb-8 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/activity-plans")}
            className="rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader
            title="รายละเอียด Trip Plan"
            description="รายละเอียด Trip Plan สถานะการอนุมัติ และบันทึกประวัติการดำเนินการทั้งหมด"
          />
        </div>
        <Button
          onClick={() => router.push(`/activity-plans/${plan.id}/actual`)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
        >
          <ClipboardList className="h-4 w-4" />
          บันทึกผลปฏิบัติงาน (Actual)
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Grid: Details + Timeline */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: General Info (Col span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  ชื่อแผนงานกิจกรรม
                </span>
                <h2 className="text-xl font-bold text-slate-800 mt-0.5">
                  {plan.title}
                </h2>
              </div>
              <ActivityStatusBadge status={plan.status} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <DetailItem
                label="เลขที่แผน"
                value={plan.code || plan.id}
                icon={<FileText className="h-4 w-4 text-blue-500" />}
              />
              <DetailItem
                label="ผู้จัดทำ"
                value={`${plan.employee.name} (${plan.employee.positionTitle || "ไม่ระบุตำแหน่ง"})`}
                icon={<User className="h-4 w-4" />}
              />
              <DetailItem
                label="ประเภทกิจกรรม"
                value={typeof plan.activityType === "object" ? plan.activityType?.name || plan.activityType?.code : (plan.activityType || "ไม่ระบุ")}
                icon={<FileText className="h-4 w-4" />}
              />
              <DetailItem
                label="ช่วงวันเวลาจัดงาน"
                value={`${format(new Date(plan.startDate), "dd MMM yyyy HH:mm", { locale: th })} ถึง ${format(new Date(plan.endDate), "dd MMM yyyy HH:mm", { locale: th })}`}
                icon={<Calendar className="h-4 w-4" />}
              />
              <DetailItem
                label="สถานที่ / พื้นที่จัดกิจกรรม"
                value={plan.location}
                icon={<MapPin className="h-4 w-4" />}
              />
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  เป้าหมายกิจกรรม
                </h4>
                <p className="text-sm text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                  {plan.objective}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  รายละเอียดกิจกรรม
                </h4>
                <p className="text-sm text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                  {plan.description}
                </p>
              </div>

              {plan.notes && (
                <div>
                  <h4 className="text-sm font-bold text-slate-700">
                    หมายเหตุเพิ่มเติม
                  </h4>
                  <p className="text-sm text-slate-500 mt-1 whitespace-pre-line italic">
                    "{plan.notes}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section: Budget Information */}
          <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              งบประมาณที่ต้องการใช้
            </h3>
            {budgetTotal === 0 ? (
              <p className="text-sm text-slate-400 italic">
                ไม่มีความจำเป็นต้องใช้วงเงินงบประมาณในกิจกรรมนี้
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div
                  className={cn(
                    "p-4 rounded-xl border border-dashed flex justify-between items-center",
                    salesPromoVal > 0
                      ? "bg-blue-50/50 border-blue-100"
                      : "bg-slate-50/50 border-slate-100",
                  )}
                >
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">
                      งบส่งเสริมการขาย
                    </span>
                    <span className="text-lg font-bold text-slate-800 mt-1 block">
                      {new Intl.NumberFormat("th-TH", {
                        style: "currency",
                        currency: "THB",
                        maximumFractionDigits: 0,
                      }).format(salesPromoVal)}
                    </span>
                  </div>
                  {salesPromoVal > 0 && (
                    <span
                      className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        plan.salesPromotionApproved
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700",
                      )}
                    >
                      {plan.salesPromotionApproved
                        ? "อนุมัติแล้ว"
                        : "รออนุมัติ"}
                    </span>
                  )}
                </div>

                <div
                  className={cn(
                    "p-4 rounded-xl border border-dashed flex justify-between items-center",
                    marketingVal > 0
                      ? "bg-purple-50/50 border-purple-100"
                      : "bg-slate-50/50 border-slate-100",
                  )}
                >
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">
                      งบการตลาด
                    </span>
                    <span className="text-lg font-bold text-slate-800 mt-1 block">
                      {new Intl.NumberFormat("th-TH", {
                        style: "currency",
                        currency: "THB",
                        maximumFractionDigits: 0,
                      }).format(marketingVal)}
                    </span>
                  </div>
                  {marketingVal > 0 && (
                    <span
                      className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full",
                        plan.marketingApproved
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700",
                      )}
                    >
                      {plan.marketingApproved ? "อนุมัติแล้ว" : "รออนุมัติ"}
                    </span>
                  )}
                </div>

                {plan.status === "PENDING_BUDGET_APPROVAL" && (
                  <div className="md:col-span-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex items-center gap-2 text-xs text-blue-700">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>
                      สถานะงบประมาณส่วนกลาง:{" "}
                      <strong>
                        {plan.salesManagerApproved
                          ? "อนุมัติผ่านงบฝ่ายขายแล้ว"
                          : "รอผู้จัดการฝ่ายขายอนุมัติปิดท้ายงบประมาณภาพรวม"}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section: Helpers List */}
          <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              พนักงานเข้าร่วมช่วยงาน ({plan.helpers.length} คน)
            </h3>
            {plan.helpers.length === 0 ? (
              <p className="text-sm text-slate-400 italic">
                ไม่มีพนักงานช่วยงานเพิ่มเติมในทริปนี้
              </p>
            ) : (
              <div className="divide-y border rounded-xl overflow-hidden bg-slate-50/30">
                {plan.helpers.map((helper) => (
                  <div
                    key={helper.id}
                    className="p-3.5 flex justify-between items-center text-sm"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 block">
                        {helper.employee.name}
                      </span>
                      <span className="text-xs text-slate-500 mt-0.5 block">
                        ตำแหน่ง: {helper.employee.positionTitle || "ไม่ระบุ"} |
                        แผนก: {helper.employee.departmentName || "ไม่ระบุ"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm",
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
                        {helper.status === "REJECTED" && "ปฏิเสธ/ติดขัด"}
                      </span>
                      {helper.rejectionReason && (
                        <span
                          className="text-xs text-red-500 font-medium max-w-[150px] truncate"
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

        {/* Right Column: Approval Log Timeline & Actions (Col span 1) */}
        <div className="space-y-6">
          {/* Approval Action Panel */}
          {canApproveThisStep && (
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 border-2 border-blue-100 shadow-md space-y-4">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                <ShieldCheck className="h-5 w-5" />
                <span>ดำเนินการพิจารณาแผนงาน</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed bg-blue-50/50 p-2.5 rounded-lg border border-blue-50">
                {approvalPrompt}
              </p>
              <textarea
                placeholder="กรอกเหตุผลอนุมัติ, ตีกลับแก้ไข, หรือรายละเอียดเพิ่มเติม..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full text-sm rounded-lg border border-slate-200 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
              <div className="grid gap-2 grid-cols-2">
                <Button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold col-span-2 flex items-center gap-1.5"
                >
                  <CheckCircle className="h-4 w-4" />
                  อนุมัติผ่านแผนงาน
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRequestCorrection}
                  disabled={submitting || !comment.trim()}
                  className="text-amber-600 border-amber-200 hover:bg-amber-50 font-semibold flex items-center gap-1.5"
                  title={
                    !comment.trim()
                      ? "กรุณากรอกเหตุผลด้านบนเพื่อตีกลับแก้ไข"
                      : ""
                  }
                >
                  <RotateCcw className="h-4 w-4" />
                  ตีกลับแก้ไข
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={submitting}
                  className="font-semibold flex items-center gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  ปฏิเสธแผนงาน
                </Button>
              </div>
            </div>
          )}

          {/* Cancellation Option for Creator */}
          {plan.createdById === session?.user?.id &&
            plan.status !== "APPROVED" &&
            plan.status !== "REJECTED" &&
            plan.status !== "CANCELLED" && (
              <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <Button
                  variant="outline"
                  onClick={handleCancelPlan}
                  disabled={submitting}
                  className="w-full text-red-600 border-red-100 hover:bg-red-50 font-semibold"
                >
                  ยกเลิกแผนกิจกรรมนี้
                </Button>
              </div>
            )}

          {/* Timeline Logs */}
          <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              ประวัติความคืบหน้า (Log)
            </h3>

            <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
              {plan.approvalLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  ไม่มีข้อมูลบันทึกในประวัติ
                </p>
              ) : (
                plan.approvalLogs.map((log) => {
                  let badgeColor = "bg-slate-400";
                  if (log.action === "APPROVE") badgeColor = "bg-green-500";
                  if (log.action === "REJECT") badgeColor = "bg-red-500";
                  if (log.action === "REQUEST_CORRECTION")
                    badgeColor = "bg-amber-500";
                  if (log.action === "SUBMIT") badgeColor = "bg-blue-500";

                  let actionText = log.action as string;
                  if (log.action === "SUBMIT") actionText = "ยื่นคำขออนุมัติ";
                  if (log.action === "APPROVE") actionText = "อนุมัติแล้ว";
                  if (log.action === "REJECT") actionText = "ปฏิเสธ/ยกเลิก";
                  if (log.action === "REQUEST_CORRECTION")
                    actionText = "ขอข้อมูลเพิ่มเติม/ตีกลับ";
                  if (log.action === "CANCEL") actionText = "ยกเลิกคำขอ";

                  let stepText = log.step as string;
                  if (log.step === "LINE_APPROVAL") stepText = "ตรวจสอบสายงาน";
                  if (log.step === "BUDGET_APPROVAL")
                    stepText = "อนุมัติงบประมาณ";
                  if (log.step === "HELPER_APPROVAL")
                    stepText = "อนุมัติคนช่วยงาน";

                  return (
                    <div key={log.id} className="relative text-xs">
                      {/* Timeline node */}
                      <span
                        className={cn(
                          "absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white ring-2 ring-slate-100",
                          badgeColor,
                        )}
                      />

                      <div className="flex justify-between items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {actionText}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {format(new Date(log.createdAt), "dd MMM HH:mm", {
                            locale: th,
                          })}
                        </span>
                      </div>

                      <div className="text-slate-500 mt-1 font-medium">
                        ขั้นตอน: {stepText} | โดย: {log.user.name}
                      </div>

                      {log.comment && (
                        <div className="mt-1.5 p-2 bg-slate-50 rounded-lg text-slate-600 border border-slate-100 font-medium">
                          หมายเหตุ: {log.comment}
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
