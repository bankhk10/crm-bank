"use client";

import React from "react";
import { Search, PackageCheck, Target, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Type7bPlanTarget {
  detail?: string;
  t7bObjective?: string;
  followUpObjective?: string;
  objective?: string;
  plotName?: string;
  owner?: string;
  crop?: string;
  demoProducts?: Array<{
    id?: string;
    productId?: string;
    productName?: string;
    product?: { name?: string; unit?: string | null };
    quantity?: number | string;
    targetQuantity?: number | string;
    unit?: string | null;
    [key: string]: any;
  }>;
  withdrawnProducts?: Array<{
    id?: string;
    productId?: string;
    productName?: string;
    product?: { name?: string; unit?: string | null };
    quantity?: number | string;
    targetQuantity?: number | string;
    unit?: string | null;
    [key: string]: any;
  }>;
  items?: any[];
  [key: string]: any;
}

export interface Type7bPlanCardProps {
  target?: Type7bPlanTarget;
  planType?: string;
  className?: string;
}

export function Type7bPlanCard({
  target,
  planType,
  className = "",
}: Type7bPlanCardProps) {
  if (planType === "UNPLANNED" || !target) return null;

  const demoProducts = target.demoProducts || target.withdrawnProducts || [];
  const objective =
    target.followUpObjective ||
    target.detail ||
    target.t7bObjective ||
    target.objective ||
    "";
  const plotName = target.plotName || target.owner || "";

  return (
    <div
      className={`bg-white border border-blue-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-blue-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
            <Search className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-blue-950 text-sm sm:text-base">
            ข้อมูลตามแผนงาน: ติดตามแปลงสาธิต
          </h4>
        </div>
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-800 border-blue-200 text-[11px] font-semibold px-2.5 py-0.5"
        >
          ข้อมูลตามแผนงาน (PLAN)
        </Badge>
      </div>

      {/* Grid Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        {plotName ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              แปลงสาธิตเป้าหมาย
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {plotName}
            </span>
          </div>
        ) : null}

        {target.crop ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              พืชที่ติดตาม
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {target.crop}
            </span>
          </div>
        ) : null}

        {objective ? (
          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 sm:col-span-2 md:col-span-3">
            <span className="text-blue-800 block text-[11px] font-bold mb-1">
              สิ่งที่ตั้งใจจะไปติดตามรอบนี้
            </span>
            <span className="font-medium text-slate-800 block text-xs sm:text-sm whitespace-pre-wrap">
              {objective}
            </span>
          </div>
        ) : null}
      </div>

      {/* Withdrawn / Demo Products Table */}
      {demoProducts.length > 0 && (
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-800 text-xs font-bold flex items-center gap-1.5">
              <PackageCheck className="h-3.5 w-3.5 text-blue-600" />
              รายการสินค้าที่ขอเบิกสำหรับงานติดตามแปลง ({demoProducts.length}{" "}
              รายการ)
            </span>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                  <th className="py-2 px-3 w-12 text-center">ลำดับ</th>
                  <th className="py-2 px-3">ชื่อสินค้า</th>
                  <th className="py-2 px-3 text-right">จำนวนที่เบิก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {demoProducts.map((p, idx) => (
                  <tr
                    key={p.id || p.productId || idx}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-2 px-3 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {p.productName || p.product?.name || "-"}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-blue-700 whitespace-nowrap">
                      {p.quantity ?? p.targetQuantity ?? "-"}{" "}
                      {p.unit || p.product?.unit || ""}
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
