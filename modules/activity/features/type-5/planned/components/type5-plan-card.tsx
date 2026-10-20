"use client";

import React from "react";
import { Search, Store, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  Type5PlanCardProps,
  Type5PlanCardTarget,
  Type5PlanCardTargetItem,
} from "../types/planned.types";

export type {
  Type5PlanCardProps,
  Type5PlanCardTarget,
  Type5PlanCardTargetItem,
};

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
        "rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3.5",
        className,
      )}
    >
      {/* ───────────────────────────────────────────────────────────── */}
      {/* HEADER: ชื่อประเภทงาน & Badge จำนวน */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
            <Search className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              สำรวจตลาดของคู่แข่ง (Type 5)
            </h4>
            <p className="text-[11px] text-slate-500">
              รายการสินค้าและร้านค้าเป้าหมายที่จะเข้าสำรวจ
            </p>
          </div>
        </div>

        {surveyItems.length > 0 && (
          <Badge
            variant="outline"
            className="text-[10px] font-semibold bg-purple-50 text-purple-700 border-purple-200"
          >
            {surveyItems.length} รายการ
          </Badge>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SUMMARY INFO: ร้านค้า & สินค้าหลัก */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-100 flex items-start gap-2">
          <Store className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 block font-medium">
              ร้านค้าเป้าหมาย
            </span>
            <span
              className="font-semibold text-slate-800 text-xs truncate block"
              title={mainStore}
            >
              {mainStore}
            </span>
          </div>
        </div>

        <div className="bg-slate-50/60 p-2.5 rounded-lg border border-slate-100 flex items-start gap-2">
          <Package className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 block font-medium">
              สินค้าที่นำไปเปรียบเทียบ
            </span>
            <span
              className="font-semibold text-slate-800 text-xs truncate block"
              title={mainProduct}
            >
              {mainProduct}
            </span>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* LIST OF SURVEY TARGETS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {surveyItems.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
            <span>รายการสินค้าเป้าหมาย</span>
            <span className="text-[10px] text-slate-400 font-normal">
              เปรียบเทียบสินค้า
            </span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg px-3 bg-white">
            {surveyItems.map((item, idx) => {
              const itemProduct =
                item.product ||
                item.productName ||
                "สินค้าที่นำไปเปรียบเทียบ";
              const itemStore =
                item.store || item.storeName || "ร้านค้า / ลูกค้า";
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
