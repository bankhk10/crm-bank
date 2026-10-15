"use client";

import React from "react";
import { CircleDollarSign, FolderKanban } from "lucide-react";
import type { PlanSummaryData } from "../types";

interface BudgetSectionProps {
  summary: PlanSummaryData;
}

export function BudgetSection({ summary }: BudgetSectionProps) {
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

  if (!hasBudget) return null;

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

  return (
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
              <path d="M18 18 L18 2 A16 16 0 0 1 34 18 Z" fill="#93c5fd" />
              <path d="M18 18 L34 18 A16 16 0 0 1 18 34 Z" fill="#bfdbfe" />
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

            {/* ปรับเป็นบรรทัดเดียวกัน */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-1 border-t border-emerald-100/60">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span>• สื่อส่งเสริมการขาย:</span>
                <span className="font-bold text-emerald-800">
                  {marketingMediaBudget.toLocaleString()} บาท
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-600">
                <span>• รายการส่งเสริมการขาย:</span>
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
  );
}
