"use client";

import React from "react";
import {
  FileText,
  Calendar,
  Clock,
  MapPin,
  CircleDollarSign,
  Package,
  Info,
  Users,
  CheckCircle2,
} from "lucide-react";
import { PlanSummaryData } from "../types";

interface ActualPlanSummaryProps {
  summary: PlanSummaryData;
}

export function ActualPlanSummary({ summary }: ActualPlanSummaryProps) {
  const hasBudget =
    (summary.marketingBudget && summary.marketingBudget > 0) ||
    (summary.salesPromotionBudget && summary.salesPromotionBudget > 0) ||
    (summary.extraExpenseAmount && summary.extraExpenseAmount > 0);

  const hasRequisition =
    summary.requisitionItems && summary.requisitionItems.length > 0;

  const hasAdditionalInfo =
    !!summary.notes ||
    !!summary.objective ||
    (summary.helperEmployeeNames && summary.helperEmployeeNames.length > 0);

  // Calculate Total Budget if available
  const totalBudget =
    (summary.marketingBudget || 0) +
    (summary.salesPromotionBudget || 0) +
    (summary.extraExpenseAmount || 0);

  // Extract or format start / end times
  const rawStartTime =
    summary.startTimeStr ||
    (summary.timeStr?.includes(" - ")
      ? summary.timeStr.split(" - ")[0]
      : summary.timeStr);
  const rawEndTime =
    summary.endTimeStr ||
    (summary.timeStr?.includes(" - ")
      ? summary.timeStr.split(" - ")[1]
      : summary.timeStr);

  const formatTime = (timeRaw?: string) => {
    if (!timeRaw) return "-";
    const t = timeRaw.trim();
    if (t.endsWith("น.") || t.endsWith("น")) return t;
    return `${t} น.`;
  };

  const startTimeDisplay = formatTime(rawStartTime);
  const endTimeDisplay = formatTime(rawEndTime);

  return (
    <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 md:p-5 shadow-2xs space-y-4">
      {/* CARD HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs shadow-xs">
            <FileText className="w-4 h-4" />
          </span>
          <span>ข้อมูลสรุปจากแผน (Plan Summary)</span>
        </div>

        {summary.planNo && (
          <span className="text-xs bg-blue-100 text-blue-900 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            เลขที่แผน: {summary.planNo}
          </span>
        )}
      </div>

      {/* SECTION 1: ข้อมูลหลักของกิจกรรม (Main Activity Details) */}
      <div className="space-y-1.5">
        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          ข้อมูลหลักของกิจกรรม (Main Activity Details):
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* ชื่องานกิจกรรม */}
          <div className="bg-white p-3 rounded-xl border border-blue-100/80 md:col-span-2 lg:col-span-1">
            <p className="text-[11px] text-slate-400 font-semibold mb-0.5">
              ชื่องานกิจกรรม
            </p>
            <p className="text-xs md:text-sm font-bold text-slate-900">
              {summary.title}
            </p>
          </div>

          {/* วันที่จัดกิจกรรม */}
          <div className="bg-white p-3 rounded-xl border border-blue-100/80">
            <p className="text-[11px] text-slate-400 font-semibold mb-0.5">
              วันที่จัดกิจกรรม
            </p>
            <div className="flex flex-col gap-0.5 text-xs font-bold text-slate-800">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{summary.startDateStr}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>เวลา {startTimeDisplay}</span>
              </div>
            </div>
          </div>

          {/* วันที่สิ้นสุดกิจกรรม */}
          <div className="bg-white p-3 rounded-xl border border-blue-100/80">
            <p className="text-[11px] text-slate-400 font-semibold mb-0.5">
              วันที่สิ้นสุดกิจกรรม
            </p>
            <div className="flex flex-col gap-0.5 text-xs font-bold text-slate-800">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{summary.endDateStr || summary.startDateStr}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>เวลา {endTimeDisplay}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: งบประมาณและค่าใช้จ่าย (Budget & Expenses) (ถ้ามี) */}
      {hasBudget && (
        <div className="space-y-1.5 pt-1 border-t border-blue-100/80">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <CircleDollarSign className="w-3.5 h-3.5 text-emerald-600" />
              งบประมาณและค่าใช้จ่าย (Budget & Expenses):
            </p>
            <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">
              งบรวม {totalBudget.toLocaleString()} บาท
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {summary.salesPromotionBudget ? (
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 text-xs">
                <span className="text-slate-400 block text-[10px]">
                  งบส่งเสริมการขาย:
                </span>
                <span className="font-bold text-emerald-700">
                  {summary.salesPromotionBudget.toLocaleString()} บาท
                </span>
              </div>
            ) : null}

            {summary.marketingBudget ? (
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 text-xs">
                <span className="text-slate-400 block text-[10px]">
                  งบการตลาด:
                </span>
                <span className="font-bold text-blue-700">
                  {summary.marketingBudget.toLocaleString()} บาท
                </span>
              </div>
            ) : null}

            {summary.extraExpenseAmount ? (
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 text-xs">
                <span className="text-slate-400 block text-[10px]">
                  ค่าใช้จ่ายเพิ่มเติม ({summary.extraExpenseDetail || "อื่นๆ"}):
                </span>
                <span className="font-bold text-amber-700">
                  {summary.extraExpenseAmount.toLocaleString()} บาท
                </span>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* SECTION 3: รายการขอเบิกสินค้าจัดกิจกรรม (Material Requisition) (ถ้ามี) */}
      {hasRequisition && (
        <div className="space-y-1.5 pt-1 border-t border-blue-100/80">
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-indigo-600" />
            รายการขอเบิกสินค้าจัดกิจกรรม (Material Requisition):
          </p>
          <div className="flex flex-wrap gap-2">
            {summary.requisitionItems!.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-indigo-100 rounded-lg px-3 py-1.5 text-xs flex items-center gap-2 shadow-2xs"
              >
                <span className="font-semibold text-slate-800">
                  📦 {item.productName}
                </span>
                <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md text-[11px]">
                  {item.quantity} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: ข้อมูลเพิ่มเติม (Additional Info) (ถ้ามี) */}
      {hasAdditionalInfo && (
        <div className="space-y-1.5 pt-1 border-t border-blue-100/80">
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-violet-600" />
            ข้อมูลเพิ่มเติม (Additional Info):
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {summary.objective && (
              <div className="bg-white p-2.5 rounded-xl border border-violet-100">
                <span className="text-slate-400 block text-[10px]">
                  วัตถุประสงค์ / เป้าหมายหลัก:
                </span>
                <span className="font-medium text-slate-800">
                  {summary.objective}
                </span>
              </div>
            )}

            {summary.helperEmployeeNames &&
              summary.helperEmployeeNames.length > 0 && (
                <div className="bg-white p-2.5 rounded-xl border border-violet-100">
                  <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                    <Users className="w-3 h-3 text-violet-500" />
                    ทีมงานร่วมลงพื้นที่ ({
                      summary.helperEmployeeNames.length
                    }{" "}
                    คน):
                  </span>
                  <span className="font-semibold text-violet-900">
                    {summary.helperEmployeeNames.join(", ")}
                  </span>
                </div>
              )}

            {summary.notes && (
              <div className="bg-white p-2.5 rounded-xl border border-violet-100 md:col-span-2">
                <span className="text-slate-400 block text-[10px]">
                  หมายเหตุเพิ่มเติม:
                </span>
                <span className="font-medium text-slate-800">
                  {summary.notes}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
