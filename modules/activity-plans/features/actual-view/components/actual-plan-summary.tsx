"use client";

import React from "react";
import {
  FileText,
  Calendar,
  CircleDollarSign,
  Info,
  Receipt,
  Megaphone,
  FolderKanban,
} from "lucide-react";
import { PlanSummaryData } from "../types";
import { cn } from "@/lib/utils";

interface ActualPlanSummaryProps {
  summary: PlanSummaryData;
}

export function ActualPlanSummary({ summary }: ActualPlanSummaryProps) {
  const hasMarketingProducts =
    summary.marketingProductItems && summary.marketingProductItems.length > 0;
  const hasSalesPromotionItems =
    summary.salesPromotionItems && summary.salesPromotionItems.length > 0;

  const hasBudget =
    (summary.marketingBudget && summary.marketingBudget > 0) ||
    (summary.salesPromotionBudget && summary.salesPromotionBudget > 0) ||
    (summary.extraExpenseAmount && summary.extraExpenseAmount > 0) ||
    !!hasMarketingProducts ||
    !!hasSalesPromotionItems ||
    !!summary.isPromotionalMediaSelected ||
    !!summary.isSalesPromotionSelected;

  const hasNotes =
    !!summary.notes &&
    summary.notes.trim() !== "" &&
    summary.notes.trim() !== "-";
  const hasHelpers =
    !!summary.helperEmployeeNames && summary.helperEmployeeNames.length > 0;
  const hasAdditionalInfo = hasNotes || hasHelpers;

  // Calculate budgets
  // 1. สื่อส่งเสริมการขาย (PVC, ไวนิล, ของแถมตราปืนใหญ่)
  const marketingProductsTotal =
    summary.marketingProductItems?.reduce(
      (sum, item) => sum + (item.quantityCases || 0) * (item.pricePerCase || 0),
      0,
    ) || 0;
  const marketingMediaBudget =
    marketingProductsTotal || summary.marketingBudget || 0;

  // 2. รายการส่งเสริมการขาย (แบ่งตามประเภทการใช้งบ)
  const salesPromoMarketingTotal =
    summary.salesPromotionItems?.reduce(
      (sum, item) =>
        item.budgetType === "งบการตลาด" ? sum + (item.amount || 0) : sum,
      0,
    ) || 0;

  const salesPromoSalesTotal =
    summary.salesPromotionItems?.reduce(
      (sum, item) =>
        !item.budgetType || item.budgetType === "งบขาย"
          ? sum + (item.amount || 0)
          : sum,
      0,
    ) || 0;

  const salesPromoTotal =
    summary.salesPromotionItems?.reduce(
      (sum, item) => sum + (item.amount || 0),
      0,
    ) || 0;

  // รวมงบการตลาด (สื่อส่งเสริมการขาย + รายการส่งเสริมการขายที่เป็นงบการตลาด)
  const effectiveMarketingBudget =
    marketingMediaBudget + salesPromoMarketingTotal;

  // งบขาย (รวม)
  const effectiveSalesPromoBudget = hasSalesPromotionItems
    ? salesPromoSalesTotal
    : summary.salesPromotionBudget || 0;

  // งบประมาณรวมทั้งสิ้น
  const totalBudget =
    effectiveMarketingBudget +
    effectiveSalesPromoBudget +
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
    if (!timeRaw) return "08:00 น.";
    const t = timeRaw.trim();
    if (t.endsWith("น.") || t.endsWith("น")) return t;
    return `${t} น.`;
  };

  const startTimeDisplay = formatTime(rawStartTime);
  const endTimeDisplay = formatTime(rawEndTime);
  const endDateDisplay = (summary as any).endDateStr ?? summary.startDateStr;

  return (
    <div className="space-y-5">
      {/* ─── SECTION 1: ข้อมูลแผนงาน ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Card 1: ชื่อแผน/กิจกรรม */}
        <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              ชื่อแผน/กิจกรรม
            </p>
            <p className="text-base font-bold text-slate-800 truncate">
              {summary.title || "-"}
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
              วันที่เริ่ม - สิ้นสุด
            </p>
            <p className="text-xs sm:text-sm font-bold text-slate-800 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>{summary.startDateStr} {startTimeDisplay}</span>
              <span className="text-slate-400 font-normal">—</span>
              <span>{endDateDisplay} {endTimeDisplay}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: งบประมาณและค่าใช้จ่าย ─── */}
      {hasBudget && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600">
              <CircleDollarSign className="w-4 h-4 shrink-0" />
              <span className="text-sm font-bold">งบประมาณและค่าใช้จ่าย</span>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-2xs">
              งบรวม {totalBudget.toLocaleString()} บาท
            </span>
          </div>

          {/* Overview 2 Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Left Card: งบขาย (รวม) */}
            <div className="bg-[#f0f7ff] border border-blue-200/80 rounded-2xl p-5 relative overflow-hidden flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wide block">
                  งบขาย (รวม)
                </span>
                <span className="text-2xl font-extrabold text-blue-900 block mt-1">
                  {effectiveSalesPromoBudget.toLocaleString()} บาท
                </span>
              </div>
              <div className="w-14 h-14 relative shrink-0 flex items-center justify-center opacity-85">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="#dbeafe" />
                  <path
                    d="M18 18 L18 2 A16 16 0 0 1 34 18 Z"
                    fill="#93c5fd"
                  />
                  <path
                    d="M18 18 L34 18 A16 16 0 0 1 18 34 Z"
                    fill="#bfdbfe"
                  />
                </svg>
              </div>
            </div>

            {/* Right Card: งบการตลาด (รวม) */}
            <div className="bg-[#f0fdf4] border border-emerald-200/80 rounded-2xl p-5 relative overflow-hidden flex items-start justify-between shadow-2xs">
              <div className="space-y-2 flex-1 pr-3">
                <div>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide block">
                    งบการตลาด (รวม)
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-900 block mt-1">
                    {effectiveMarketingBudget.toLocaleString()} บาท
                  </span>
                </div>
                <div className="space-y-1 text-xs pt-1 border-t border-emerald-100/60 max-w-[280px]">
                  <div className="flex items-center justify-between gap-4 text-slate-600">
                    <span>• สื่อส่งเสริมการขาย</span>
                    <span className="font-bold text-emerald-800">
                      {marketingMediaBudget.toLocaleString()} บาท
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-slate-600">
                    <span>• รายการส่งเสริมการขาย</span>
                    <span className="font-bold text-emerald-800">
                      {salesPromoMarketingTotal.toLocaleString()} บาท
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-500 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                <FolderKanban className="w-6 h-6 stroke-[1.8]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SECTION 3: สื่อส่งเสริมการขาย (PVC, ไวนิล, ของแถมตราปืนใหญ่) ─── */}
      {(hasMarketingProducts || summary.isPromotionalMediaSelected) && (
        <div className="border border-emerald-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs">
          <div className="p-3.5 bg-white border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-emerald-900">
                สื่อส่งเสริมการขาย (PVC, ไวนิล, ของแถมตราปืนใหญ่)
              </span>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
              รวม {marketingMediaBudget.toLocaleString()} บาท
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#ebf8f0] text-emerald-900 font-bold border-b border-emerald-200/60">
                <tr>
                  <th className="py-2.5 px-4 text-center w-14">ลำดับ</th>
                  <th className="py-2.5 px-4">รายการ</th>
                  <th className="py-2.5 px-4 text-center w-24">จำนวน</th>
                  <th className="py-2.5 px-4 text-right w-28">ราคา</th>
                  <th className="py-2.5 px-4 text-right w-32">รวมเป็นเงิน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100/40">
                {!hasMarketingProducts ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-3 text-center text-slate-400 italic"
                    >
                      ไม่มีรายการสื่อส่งเสริมการขาย
                    </td>
                  </tr>
                ) : (
                  summary.marketingProductItems!.map((item, index) => {
                    const itemTotal =
                      (item.quantityCases || 0) * (item.pricePerCase || 0);
                    return (
                      <tr
                        key={item.id || index}
                        className="hover:bg-emerald-50/30 transition-colors"
                      >
                        <td className="py-2.5 px-4 text-center text-slate-700 font-medium">
                          {index + 1}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">
                          {item.productName}
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-800">
                          {item.quantityCases}
                        </td>
                        <td className="py-2.5 px-4 text-right font-medium text-slate-700">
                          ฿{item.pricePerCase.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right font-extrabold text-emerald-800">
                          ฿{itemTotal.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {hasMarketingProducts && (
                <tfoot className="bg-[#ebf8f0]/40 border-t border-emerald-200/60 text-xs font-bold text-emerald-950">
                  <tr>
                    <td colSpan={5} className="py-2.5 px-4 text-right">
                      รวมงบสื่อส่งเสริมการขายทั้งสิ้น:
                      <span className="text-emerald-800 font-black ml-1">
                        ฿{marketingProductsTotal.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ─── SECTION 4: รายการส่งเสริมการขาย ─── */}
      {(hasSalesPromotionItems || summary.isSalesPromotionSelected) && (
        <div className="border border-blue-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs">
          <div className="p-3.5 bg-white border-b border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-blue-900">
                รายการส่งเสริมการขาย
              </span>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
              รวม {effectiveSalesPromoBudget.toLocaleString()} บาท
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#eff6ff] text-blue-900 font-bold border-b border-blue-200/60">
                <tr>
                  <th className="py-2.5 px-4 text-center w-14">ลำดับ</th>
                  <th className="py-2.5 px-4 min-w-[180px]">รายละเอียด</th>
                  <th className="py-2.5 px-4 text-center w-36">การใช้งบ</th>
                  <th className="py-2.5 px-4 text-right w-36">จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100/40">
                {!hasSalesPromotionItems ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-3 text-center text-slate-400 italic"
                    >
                      ไม่มีรายการส่งเสริมการขาย
                    </td>
                  </tr>
                ) : (
                  summary.salesPromotionItems!.map((item, index) => (
                    <tr
                      key={item.id || index}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="py-2.5 px-4 text-center text-slate-700 font-medium">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        {item.detail}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                          {item.budgetType || "งบการตลาด"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-extrabold text-blue-800">
                        ฿{item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {hasSalesPromotionItems && (
                <tfoot className="bg-[#eff6ff]/40 border-t border-blue-200/60 text-xs font-bold text-blue-950">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-4 text-right">
                      ผลรวมเป็นเงินทั้งสิ้น:
                      <span className="text-blue-800 font-black ml-1">
                        ฿{salesPromoTotal.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ─── SECTION 5: ข้อมูลเพิ่มเติม ─── */}
      {hasAdditionalInfo && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-sky-700">
            <Info className="w-4 h-4 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">ข้อมูลเพิ่มเติม</span>
          </div>

          <div
            className={cn(
              "grid gap-3.5",
              hasNotes && hasHelpers
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1",
            )}
          >
            {/* หมายเหตุเพิ่มเติม */}
            {hasNotes && (
              <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
                <span className="text-xs text-slate-400 font-medium mb-1 block">
                  หมายเหตุเพิ่มเติม
                </span>
                <span className="text-sm font-semibold text-slate-700 leading-relaxed block">
                  {summary.notes}
                </span>
              </div>
            )}

            {/* หน่วยงานผู้เพิ่มเติม / ผู้ช่วยงาน */}
            {hasHelpers && (
              <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
                <span className="text-xs text-slate-400 font-medium mb-1 block">
                  หน่วยงานผู้เพิ่มเติม
                </span>
                <span className="text-sm font-semibold text-slate-700 leading-relaxed block">
                  {summary.helperEmployeeNames!.join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
