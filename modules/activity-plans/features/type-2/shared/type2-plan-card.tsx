"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface Type2PlanCardTargetItem {
  id?: string;
  productId?: string;
  productName: string;
  customer?: string;
  storeId?: string;
  detail?: string;
  notes?: string;
  expectedResult?: string;
  isAdditional?: boolean;
}

export interface Type2PlanCardTarget {
  product?: string;
  customer?: string;
  storeName?: string;
  keyFarmer?: string;
  detail?: string;
  expectedResult?: string;
  items?: Type2PlanCardTargetItem[];
}

export interface Type2PlanCardProps {
  planType?: string;
  target?: Type2PlanCardTarget;
  className?: string;
}

export function Type2PlanCard({
  planType,
  target,
  className,
}: Type2PlanCardProps) {
  if (planType === "UNPLANNED" || !target) return null;

  const items = target.items && target.items.length > 0 ? target.items : null;
  const hasMultiple = Boolean(items && items.length > 0);

  return (
    <div
      className={cn(
        "bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          ข้อมูลตามแผนงาน (PLAN)
        </span>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
          {hasMultiple
            ? `เป้าหมายตามแผน ${items!.length} รายการ`
            : "เป้าหมายตามแผน"}
        </span>
      </div>

      {hasMultiple ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {items!.map((item, idx) => {
            const customerDisplay = item.customer || target.customer || "-";
            const itemNotes = item.detail || item.notes;

            return (
              <div
                key={item.id || idx}
                className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm truncate">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-extrabold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate" title={item.productName}>
                      {item.productName || "ไม่ระบุสินค้า"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block text-[11px]">
                      ร้านค้า / ลูกค้า
                    </span>
                    <span
                      className="font-semibold text-slate-800 block truncate"
                      title={customerDisplay}
                    >
                      {customerDisplay}
                    </span>
                  </div>

                  {itemNotes && (
                    <div>
                      <span className="text-slate-400 font-medium block text-[11px]">
                        รายละเอียดสินค้า
                      </span>
                      <p className="font-normal text-slate-700 whitespace-pre-wrap">
                        {itemNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
            <span className="text-slate-400 font-medium block">
              ร้านค้า / ลูกค้า
            </span>
            <span
              className="font-bold text-slate-800 text-sm block truncate"
              title={target.customer || "-"}
            >
              {target.customer || "-"}
            </span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
            <span className="text-slate-400 font-medium block">
              สินค้าที่ต้องการติดตามผล
            </span>
            <span
              className="font-bold text-slate-800 text-sm block truncate"
              title={target.product || "-"}
            >
              {target.product || "-"}
            </span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
            <span className="text-slate-400 font-medium block">
              รายละเอียดเพิ่มเติม
            </span>
            <p className="font-normal text-slate-700 whitespace-pre-wrap">
              {target.detail || "-"}
            </p>
          </div>
        </div>
      )}

      {/* ภาพรวมรายละเอียดเพิ่มเติมของแผน */}
      {hasMultiple && target.detail && (
        <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1 text-xs">
          <span className="text-slate-400 font-medium block">
            รายละเอียดภาพรวมแผนงาน
          </span>
          <p className="font-normal text-slate-700 whitespace-pre-wrap">
            {target.detail}
          </p>
        </div>
      )}
    </div>
  );
}
