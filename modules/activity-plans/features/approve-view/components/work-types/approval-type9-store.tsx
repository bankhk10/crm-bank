"use client";

import React from "react";
import { Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActualTargetsState } from "@/modules/activity-plans/features/actual-view/types";

interface ApprovalType9StoreProps {
  isVisible: boolean;
  target: ActualTargetsState["t9"];
}

export function ApprovalType9Store({
  isVisible,
  target,
}: ApprovalType9StoreProps) {
  if (!isVisible) return null;

  return (
    <div className="border border-orange-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-orange-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-200">
            <Store className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-orange-900 text-sm sm:text-base">
            จัดกิจกรรมส่งเสริมการขายหน้าร้าน
          </h4>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-bold bg-orange-50 text-orange-800 border-orange-200"
        >
          TYPE_9
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
        <div className="bg-orange-50/40 p-3 rounded-xl border border-orange-100/80 sm:col-span-1">
          <span className="text-orange-700 block text-[11px] font-bold mb-1">
            วัตถุประสงค์ของประเภทงาน
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            จัดกิจกรรมส่งเสริมการขายหน้าร้านและกระตุ้นยอดซื้อ
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            ร้านค้าที่จัดกิจกรรม
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.store || "-"}
          </span>
          {target.isSubDealer && target.subDealerStore && (
            <span className="text-[11px] text-slate-500 block">
              (ร้านค้าย่อย: {target.subDealerStore})
            </span>
          )}
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            เป้าหมายผู้เข้าร่วม
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.targetAttendees ? `${target.targetAttendees} คน` : "-"}
          </span>
        </div>
      </div>

      {target.items && target.items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="p-2.5">รายการสินค้า</th>
                <th className="p-2.5 text-right">จำนวน (ลัง)</th>
                <th className="p-2.5 text-right">ราคา/ลัง</th>
                <th className="p-2.5 text-right">ยอดรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {target.items.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="p-2.5 font-semibold text-slate-800">
                    {item.productName}
                  </td>
                  <td className="p-2.5 text-right font-medium">
                    {item.quantityCases || "-"}
                  </td>
                  <td className="p-2.5 text-right text-slate-600">
                    {item.pricePerCase
                      ? `${Number(item.pricePerCase).toLocaleString()} ฿`
                      : "-"}
                  </td>
                  <td className="p-2.5 text-right font-bold text-orange-700">
                    {item.totalAmount
                      ? `${Number(item.totalAmount).toLocaleString()} ฿`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
