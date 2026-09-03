"use client";

import React from "react";
import { Package, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";

export interface StockCheckItem {
  id?: string;
  storeName?: string;
  productName: string;
  productCode?: string;
  remainingQty: string;
  remarks: string;
  isCustom?: boolean;
}

interface DetailType11StockProps {
  isVisible: boolean;
  target: {
    store: string;
    detail: string;
    targetOpportunity: string;
  };
  productList?: string;
  remainingQty?: string;
  remarks?: string;
  stockItems?: StockCheckItem[];
  stockStatus?: "ใกล้หมด" | "ขาดสต็อก" | "";
  reorderOpportunity?: "สูง" | "ยังไม่แน่ใจ" | "ต่ำ" | "";
  nextAction?: string;
}

export function DetailType11Stock({
  isVisible,
  target,
  productList = "",
  remainingQty = "",
  remarks = "",
  stockItems = [],
  stockStatus,
  reorderOpportunity,
  nextAction,
}: DetailType11StockProps) {
  const groupedByStore = React.useMemo(() => {
    if (!stockItems || stockItems.length === 0) return null;
    const groups: Record<string, StockCheckItem[]> = {};
    stockItems.forEach((item) => {
      const sName = item.storeName || "ร้านค้า";
      if (!groups[sName]) groups[sName] = [];
      groups[sName].push(item);
    });
    return groups;
  }, [stockItems]);

  if (!isVisible) return null;

  return (
    <div className="border border-slate-300 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
            <Package className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-slate-900 text-base md:text-lg">
            ตรวจเช็กสต็อกหน้าร้าน
          </h2>
        </div>
      </div>

      {/* PLANNED TARGET CARD */}
      <ActualTargetCard
        iconColorClass="text-slate-600"
        badgeColorClass="bg-slate-100 text-slate-800 border border-slate-200"
        gridColsClass="grid-cols-1"
        items={[
          { label: "ร้านค้าที่ตรวจเช็กสต็อก:", value: target.store || "-" },
        ]}
      />

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-slate-600"></span>
          <span>ผลการตรวจเช็กสต็อกจริง</span>
        </div>

        {/* STOCK TABLE OR FALLBACK */}
        {groupedByStore ? (
          <div className="space-y-4">
            {Object.entries(groupedByStore).map(([storeName, items], gIdx) => (
              <div
                key={`${storeName}-${gIdx}`}
                className="space-y-2 rounded-xl border border-slate-200 p-3.5 bg-slate-50/50"
              >
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    ร้าน: {storeName} ({items.length} รายการ)
                  </span>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10">ลำดับ</th>
                        <th className="py-2.5 px-3">ชื่อสินค้า</th>
                        <th className="py-2.5 px-3 text-center w-36">
                          จำนวนคงเหลือ
                        </th>
                        <th className="py-2.5 px-3">หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/40">
                          <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {item.productName}
                            {item.productCode && (
                              <span className="ml-2 text-[10px] text-slate-500 font-normal">
                                ({item.productCode})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                            {item.remainingQty ? `${item.remainingQty} ลัง` : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {item.remarks || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : productList ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-slate-500 font-medium block">
                สินค้าที่ตรวจสต็อก
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
                {productList}
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-slate-500 font-medium block">
                จำนวนคงเหลือ
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                {remainingQty || "-"}
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-slate-500 font-medium block">
                หมายเหตุ
              </span>
              <span className="text-xs sm:text-sm text-slate-700 block">
                {remarks || "-"}
              </span>
            </div>
          </div>
        ) : null}

        {/* STATUS & NEXT ACTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-1">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              สถานะสต็อกโดยรวม
            </span>
            {stockStatus ? (
              <Badge
                variant="outline"
                className={
                  stockStatus === "ใกล้หมด"
                    ? "bg-amber-50 text-amber-800 border-amber-300 font-bold text-xs"
                    : "bg-rose-50 text-rose-800 border-rose-300 font-bold text-xs"
                }
              >
                {stockStatus}
              </Badge>
            ) : (
              <span className="text-xs text-slate-700 font-semibold">-</span>
            )}
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              โอกาสการสั่งซื้อซ้ำ
            </span>
            {reorderOpportunity ? (
              <Badge
                variant="outline"
                className={
                  reorderOpportunity === "สูง"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs"
                    : reorderOpportunity === "ยังไม่แน่ใจ"
                      ? "bg-amber-50 text-amber-800 border-amber-300 font-bold text-xs"
                      : "bg-slate-100 text-slate-800 border-slate-300 font-bold text-xs"
                }
              >
                {reorderOpportunity}
              </Badge>
            ) : (
              <span className="text-xs text-slate-700 font-semibold">-</span>
            )}
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-1">
            <span className="text-xs text-slate-500 font-medium block flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-slate-400" />
              สิ่งที่ต้องดำเนินการต่อ
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {nextAction || "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
