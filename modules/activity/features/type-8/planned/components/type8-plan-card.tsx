"use client";

import React from "react";
import { Users, ShoppingBag, Target, Package, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Type8PlanCardProps, Type8PlanTarget } from "../types/planned.types";

export type { Type8PlanTarget };

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
            ข้อมูลตามแผนงาน: จัดประชุม / สัมมนา (Type 8)
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
            <span className="font-bold text-indigo-900 block text-xs sm:text-sm">
              {target.targetAttendees}
            </span>
          </div>
        ) : null}

        {targetProductsList.length > 0 ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-2 md:col-span-3">
            <span className="text-slate-500 block text-[11px] font-medium mb-1.5 flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
              สินค้าเป้าหมายที่จะแนะนำ ({targetProductsList.length} รายการ):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {targetProductsList.map((prodName: string, idx: number) => (
                <span
                  key={idx}
                  className="bg-white border border-slate-200 text-slate-800 text-[11px] px-2.5 py-1 rounded-lg font-medium shadow-2xs"
                >
                  {prodName}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {target.detail ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-2 md:col-span-3">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              รายละเอียดเพิ่มเติม / กำหนดการ
            </span>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
              {target.detail}
            </p>
          </div>
        ) : null}
      </div>

      {/* Promotional Products Section */}
      {!hidePromotionsTable && promotionalProducts.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Package className="w-4 h-4 text-indigo-600" />
            <span>รายการโปรโมชันในงานประชุม ({promotionalProducts.length} รายการ)</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold w-12 text-center">ลำดับ</th>
                  <th className="py-2.5 px-3 font-semibold">รายละเอียดโปรโมชัน / สินค้า</th>
                  <th className="py-2.5 px-3 font-semibold text-center w-28">จำนวน (ลัง)</th>
                  <th className="py-2.5 px-3 font-semibold text-right w-32">ราคา/ลัง (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {promotionalProducts.map((promo, idx) => {
                  const qty = Number(promo.quantityCases || promo.quantity || 0);
                  const price = Number(promo.pricePerCase || promo.unitPrice || 0);
                  const name = promo.productName || promo.notes || "สินค้าโปรโมชัน";

                  return (
                    <tr key={promo.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {name}
                        {promo.notes && promo.productName && (
                          <span className="block text-[11px] text-slate-500 font-normal">
                            {promo.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-700 font-medium">
                        {qty > 0 ? `${qty} ลัง` : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-indigo-950">
                        {price > 0 ? `${price.toLocaleString()} บ.` : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
