"use client";

import React from "react";
import { Users, ShoppingBag, Target, Package, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Type8PlanTarget {
  topic?: string;
  products?: string;
  targetAttendees?: number | string;
  customer?: string;
  dealerName?: string;
  subDealerStore?: string;
  detail?: string;
  targetProducts?: string[];
  promotionalProducts?: Array<{
    id?: string;
    productId?: string;
    productName: string;
    quantity?: number | string;
    quantityCases?: number | string;
    unitPrice?: number;
    pricePerCase?: number;
    totalAmount?: number;
    notes?: string;
    storeId?: string | null;
  }>;
  items?: any[];
  [key: string]: any;
}

export interface Type8PlanCardProps {
  target?: Type8PlanTarget;
  planType?: string;
  className?: string;
  hidePromotionsTable?: boolean;
}

export function Type8PlanCard({
  target,
  planType,
  className = "",
  hidePromotionsTable = false,
}: Type8PlanCardProps) {
  if (planType === "UNPLANNED" || !target) return null;

  const targetProductsList =
    target.targetProducts && target.targetProducts.length > 0
      ? target.targetProducts
      : target.products
        ? target.products.split(", ").filter(Boolean)
        : [];

  const promotionalProducts = target.promotionalProducts || [];
  const storeDisplay =
    target.customer || target.dealerName || target.subDealerStore || "";

  return (
    <div
      className={`bg-white border border-indigo-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200">
            <Users className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-indigo-950 text-sm sm:text-base">
            ข้อมูลตามแผนงาน: จัดประชุม / สัมมนา
          </h4>
        </div>
        <Badge
          variant="outline"
          className="bg-indigo-50 text-indigo-800 border-indigo-200 text-[11px] font-semibold px-2.5 py-0.5"
        >
          ข้อมูลตามแผนงาน (PLAN)
        </Badge>
      </div>

      {/* Grid Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        {target.topic ? (
          <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/80 sm:col-span-1">
            <span className="text-indigo-700 block text-[11px] font-bold mb-1">
              วัตถุประสงค์ / หัวข้อประชุม
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {target.topic}
            </span>
          </div>
        ) : null}

        {storeDisplay ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              ร้านค้า / ตัวแทนจำหน่าย
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {storeDisplay}
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

        {target.detail ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-2 md:col-span-3">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              รายละเอียดเพิ่มเติม
            </span>
            <span className="font-medium text-slate-800 block text-xs whitespace-pre-wrap">
              {target.detail}
            </span>
          </div>
        ) : null}
      </div>

      {/* Target Products (สินค้าเป้าหมาย) */}
      {targetProductsList.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-700 block">
            สินค้าเป้าหมาย ({targetProductsList.length} รายการ)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {targetProductsList.map((p, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="bg-indigo-50/60 text-indigo-700 border-indigo-200 text-xs px-2.5 py-1 font-semibold"
              >
                {p}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Promotional Products Table */}
      {!hidePromotionsTable && promotionalProducts.length > 0 && (
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-800 text-xs font-bold flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
              รายการสินค้าโปรโมชัน ({promotionalProducts.length} รายการ)
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                  <th className="py-2 px-3 text-center w-10">ลำดับ</th>
                  <th className="py-2 px-3">ชื่อสินค้า</th>
                  <th className="py-2 px-3 text-center w-24">จำนวน</th>
                  <th className="py-2 px-3 text-right w-28">ราคาต่อหน่วย</th>
                  <th className="py-2 px-3 text-right w-32">รวม (บาท)</th>
                  <th className="py-2 px-3">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {promotionalProducts.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2 px-3 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {item.productName}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-700 font-medium">
                      {item.quantity ?? item.quantityCases ?? "-"}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700">
                      {item.unitPrice || item.pricePerCase
                        ? `฿${(item.unitPrice || item.pricePerCase || 0).toLocaleString()}`
                        : "-"}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-indigo-900">
                      {item.totalAmount
                        ? `฿${item.totalAmount.toLocaleString()}`
                        : "-"}
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      {item.notes || "-"}
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
