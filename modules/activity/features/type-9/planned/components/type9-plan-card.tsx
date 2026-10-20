"use client";

import React from "react";
import { Store, ShoppingBag, Target, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Type9PlanCardProps, Type9PlanTarget } from "../types/planned.types";

export type { Type9PlanTarget, Type9PlanCardProps };

export function Type9PlanCard({
  target,
  planType,
  className = "",
  hideItemsTable = false,
}: Type9PlanCardProps) {
  if (planType === "UNPLANNED" || !target) return null;

  const items = target.items || [];
  const storeDisplay = target.store || "";

  return (
    <div
      className={`bg-white border border-teal-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-teal-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-200">
            <Store className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-teal-950 text-sm sm:text-base">
            ข้อมูลตามแผนงาน: จัดกิจกรรมส่งเสริมการขายหน้าร้าน (Type 9)
          </h4>
        </div>
        <Badge
          variant="outline"
          className="bg-teal-50 text-teal-800 border-teal-200 text-[11px] font-semibold px-2.5 py-0.5"
        >
          ข้อมูลตามแผนงาน (PLAN)
        </Badge>
      </div>

      {/* Grid Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        {storeDisplay ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              ร้านค้าที่จัดกิจกรรม
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {storeDisplay}
            </span>
            {target.isSubDealer && target.subDealerStore ? (
              <span className="text-[11px] text-slate-500 block mt-0.5">
                (ร้านค้าย่อย: {target.subDealerStore})
              </span>
            ) : null}
          </div>
        ) : null}

        {target.product ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              สินค้าเป้าหมาย
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {target.product}
            </span>
          </div>
        ) : null}

        {target.targetSales ? (
          <div className="bg-teal-50/40 p-3 rounded-xl border border-teal-100/80 sm:col-span-1">
            <span className="text-teal-700 block text-[11px] font-bold mb-1">
              เป้ายอดขายกิจกรรม
            </span>
            <span className="font-extrabold text-teal-900 block text-xs sm:text-sm">
              {target.targetSales}
            </span>
          </div>
        ) : null}

        {target.targetAttendees ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              ผู้เข้าร่วมเป้าหมาย
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {target.targetAttendees}
            </span>
          </div>
        ) : null}
      </div>

      {/* Optional Table of Target Products */}
      {!hideItemsTable && items.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Package className="w-3.5 h-3.5 text-teal-600" />
            <span>รายการสินค้าเป้าหมาย ({items.length} รายการ)</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                <tr>
                  <th className="py-2 px-3">สินค้า</th>
                  <th className="py-2 px-3 text-center">จำนวนเป้าหมาย</th>
                  <th className="py-2 px-3 text-right">ราคา/หน่วย</th>
                  <th className="py-2 px-3 text-right">ยอดรวมเป้าหมาย</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => (
                  <tr key={it.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-medium text-slate-800">
                      {it.productName}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-600">
                      {it.quantityCases != null ? `${it.quantityCases} ลัง` : "-"}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-600">
                      {it.pricePerCase != null
                        ? `${Number(it.pricePerCase).toLocaleString()} ฿`
                        : "-"}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-teal-700">
                      {it.totalAmount != null
                        ? `${Number(it.totalAmount).toLocaleString()} ฿`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
