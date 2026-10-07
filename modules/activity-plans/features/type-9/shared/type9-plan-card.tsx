"use client";

import React from "react";
import { Store, ShoppingBag, Target, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Type9PlanTarget {
  store?: string;
  isSubDealer?: boolean;
  subDealerStore?: string;
  product?: string;
  targetSales?: number | string;
  targetAttendees?: number | string;
  items?: Array<{
    id?: string;
    productId?: string;
    productName?: string;
    quantityCases?: number | string;
    pricePerCase?: number;
    totalAmount?: number;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface Type9PlanCardProps {
  target?: Type9PlanTarget;
  planType?: string;
  className?: string;
  hideItemsTable?: boolean;
}

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
      className={`bg-white border border-orange-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-orange-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-200">
            <Store className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-orange-950 text-sm sm:text-base">
            ข้อมูลตามแผนงาน: จัดกิจกรรมส่งเสริมการขายหน้าร้าน
          </h4>
        </div>
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-800 border-orange-200 text-[11px] font-semibold px-2.5 py-0.5"
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
          <div className="bg-orange-50/40 p-3 rounded-xl border border-orange-100/80 sm:col-span-1">
            <span className="text-orange-700 block text-[11px] font-bold mb-1">
              เป้ายอดขายกิจกรรม
            </span>
            <span className="font-extrabold text-orange-900 block text-xs sm:text-sm">
              {typeof target.targetSales === "number"
                ? `฿${target.targetSales.toLocaleString()}`
                : String(target.targetSales).startsWith("฿")
                  ? target.targetSales
                  : `฿${target.targetSales}`}
            </span>
          </div>
        ) : null}

        {target.targetAttendees ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              เป้าหมายผู้เข้าร่วม
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {target.targetAttendees} คน
            </span>
          </div>
        ) : null}
      </div>

      {/* Target Items Table */}
      {!hideItemsTable && items.length > 0 && (
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-800 text-xs font-bold flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-orange-600" />
              รายการสินค้าเป้าหมาย ({items.length} รายการ)
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                  <th className="py-2 px-3 w-10 text-center">ลำดับ</th>
                  <th className="py-2 px-3">ชื่อสินค้า</th>
                  <th className="py-2 px-3 text-right">จำนวน (ลัง)</th>
                  <th className="py-2 px-3 text-right">ราคา/ลัง</th>
                  <th className="py-2 px-3 text-right">ยอดรวม (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2 px-3 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {item.productName}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-slate-700">
                      {item.quantityCases ?? "-"}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-600">
                      {item.pricePerCase
                        ? `฿${Number(item.pricePerCase).toLocaleString()}`
                        : "-"}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-orange-700 whitespace-nowrap">
                      {item.totalAmount
                        ? `฿${Number(item.totalAmount).toLocaleString()}`
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
