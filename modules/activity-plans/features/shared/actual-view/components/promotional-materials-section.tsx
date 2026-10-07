"use client";

import React from "react";
import { Megaphone } from "lucide-react";
import type { PlanSummaryData } from "../types";

interface PromotionalMaterialsSectionProps {
  summary: PlanSummaryData;
}

export function PromotionalMaterialsSection({
  summary,
}: PromotionalMaterialsSectionProps) {
  const hasMarketingProducts =
    summary.marketingProductItems && summary.marketingProductItems.length > 0;

  if (!hasMarketingProducts && !summary.isPromotionalMediaSelected) {
    return null;
  }

  const marketingProductsTotal =
    summary.marketingProductItems?.reduce(
      (sum, item) => sum + (item.quantityCases || 0) * (item.pricePerCase || 0),
      0,
    ) || 0;
  const marketingMediaBudget =
    marketingProductsTotal || summary.marketingBudget || 0;

  return (
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
  );
}
