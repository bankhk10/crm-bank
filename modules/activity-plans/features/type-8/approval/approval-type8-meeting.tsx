"use client";

import React from "react";
import { Users, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActualTargetsState } from "@/modules/activity-plans/features/shared/actual-view/types";

interface ApprovalType8MeetingProps {
  isVisible: boolean;
  target: ActualTargetsState["t8"];
}

export function ApprovalType8Meeting({
  isVisible,
  target,
}: ApprovalType8MeetingProps) {
  if (!isVisible) return null;

  const targetProductsList =
    target.targetProducts && target.targetProducts.length > 0
      ? target.targetProducts
      : target.products
        ? target.products.split(", ").filter(Boolean)
        : [];

  const promotionalProducts = target.promotionalProducts || [];

  return (
    <div className="border border-indigo-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200">
            <Users className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-indigo-900 text-sm sm:text-base">
            จัดประชุม
          </h4>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-bold bg-indigo-50 text-indigo-800 border-indigo-200"
        >
          TYPE_8
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/80 sm:col-span-1">
          <span className="text-indigo-700 block text-[11px] font-bold mb-1">
            วัตถุประสงค์ / หัวข้อประชุม
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.topic || "-"}
          </span>
        </div>

        {target.customer ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              ร้านค้า / ตัวแทนจำหน่าย
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {target.customer}
            </span>
          </div>
        ) : null}

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            เป้าหมายผู้เข้าร่วม
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.targetAttendees ? `${target.targetAttendees} คน` : "-"}
          </span>
        </div>

        {target.detail ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-3">
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
            สินค้าเป้าหมาย ({targetProductsList.length}/5 รายการ)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {targetProductsList.map((p, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2.5 py-1 font-semibold"
              >
                {p}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Promotional Products Table */}
      {promotionalProducts.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
            รายการสินค้าโปรโมชัน ({promotionalProducts.length} รายการ)
          </span>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 text-center w-10">ลำดับ</th>
                  <th className="py-2 px-3">ชื่อสินค้า</th>
                  <th className="py-2 px-3 text-center w-24">จำนวน</th>
                  <th className="py-2 px-3 text-right w-28">ราคาต่อหน่วย</th>
                  <th className="py-2 px-3 text-right w-32">รวม (บาท)</th>
                  <th className="py-2 px-3">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promotionalProducts.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40">
                    <td className="py-2 px-3 text-center text-slate-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {item.productName}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-700 font-medium">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700">
                      {item.unitPrice ? `฿${item.unitPrice.toLocaleString()}` : "-"}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-indigo-900">
                      {item.totalAmount ? `฿${item.totalAmount.toLocaleString()}` : "-"}
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
