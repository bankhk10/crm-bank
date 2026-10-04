"use client";

import React from "react";
import { Search, Store, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Type5PlanCardTargetItem {
  id?: string;
  storeId?: string;
  store?: string;
  storeName?: string;
  productId?: string;
  product?: string;
  productName?: string;
  detail?: string;
  notes?: string;
  [key: string]: any;
}

export interface Type5PlanCardTarget {
  store?: string;
  storeId?: string;
  product?: string;
  productId?: string;
  detail?: string;
  notes?: string;
  items?: Type5PlanCardTargetItem[];
  [key: string]: any;
}

export interface Type5PlanCardProps {
  planType?: string;
  target?: Type5PlanCardTarget | null;
  className?: string;
}

export function Type5PlanCard({
  planType,
  target,
  className,
}: Type5PlanCardProps) {
  if (planType === "UNPLANNED" || !target) return null;

  // Normalize survey items
  const surveyItems: Type5PlanCardTargetItem[] =
    target.items && target.items.length > 0
      ? target.items
      : target.store || target.product
        ? [
            {
              id: "s-0",
              store: target.store,
              product: target.product,
              detail: target.detail || target.notes,
            },
          ]
        : [];

  const mainStore =
    target.store ||
    surveyItems
      .map((it) => it.store || it.storeName)
      .filter(Boolean)
      .join(", ") ||
    "-";

  const mainProduct =
    target.product ||
    surveyItems
      .map((it) => it.product || it.productName)
      .filter(Boolean)
      .join(", ") ||
    "-";

  const isDetailDuplicate =
    surveyItems.length === 1 &&
    Boolean(target.detail) &&
    (surveyItems[0].detail === target.detail ||
      surveyItems[0].notes === target.detail);

  return (
    <div
      className={cn(
        "bg-white border border-indigo-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs",
        className,
      )}
    >
      {/* ───────────────────────────────────────────────────────────── */}
      {/* HEADER: Item Title & Plan Badge */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100/80 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-extrabold shrink-0">
            1
          </span>
          <h4 className="font-bold text-indigo-950 text-sm sm:text-base truncate">
            รายการสำรวจตลาดของคู่แข่ง
          </h4>
        </div>

        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          ข้อมูลตามแผนงาน (PLAN)
        </span>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION: ข้อมูลทั่วไป & วัตถุประสงค์ (Flat Clean Grid) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        {/* วัตถุประสงค์ของประเภทงาน */}
        <div className="space-y-1 min-w-0">
          <span className="text-slate-400 font-medium block text-[11px]">
            วัตถุประสงค์ของประเภทงาน
          </span>
          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs sm:text-sm">
            <Search className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>สำรวจตลาดและเปรียบเทียบราคาสินค้าคู่แข่ง</span>
          </div>
        </div>

        {/* ร้านค้าที่สำรวจ */}
        <div className="space-y-1 min-w-0">
          <span className="text-slate-400 font-medium block text-[11px]">
            ร้านค้าที่สำรวจ (เป้าหมาย)
          </span>
          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs sm:text-sm">
            <Store className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate" title={mainStore}>
              {mainStore}
            </span>
          </div>
        </div>

        {/* สินค้าเปรียบเทียบ */}
        <div className="space-y-1 min-w-0">
          <span className="text-slate-400 font-medium block text-[11px]">
            สินค้าเปรียบเทียบ (เป้าหมาย)
          </span>
          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs sm:text-sm">
            <Package className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate" title={mainProduct}>
              {mainProduct}
            </span>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION: รายการสินค้า/ร้านค้าที่จะสำรวจ (กรณีมีหลายรายการ) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {surveyItems.length > 1 && (
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>รายการสินค้าและร้านค้าเป้าหมาย</span>
            </span>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
              {surveyItems.length} รายการ
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {surveyItems.map((item, idx) => {
              const itemStore = item.store || item.storeName || "-";
              const itemProduct = item.product || item.productName || "-";
              const itemNotes = item.detail || item.notes;

              return (
                <div
                  key={item.id || idx}
                  className="py-2.5 first:pt-1 last:pb-0 space-y-1.5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <span
                          className="font-bold text-slate-900 text-xs sm:text-sm break-words block"
                          title={itemProduct}
                        >
                          {itemProduct}
                        </span>
                        <span className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Store className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{itemStore}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {itemNotes && (
                    <div className="pl-6 text-xs">
                      <div className="text-slate-600 bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100/90 text-[11px] leading-relaxed whitespace-pre-wrap break-words">
                        <span className="text-slate-400 font-medium block text-[10px]">
                          รายละเอียดจากแผน:
                        </span>
                        {itemNotes}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION: รายละเอียดเพิ่มเติม (ภาพรวมแผนงาน) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {target.detail && !isDetailDuplicate && (
        <div className="pt-2.5 border-t border-slate-100 space-y-1 text-xs">
          <span className="text-slate-400 font-medium block text-[11px]">
            รายละเอียดเพิ่มเติม (ภาพรวมแผนงาน)
          </span>
          <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 text-slate-700 text-xs leading-relaxed whitespace-pre-wrap break-words">
            {target.detail}
          </div>
        </div>
      )}
    </div>
  );
}
