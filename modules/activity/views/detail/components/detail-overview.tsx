"use client";

import React from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  FileText,
  Calendar,
  User,
  Layers,
  UserCheck,
  AlertCircle,
  Users,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ActivityPlanWithRelations } from "@/modules/activity/types";
import type { PlanSummaryData } from "@/modules/activity/domain/summary";
import {
  ActivityStatusBadge,
  resolveCurrentOperator,
} from "@/modules/activity/ui/activity-status-badge";
import {
  BudgetSection,
  PromotionalMaterialsSection,
  MarketingExpenseSection,
} from "../../actual/components";

interface DetailOverviewProps {
  plan: ActivityPlanWithRelations;
  planSummary: PlanSummaryData;
  resolvedWorkTypes?: Array<{ code: string; name: string }>;
}

export function DetailOverview({
  plan,
  planSummary,
  resolvedWorkTypes = [],
}: DetailOverviewProps) {
  const isUnplanned = plan.planType === "UNPLANNED";
  const operator = resolveCurrentOperator(plan);

  const start = new Date(plan.startDate);
  const end = new Date(plan.endDate);
  const startDateDisplay =
    planSummary.startDateStr ||
    (plan.startDate ? format(start, "dd/MM/yyyy", { locale: th }) : "-");
  const endDateDisplay =
    planSummary.endDateStr ||
    (plan.endDate ? format(end, "dd/MM/yyyy", { locale: th }) : "-");
  const startTimeDisplay =
    planSummary.startTimeStr ||
    (plan.startDate ? format(start, "HH:mm") + " น." : "");
  const endTimeDisplay =
    planSummary.endTimeStr ||
    (plan.endDate ? format(end, "HH:mm") + " น." : "");

  const latestCorrectionLog = (plan.approvalLogs || []).find(
    (l: any) => l.action === "REQUEST_CORRECTION",
  );
  const latestRejectLog = (plan.approvalLogs || []).find(
    (l: any) => l.action === "REJECT",
  );

  return (
    <div className="space-y-3.5">
      {/* ── 1. Current Operator & Status Bar ── */}
      {operator && (
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
      )}

      {/* ── 2. Pending Cancellation Alert ── */}
      {plan.status === "PENDING_CANCELLATION" && (
        <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                {isUnplanned
                  ? "กิจกรรมนี้อยู่ระหว่างขออนุมัติการยกเลิก"
                  : "แผนงานนี้อยู่ระหว่างขออนุมัติการยกเลิก"}
              </h3>
              {plan.cancellationReason && (
                <p className="text-xs text-amber-800 mt-0.5">
                  เหตุผลที่ขอยกเลิก:{" "}
                  <span className="font-semibold italic">
                    &quot;{plan.cancellationReason}&quot;
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-amber-200/80 text-xs">
            <div className="flex items-center justify-between bg-white/80 px-3.5 py-2 rounded-xl border border-amber-200/60 shadow-2xs">
              <span className="text-slate-700 font-medium">1. ผู้อนุมัติตามสายงาน:</span>
              <span
                className={cn(
                  "font-bold px-2 py-0.5 rounded-md text-[11px]",
                  plan.lineCancellationApproved
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800",
                )}
              >
                {plan.lineCancellationApproved ? "✓ อนุมัติแล้ว" : "⏳ รออนุมัติ"}
              </span>
            </div>
            <div className="flex items-center justify-between bg-white/80 px-3.5 py-2 rounded-xl border border-amber-200/60 shadow-2xs">
              <span className="text-slate-700 font-medium">
                2. ผู้จัดการตลาด (ตรวจคืนสินค้า):
              </span>
              <span
                className={cn(
                  "font-bold px-2 py-0.5 rounded-md text-[11px]",
                  plan.mktCancellationApproved
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800",
                )}
              >
                {plan.mktCancellationApproved ? "✓ อนุมัติแล้ว" : "⏳ รออนุมัติ"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Pending Correction Alert ── */}
      {(plan.status === "WAITING_FOR_CORRECTION" || plan.status === "RETURNED") && (
        <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 sm:p-5 space-y-2 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
              <RotateCcw className="w-5 h-5 text-amber-700" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-amber-950">
                {isUnplanned
                  ? "กิจกรรมนี้ถูกส่งกลับให้แก้ไข"
                  : "แผนงานนี้ถูกส่งกลับให้แก้ไข"}
              </h3>
              {latestCorrectionLog?.comment ? (
                <div className="text-xs text-amber-900 mt-1.5 bg-white/90 p-3 rounded-xl border border-amber-200/80 shadow-2xs">
                  <span className="font-bold text-amber-950">สิ่งที่ต้องแก้ไข / หมายเหตุ: </span>
                  <span className="italic font-medium">&quot;{latestCorrectionLog.comment}&quot;</span>
                  {latestCorrectionLog.user?.name && (
                    <span className="text-[11px] text-amber-700 block mt-1.5 font-medium">
                      โดย: {latestCorrectionLog.user.name}{" "}
                      {latestCorrectionLog.createdAt
                        ? `(${format(new Date(latestCorrectionLog.createdAt), "dd/MM/yyyy HH:mm", { locale: th })})`
                        : ""}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-amber-800 mt-0.5">
                  กรุณาตรวจสอบและแก้ไขข้อมูลแผนงานก่อนส่งขออนุมัติอีกครั้ง
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Rejected Alert ── */}
      {plan.status === "REJECTED" && (
        <div className="bg-red-50/90 border border-red-300/80 rounded-2xl p-4 sm:p-5 space-y-2 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-800 flex items-center justify-center shrink-0 border border-red-200">
              <XCircle className="w-5 h-5 text-red-700" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-red-950">
                {isUnplanned
                  ? "กิจกรรมนี้ถูกปฏิเสธ"
                  : "แผนงานนี้ไม่ได้รับการอนุมัติ (ถูกปฏิเสธ)"}
              </h3>
              {latestRejectLog?.comment ? (
                <div className="text-xs text-red-900 mt-1.5 bg-white/90 p-3 rounded-xl border border-red-200/80 shadow-2xs">
                  <span className="font-bold text-red-950">เหตุผลที่ปฏิเสธ: </span>
                  <span className="italic font-medium">&quot;{latestRejectLog.comment}&quot;</span>
                  {latestRejectLog.user?.name && (
                    <span className="text-[11px] text-red-700 block mt-1.5 font-medium">
                      โดย: {latestRejectLog.user.name}{" "}
                      {latestRejectLog.createdAt
                        ? `(${format(new Date(latestRejectLog.createdAt), "dd/MM/yyyy HH:mm", { locale: th })})`
                        : ""}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-red-800 mt-0.5">
                  แผนงานนี้ถูกปฏิเสธการดำเนินการ
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Core Info Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              {isUnplanned ? "ชื่อกิจกรรม" : "ชื่อแผนงาน / กิจกรรม"}
            </p>
            <p className="text-base font-bold text-slate-800 truncate" title={plan.title}>
              {plan.title || "-"}
            </p>
          </div>
        </div>

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
        <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              {isUnplanned ? "ผู้บันทึกกิจกรรม" : "ผู้จัดทำแผน"}
            </p>
            <p className="text-sm font-bold text-slate-900 truncate">
              {plan.employee?.name || "-"}
            </p>
          </div>
        </div>

        <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              {isUnplanned
                ? `ประเภทงานที่ระบุในกิจกรรม (${resolvedWorkTypes.length} ประเภท):`
                : `ประเภทงานที่ระบุในแผน (${resolvedWorkTypes.length} ประเภท):`}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {resolvedWorkTypes.map((wt, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-xs px-2.5 py-1 font-semibold rounded-lg border shadow-2xs bg-indigo-50 text-indigo-800 border-indigo-200"
                >
                  {wt.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Helper Section ── */}
      {plan.helpers && plan.helpers.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
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
                className="bg-slate-50/80 border border-slate-100 rounded-xl p-3.5 flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                    {idx + 1}. {h.employee?.name || "พนักงาน"}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {h.employee?.positionTitle || "-"}{" "}
                    • {h.departmentName || h.employee?.departmentName || "ไม่ระบุแผนก"}
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
                    h.status === "APPROVED" && "border-emerald-200 text-emerald-700 bg-emerald-50",
                    h.status === "REJECTED" && "border-red-200 text-red-700 bg-red-50",
                    h.status === "PENDING" && "border-amber-200 text-amber-700 bg-amber-50",
                  )}
                >
                  {h.status === "APPROVED" ? "อนุมัติแล้ว" : h.status === "REJECTED" ? "ปฏิเสธ" : "รออนุมัติ"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Budgets & Materials ── */}
      <BudgetSection summary={planSummary} />
      <PromotionalMaterialsSection summary={planSummary} />
      <MarketingExpenseSection summary={planSummary} />

      {/* ── 6. Notes ── */}
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

      {/* ── 7. Location ── */}
      {plan.location && plan.location !== "-" && (
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
      )}
    </div>
  );
}
