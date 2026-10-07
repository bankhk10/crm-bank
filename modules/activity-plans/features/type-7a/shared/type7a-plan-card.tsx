"use client";

import React from "react";
import { Sprout, MapPin, Target, Package, Layers, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Type7aPlanTarget {
  plotName?: string;
  owner?: string;
  dealerName?: string;
  location?: string;
  province?: string;
  district?: string;
  objective?: string;
  categoryName?: string;
  categoryCode?: string;
  chemicalGroupName?: string;
  cropCategory?: string;
  crop?: string;
  cropName?: string;
  areaRai?: number | string | null;
  treeCount?: number | string | null;
  plots?: string;
  demoProducts?: Array<{
    productName?: string;
    quantity?: number | string;
    unit?: string | null;
    [key: string]: any;
  }>;
  items?: any[];
  [key: string]: any;
}

export interface Type7aPlanCardProps {
  target?: Type7aPlanTarget;
  planType?: string;
  className?: string;
}

export function Type7aPlanCard({
  target,
  planType,
  className = "",
}: Type7aPlanCardProps) {
  if (planType === "UNPLANNED" || !target) return null;

  const categoryLabel = target.categoryName
    ? target.categoryCode
      ? `${target.categoryCode} - ${target.categoryName}`
      : target.categoryName
    : target.chemicalGroupName || "";

  const areaOrTree = target.areaRai
    ? `${target.areaRai} ไร่`
    : target.treeCount
      ? `${target.treeCount} ต้น`
      : target.plots || "";

  const locationText = [target.province, target.district]
    .filter(Boolean)
    .join(" / ");

  const cropText = [target.cropCategory, target.crop || target.cropName]
    .filter(Boolean)
    .join(" • ");

  const demoProducts = target.demoProducts || [];
  const plotDisplayName = target.plotName || target.owner || "";
  const dealerDisplayName = target.dealerName || "";

  return (
    <div
      className={`bg-white border border-emerald-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            <Sprout className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-emerald-950 text-sm sm:text-base">
            ข้อมูลตามแผนงาน: ทำแปลงสาธิต (เริ่มทำแปลงใหม่)
          </h4>
        </div>
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px] font-semibold px-2.5 py-0.5"
        >
          ข้อมูลตามแผนงาน (PLAN)
        </Badge>
      </div>

      {/* Grid Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        {plotDisplayName ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              ชื่อแปลง
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {plotDisplayName}
            </span>
          </div>
        ) : null}

        {dealerDisplayName ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              ร้าน Dealer
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {dealerDisplayName}
            </span>
          </div>
        ) : null}

        {locationText ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              จังหวัด / อำเภอ
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {locationText}
            </span>
          </div>
        ) : null}

        {categoryLabel ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              หมวดสินค้า
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {categoryLabel}
            </span>
          </div>
        ) : null}

        {cropText ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              หมวดพืช & ชื่อพืช
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {cropText}
            </span>
          </div>
        ) : null}

        {areaOrTree ? (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              ขนาดพื้นที่ / จำนวนต้น
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {areaOrTree}
            </span>
          </div>
        ) : null}

        {target.objective ? (
          <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/80 sm:col-span-2 md:col-span-3">
            <span className="text-emerald-800 block text-[11px] mb-1 font-bold">
              วัตถุประสงค์การทำแปลง
            </span>
            <span className="font-medium text-slate-800 block text-xs sm:text-sm whitespace-pre-wrap">
              {target.objective}
            </span>
          </div>
        ) : null}
      </div>

      {/* Demo Products Table */}
      {demoProducts.length > 0 && (
        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-800 text-xs font-bold flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-600" />
              สินค้าที่จะสาธิต ({demoProducts.length} รายการ)
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
                {demoProducts.map((p, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-2 px-3 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {p.productName || "-"}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                      {p.quantity ?? "-"} {p.unit || ""}
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
