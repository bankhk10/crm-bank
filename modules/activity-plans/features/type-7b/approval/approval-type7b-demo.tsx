"use client";

import React from "react";
import { Search, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActualTargetsState } from "@/modules/activity-plans/features/shared/actual-view/types";

export interface ApprovalType7bDemoProps {
  isVisible: boolean;
  target: ActualTargetsState["t7"] | any;
}

export function ApprovalType7bDemo({
  isVisible,
  target,
}: ApprovalType7bDemoProps) {
  if (!isVisible) return null;

  const demoProducts = target.demoProducts || target.withdrawnProducts || [];

  return (
    <div className="border border-green-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-green-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-200">
            <Search className="w-4 h-4 text-blue-600" />
          </div>
          <h4 className="font-bold text-green-900 text-sm sm:text-base">
            ติดตามแปลงสาธิต
          </h4>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-bold bg-green-50 text-green-800 border-green-200"
        >
          TYPE_7B
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* สิ่งที่ตั้งใจจะไปติดตามรอบนี้ */}
        <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100/80 sm:col-span-3">
          <span className="text-emerald-700 block text-[11px] font-bold mb-1">
            สิ่งที่ตั้งใจจะไปติดตามรอบนี้
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm whitespace-pre-wrap">
            {target.detail || target.t7bObjective || "-"}
          </span>
        </div>

        {/* วัตถุประสงค์ของแปลง */}
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            วัตถุประสงค์ของแปลง
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.objective ||
              "ทดสอบและสาธิตประสิทธิภาพผลิตภัณฑ์ในแปลงจริง"}
          </span>
        </div>

        {/* เจ้าของแปลง */}
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            เจ้าของแปลง
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.owner || "-"}
          </span>
        </div>

        {/* ร้าน Dealer */}
        {target.dealerName && (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              ร้าน Dealer
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {target.dealerName}
            </span>
          </div>
        )}

        {/* พืชปลูก & ผลิตภัณฑ์ */}
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            พืชปลูก & ผลิตภัณฑ์
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {[target.crop, target.product].filter(Boolean).join(" • ") || "-"}
          </span>
        </div>

        {target.plots && (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              ขนาดพื้นที่ / จำนวน
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {target.plots}
            </span>
          </div>
        )}

        {target.experimentDetail && (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-2">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              รายละเอียด / วิธีการทดลอง
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {target.experimentDetail}
            </span>
          </div>
        )}
      </div>

      {demoProducts.length > 0 && (
        <div className="mt-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-800 text-[11px] font-bold flex items-center gap-1.5">
              <PackageCheck className="h-3.5 w-3.5 text-emerald-600" />
              รายการสินค้าที่ขอเบิกสำหรับงานติดตามแปลง ({demoProducts.length} รายการ)
            </span>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                  <th className="py-2 px-3 w-12 text-center">ลำดับ</th>
                  <th className="py-2 px-3">ชื่อสินค้า</th>
                  <th className="py-2 px-3 text-right">จำนวน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {demoProducts.map((p: any, idx: number) => (
                  <tr
                    key={p.id || p.productId || idx}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-2 px-3 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800">
                      {p.productName || p.product?.name || "-"}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                      {p.quantity ?? p.targetQuantity ?? "-"} {p.unit || p.product?.unit || ""}
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
