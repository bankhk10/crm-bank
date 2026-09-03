"use client";

import React from "react";
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActualTargetsState } from "@/modules/activity-plans/features/actual-view/types";

interface ApprovalType3SalesProps {
  isVisible: boolean;
  target: ActualTargetsState["t3"];
}

export function ApprovalType3Sales({
  isVisible,
  target,
}: ApprovalType3SalesProps) {
  if (!isVisible) return null;

  return (
    <div className="border border-blue-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
            <Tag className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-blue-900 text-sm sm:text-base">
            เสนอขายสินค้า
          </h4>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-bold bg-blue-50 text-blue-800 border-blue-200"
        >
          TYPE_3
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
        <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100/80 sm:col-span-1">
          <span className="text-blue-700 block text-[11px] font-bold mb-1">
            วัตถุประสงค์ของประเภทงาน
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            เสนอขายสินค้าและเพิ่มยอดขาย
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            ร้านค้าเป้าหมาย
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.customer || "-"}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            เป้ายอดขายรวม
          </span>
          <span className="font-bold text-blue-700 block text-xs sm:text-sm">
            {target.targetSales ? `${target.targetSales} ฿` : "-"}
          </span>
        </div>
      </div>

      {/* Table of proposed products if available */}
      {target.items && target.items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="p-2.5">รายการสินค้า</th>
                <th className="p-2.5 text-right">จำนวน</th>
                <th className="p-2.5 text-right">ราคา/หน่วย</th>
                <th className="p-2.5 text-right">ยอดเงินรวม</th>
                <th className="p-2.5">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {target.items.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="p-2.5 font-semibold text-slate-800">
                    {item.productName}
                  </td>
                  <td className="p-2.5 text-right font-medium">
                    {item.qty ? `${item.qty}` : "-"}
                  </td>
                  <td className="p-2.5 text-right text-slate-600">
                    {item.unitPrice || "-"}
                  </td>
                  <td className="p-2.5 text-right font-bold text-blue-700">
                    {item.price || "-"}
                  </td>
                  <td className="p-2.5 text-slate-600">
                    {item.detail || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        target.product && (
          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
            สินค้าเป้าหมาย: <span className="font-bold">{target.product}</span>
            {target.targetQty && ` (จำนวน ${target.targetQty})`}
          </div>
        )
      )}
    </div>
  );
}
