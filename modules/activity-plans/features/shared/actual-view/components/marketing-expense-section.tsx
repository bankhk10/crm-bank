"use client";

import React from "react";
import { Receipt } from "lucide-react";
import type { PlanSummaryData } from "../types";

interface MarketingExpenseSectionProps {
  summary: PlanSummaryData;
}

export function MarketingExpenseSection({
  summary,
}: MarketingExpenseSectionProps) {
  const hasSalesPromotionItems =
    summary.salesPromotionItems && summary.salesPromotionItems.length > 0;

  if (!hasSalesPromotionItems && !summary.isSalesPromotionSelected) {
    return null;
  }

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

  const effectiveSalesPromoBudget = hasSalesPromotionItems
    ? salesPromoSalesTotal
    : summary.salesPromotionBudget || 0;

  return (
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
  );
}
