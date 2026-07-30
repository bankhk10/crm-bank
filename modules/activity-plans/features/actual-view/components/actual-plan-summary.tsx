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
    <div className="bg-neutral-950 border border-red-800/40 rounded-2xl overflow-hidden shadow-lg">
      {/* CARD HEADER */}
      <div className="bg-gradient-to-r from-red-700 via-red-800 to-neutral-900 px-4 py-3 md:px-5 md:py-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 text-white font-bold text-sm md:text-base">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 border border-white/20 text-white text-xs shadow-sm backdrop-blur-sm">
            <FileText className="w-4 h-4" />
          </span>
          <span className="tracking-wide">ข้อมูลสรุปจากแผน (Plan Summary)</span>
        </div>

        {summary.planNo && (
          <span className="text-xs bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full font-bold flex items-center gap-1.5 backdrop-blur-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-red-300" />
            เลขที่แผน: {summary.planNo}
          </span>
        )}
      </div>

      {/* CARD BODY */}
      <div className="p-4 md:p-5 space-y-4">
        {/* SECTION 1: ข้อมูลหลักของกิจกรรม */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-red-400 flex items-center gap-1.5 uppercase tracking-widest">
            <FileText className="w-3.5 h-3.5" />
            ข้อมูลหลักของกิจกรรม (Main Activity Details)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* ชื่องานกิจกรรม */}
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl md:col-span-2 lg:col-span-1 hover:border-red-700/50 transition-colors duration-200">
              <p className="text-[10px] text-neutral-400 font-semibold mb-1 uppercase tracking-wider">
                ชื่องานกิจกรรม
              </p>
              <p className="text-sm font-bold text-white leading-snug">
                {summary.title}
              </p>
            </div>

            {/* วันที่จัดกิจกรรม */}
            <div className="bg-white/5 border border-white/10 p-3 rounded-xl hover:border-red-700/50 transition-colors duration-200">
              <p className="text-[10px] text-neutral-500 font-semibold mb-1 uppercase tracking-wider">
                วันที่จัดกิจกรรม
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-neutral-200">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>{summary.startDateStr}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>{startTimeDisplay}</span>
                </div>
                <span className="text-neutral-500">→</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>{summary.startDateStr}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>{endTimeDisplay}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: งบประมาณและค่าใช้จ่าย */}
        {hasBudget && (
          <div className="space-y-2 pt-3 border-t border-white/8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-bold text-red-400 flex items-center gap-1.5 uppercase tracking-widest">
                <CircleDollarSign className="w-3.5 h-3.5" />
                งบประมาณและค่าใช้จ่าย (Budget & Expenses)
              </p>
              <span className="text-[11px] font-extrabold text-white bg-red-700/80 border border-red-600/50 px-2.5 py-0.5 rounded-md">
                งบรวม {totalBudget.toLocaleString()} บาท
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {summary.salesPromotionBudget ? (
                <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl hover:border-red-700/50 transition-colors duration-200">
                  <span className="text-neutral-500 block text-[10px] uppercase tracking-wider mb-0.5">
                    งบส่งเสริมการขาย
                  </span>
                  <span className="font-bold text-white text-xs">
                    {summary.salesPromotionBudget.toLocaleString()} บาท
                  </span>
                </div>
              ) : null}

              {summary.marketingBudget ? (
                <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl hover:border-red-700/50 transition-colors duration-200">
                  <span className="text-neutral-500 block text-[10px] uppercase tracking-wider mb-0.5">
                    งบการตลาด
                  </span>
                  <span className="font-bold text-white text-xs">
                    {summary.marketingBudget.toLocaleString()} บาท
                  </span>
                </div>
              ) : null}

              {summary.extraExpenseAmount ? (
                <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl hover:border-red-700/50 transition-colors duration-200">
                  <span className="text-neutral-500 block text-[10px] uppercase tracking-wider mb-0.5">
                    ค่าใช้จ่ายเพิ่มเติม ({summary.extraExpenseDetail || "อื่นๆ"}
                    )
                  </span>
                  <span className="font-bold text-white text-xs">
                    {summary.extraExpenseAmount.toLocaleString()} บาท
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* SECTION 3: รายการขอเบิกสินค้าจัดกิจกรรม */}
        {hasRequisition && (
          <div className="space-y-2 pt-3 border-t border-white/8">
            <p className="text-[11px] font-bold text-red-400 flex items-center gap-1.5 uppercase tracking-widest">
              <Package className="w-3.5 h-3.5" />
              รายการขอเบิกสินค้าจัดกิจกรรม (Material Requisition)
            </p>
            <div className="flex flex-wrap gap-2">
              {summary.requisitionItems!.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs flex items-center gap-2 hover:border-red-700/50 transition-colors duration-200"
                >
                  <span className="font-semibold text-neutral-200">
                    📦 {item.productName}
                  </span>
                  <span className="bg-red-800/60 border border-red-700/40 text-red-200 font-bold px-2 py-0.5 rounded-md text-[11px]">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: ข้อมูลเพิ่มเติม */}
        {hasAdditionalInfo && (
          <div className="space-y-2 pt-3 border-t border-white/8">
            <p className="text-[11px] font-bold text-red-400 flex items-center gap-1.5 uppercase tracking-widest">
              <Info className="w-3.5 h-3.5" />
              ข้อมูลเพิ่มเติม (Additional Info)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {summary.objective && (
                <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl hover:border-red-700/50 transition-colors duration-200">
                  <span className="text-neutral-500 block text-[10px] uppercase tracking-wider mb-1">
                    วัตถุประสงค์ / เป้าหมายหลัก
                  </span>
                  <span className="font-medium text-neutral-200 leading-relaxed">
                    {summary.objective}
                  </span>
                </div>
              )}

              {summary.helperEmployeeNames &&
                summary.helperEmployeeNames.length > 0 && (
                  <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl hover:border-red-700/50 transition-colors duration-200">
                    <span className="text-neutral-500 block text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3 text-red-400" />
                      ทีมงานร่วมลงพื้นที่ ({
                        summary.helperEmployeeNames.length
                      }{" "}
                      คน)
                    </span>
                    <span className="font-semibold text-neutral-200">
                      {summary.helperEmployeeNames.join(", ")}
                    </span>
                  </div>
                )}

              {summary.notes && (
                <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl md:col-span-2 hover:border-red-700/50 transition-colors duration-200">
                  <span className="text-neutral-500 block text-[10px] uppercase tracking-wider mb-1">
                    หมายเหตุเพิ่มเติม
                  </span>
                  <span className="font-medium text-neutral-200 leading-relaxed">
                    {summary.notes}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
