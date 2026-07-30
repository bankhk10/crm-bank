"use client";

import React from "react";
import {
  FileText,
  Calendar,
  Clock,
  CircleDollarSign,
  Package,
  Info,
  Users,
  CheckCircle2,
  Receipt,
  Megaphone,
  TrendingUp,
} from "lucide-react";
import { PlanSummaryData } from "../types";

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

  const hasRequisition =
    summary.requisitionItems && summary.requisitionItems.length > 0;

  const hasAdditionalInfo =
    !!summary.notes ||
    !!summary.objective ||
    (summary.helperEmployeeNames && summary.helperEmployeeNames.length > 0);

  // Calculate budgets
  const marketingProductsTotal =
    summary.marketingProductItems?.reduce(
      (sum, item) => sum + (item.quantityCases || 0) * (item.pricePerCase || 0),
      0,
    ) || 0;
  const effectiveMarketingBudget =
    marketingProductsTotal || summary.marketingBudget || 0;

  const salesPromoTotal =
    summary.salesPromotionItems?.reduce(
      (sum, item) => sum + (item.amount || 0),
      0,
    ) || 0;
  const effectiveSalesPromoBudget =
    salesPromoTotal || summary.salesPromotionBudget || 0;

  const totalBudget =
    effectiveMarketingBudget +
    effectiveSalesPromoBudget +
    (summary.extraExpenseAmount || 0);

  const budgetRatio =
    summary.targetSales && summary.targetSales > 0
      ? ((effectiveMarketingBudget / summary.targetSales) * 100).toFixed(2)
      : null;

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
    <div className="rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white">
      {/* CARD HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-4 py-3 md:px-5 md:py-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 text-white font-bold text-sm md:text-base">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 border border-white/30 text-white shadow-sm">
            <FileText className="w-4 h-4" />
          </span>
          <span className="tracking-wide drop-shadow-sm">
            ข้อมูลสรุปจากแผน (Plan Summary)
          </span>
        </div>

        {summary.planNo && (
          <span className="text-xs bg-white/15 border border-white/25 text-white px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-300" />
            เลขที่แผน: {summary.planNo}
          </span>
        )}
      </div>

      {/* CARD BODY */}
      <div className="p-4 md:p-5 space-y-4">
        {/* SECTION 1: ข้อมูลหลักของกิจกรรม */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-indigo-600 flex items-center gap-1.5 uppercase tracking-widest">
            <FileText className="w-3.5 h-3.5" />
            ข้อมูลหลักของกิจกรรม (Main Activity Details)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* ชื่องานกิจกรรม */}
            <div className="bg-white border border-slate-200 p-3 rounded-xl md:col-span-2 lg:col-span-1 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all duration-200">
              <p className="text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">
                ชื่องานกิจกรรม
              </p>
              <p className="text-sm font-bold text-slate-800 leading-snug">
                {summary.title}
              </p>
            </div>

            {/* วันที่จัดกิจกรรม */}
            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all duration-200">
              <p className="text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">
                วันที่จัดกิจกรรม
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{summary.startDateStr}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                  <span>{startTimeDisplay}</span>
                </div>
                <span className="text-slate-400 font-normal">→</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{summary.startDateStr}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                  <span>{endTimeDisplay}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: งบประมาณและค่าใช้จ่าย */}
        {hasBudget && (
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5 uppercase tracking-widest">
                <CircleDollarSign className="w-3.5 h-3.5" />
                งบประมาณและค่าใช้จ่าย (Budget & Expenses)
              </p>
              <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                งบรวม {totalBudget.toLocaleString()} บาท
              </span>
            </div>

            {/* Overview Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              <div className="bg-blue-50/50 border border-blue-200/80 p-3 rounded-xl shadow-xs">
                <span className="text-blue-700 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                  งบขาย (รวม)
                </span>
                <span className="font-extrabold text-blue-900 text-sm">
                  {effectiveSalesPromoBudget.toLocaleString()} บาท
                </span>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-200/80 p-3 rounded-xl shadow-xs">
                <span className="text-emerald-700 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                  งบการตลาด (รวม)
                </span>
                <span className="font-extrabold text-emerald-900 text-sm">
                  {effectiveMarketingBudget.toLocaleString()} บาท
                </span>
              </div>

              {summary.targetSales ? (
                <div className="bg-violet-50/50 border border-violet-200/80 p-3 rounded-xl shadow-xs sm:col-span-2 lg:col-span-1 flex items-center justify-between">
                  <div>
                    <span className="text-violet-700 block text-[10px] uppercase font-bold tracking-wider mb-0.5 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-violet-600" />
                      เป้ายอดขายรวมจากกิจกรรม
                    </span>
                    <span className="font-extrabold text-violet-900 text-sm">
                      {summary.targetSales.toLocaleString()} บาท
                    </span>
                  </div>
                  {budgetRatio && (
                    <div className="text-right">
                      <span className="text-[10px] text-violet-600 font-medium block">
                        สัดส่วนงบการตลาด
                      </span>
                      <span className="text-xs font-black text-violet-800 bg-white px-2 py-0.5 rounded-md border border-violet-200 shadow-2xs">
                        {budgetRatio}%
                      </span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* DETAILS CARD 1: สื่อส่งเสริมการขาย */}
            {(hasMarketingProducts || summary.isPromotionalMediaSelected) && (
              <div className="bg-emerald-50/40 border border-emerald-200/70 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <Megaphone className="h-4 w-4 text-emerald-600" />
                    สื่อส่งเสริมการขาย (PVC, ไวนิล, ของแถมตราปืนใหญ่)
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded-md">
                    รวม ฿{effectiveMarketingBudget.toLocaleString()}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-emerald-200/80 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-emerald-50/70 border-b border-emerald-200/80 text-emerald-900 font-bold">
                      <tr>
                        <th className="py-2 px-3 text-center w-10">ลำดับ</th>
                        <th className="py-2 px-3">รายการ</th>
                        <th className="py-2 px-3 w-24 text-center">จำนวน</th>
                        <th className="py-2 px-3 w-28 text-right">
                          ราคา/หน่วย
                        </th>
                        <th className="py-2 px-3 w-32 text-right">
                          รวมเป็นเงิน
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
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
                            (item.quantityCases || 0) *
                            (item.pricePerCase || 0);
                          return (
                            <tr
                              key={item.id || index}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              <td className="py-2 px-3 text-center text-slate-500 font-medium">
                                {index + 1}
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-800">
                                {item.productName}
                              </td>
                              <td className="py-2 px-3 text-center font-semibold text-slate-700">
                                {item.quantityCases}
                              </td>
                              <td className="py-2 px-3 text-right text-slate-600">
                                ฿{item.pricePerCase.toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-emerald-700">
                                ฿{itemTotal.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {hasMarketingProducts && (
                      <tfoot className="bg-emerald-50/50 border-t border-emerald-200 text-xs font-bold text-emerald-950">
                        <tr>
                          <td colSpan={5} className="py-2 px-3 text-right">
                            รวมงบสื่อส่งเสริมการขายทั้งสิ้น:
                            <span className="text-emerald-700 ml-1">
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

            {/* DETAILS CARD 2: รายการส่งเสริมการขาย */}
            {(hasSalesPromotionItems || summary.isSalesPromotionSelected) && (
              <div className="bg-blue-50/40 border border-blue-200/70 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                  <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                    <Receipt className="h-4 w-4 text-blue-600" />
                    รายการส่งเสริมการขาย
                  </span>
                  <span className="text-[11px] font-bold text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded-md">
                    รวม ฿{effectiveSalesPromoBudget.toLocaleString()}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-blue-200/80 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-blue-50/70 border-b border-blue-200/80 text-blue-900 font-bold">
                      <tr>
                        <th className="py-2 px-3 text-center w-10">ลำดับ</th>
                        <th className="py-2 px-3 min-w-[180px]">รายละเอียด</th>
                        <th className="py-2 px-3 w-32">การใช้งบ</th>
                        <th className="py-2 px-3 w-32 text-right">
                          จำนวนเงิน (บาท)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
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
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="py-2 px-3 text-center text-slate-500 font-medium">
                              {index + 1}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-800">
                              {item.detail}
                            </td>
                            <td className="py-2 px-3">
                              <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                                {item.budgetType || "งบขาย"}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-blue-700">
                              ฿{item.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {hasSalesPromotionItems && (
                      <tfoot className="bg-blue-50/50 border-t border-blue-200 text-xs font-bold text-blue-950">
                        <tr>
                          <td colSpan={4} className="py-2 px-3 text-right">
                            ผลรวมใช้งบทั้งสิ้น:
                            <span className="text-blue-700 ml-1">
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
          </div>
        )}

        {/* SECTION 3: รายการขอเบิกสินค้าจัดกิจกรรม */}
        {hasRequisition && (
          <div className="space-y-2 pt-3 border-t border-slate-200">
            <p className="text-[11px] font-bold text-violet-600 flex items-center gap-1.5 uppercase tracking-widest">
              <Package className="w-3.5 h-3.5" />
              รายการขอเบิกสินค้าจัดกิจกรรม (Material Requisition)
            </p>
            <div className="flex flex-wrap gap-2">
              {summary.requisitionItems!.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs flex items-center gap-2 shadow-xs hover:border-violet-300 hover:shadow-sm transition-all duration-200"
                >
                  <span className="font-semibold text-slate-700">
                    📦 {item.productName}
                  </span>
                  <span className="bg-violet-100 border border-violet-200 text-violet-700 font-bold px-2 py-0.5 rounded-md text-[11px]">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: ข้อมูลเพิ่มเติม */}
        {hasAdditionalInfo && (
          <div className="space-y-2 pt-3 border-t border-slate-200">
            <p className="text-[11px] font-bold text-sky-600 flex items-center gap-1.5 uppercase tracking-widest">
              <Info className="w-3.5 h-3.5" />
              ข้อมูลเพิ่มเติม (Additional Info)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {summary.objective && (
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs hover:border-sky-300 hover:shadow-sm transition-all duration-200">
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">
                    วัตถุประสงค์ / เป้าหมายหลัก
                  </span>
                  <span className="font-medium text-slate-700 leading-relaxed">
                    {summary.objective}
                  </span>
                </div>
              )}

              {summary.helperEmployeeNames &&
                summary.helperEmployeeNames.length > 0 && (
                  <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs hover:border-sky-300 hover:shadow-sm transition-all duration-200">
                    <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3 text-sky-500" />
                      ทีมงานร่วมลงพื้นที่ ({
                        summary.helperEmployeeNames.length
                      }{" "}
                      คน)
                    </span>
                    <span className="font-semibold text-slate-700">
                      {summary.helperEmployeeNames.join(", ")}
                    </span>
                  </div>
                )}

              {summary.notes && (
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl md:col-span-2 shadow-xs hover:border-sky-300 hover:shadow-sm transition-all duration-200">
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">
                    หมายเหตุเพิ่มเติม
                  </span>
                  <span className="font-medium text-slate-700 leading-relaxed">
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
