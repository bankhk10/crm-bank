"use client";

import React from "react";
import { Receipt, DollarSign, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Type4PlanCardTargetItem {
  id?: string;
  customer?: string;
  companyName?: string;
  storeName?: string;
  storeId?: string;
  collectType?: "BILLING" | "COLLECT";
  targetCollect?: string;
  targetAmountNum?: number;
  collectAmount?: number;
  detail?: string;
  notes?: string;
  [key: string]: any;
}

export interface Type4PlanCardTarget {
  customer?: string;
  orderNo?: string;
  targetCollect?: string;
  targetAmountNum?: number;
  collectAmount?: number;
  actualCollectAmount?: number | null;
  collectType?: "BILLING" | "COLLECT";
  detail?: string;
  notes?: string;
  items?: Type4PlanCardTargetItem[];
  [key: string]: any;
}

export interface Type4PlanCardProps {
  planType?: string;
  target?: Type4PlanCardTarget | null;
  className?: string;
}

function parseCleanAmount(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return isNaN(val) ? null : val;
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  if (trimmed === "" || trimmed === "-") return null;
  const sanitized = trimmed.replace(/,/g, "").replace(/[^\d.-]/g, "");
  if (sanitized === "" || sanitized === "-" || sanitized === ".") return null;
  const num = parseFloat(sanitized);
  return isNaN(num) ? null : num;
}

export function Type4PlanCard({
  planType,
  target,
  className,
}: Type4PlanCardProps) {
  if (planType === "UNPLANNED" || !target) return null;

  // Normalize company/store items
  const companyItems: Type4PlanCardTargetItem[] =
    target.items && target.items.length > 0
      ? target.items
      : target.customer
        ? [
            {
              id: "c-0",
              companyName: target.customer,
              customer: target.customer,
              collectType: target.collectType || "COLLECT",
              targetCollect: target.targetCollect,
              targetAmountNum:
                target.targetAmountNum ??
                target.collectAmount ??
                parseCleanAmount(target.targetCollect) ??
                0,
              detail: target.detail || target.notes,
            },
          ]
        : [];

  const targetAmount =
    target.targetAmountNum ??
    target.collectAmount ??
    parseCleanAmount(target.targetCollect) ??
    companyItems.reduce((sum, item) => {
      const amt =
        item.targetAmountNum ??
        item.collectAmount ??
        parseCleanAmount(item.targetCollect) ??
        0;
      return sum + amt;
    }, 0);

  const primaryPurpose =
    target.collectType === "BILLING"
      ? "วางบิล"
      : target.collectType === "COLLECT"
        ? "วางบิลและติดตามยอดเก็บเงิน"
        : companyItems.some((it) => it.collectType === "BILLING")
          ? "วางบิล / เก็บเงิน"
          : "วางบิลและติดตามยอดเก็บเงิน";

  const customerName =
    target.customer ||
    companyItems
      .map((it) => it.companyName || it.customer)
      .filter(Boolean)
      .join(", ") ||
    "-";

  const isDetailDuplicate =
    companyItems.length === 1 &&
    Boolean(target.detail) &&
    (companyItems[0].detail === target.detail ||
      companyItems[0].notes === target.detail);

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
            รายการวางบิล / เก็บเงิน
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
        {/* วัตถุประสงค์ของประเภทงาน */}
        <div className="space-y-1 min-w-0">
          <span className="text-slate-400 font-medium block text-[11px]">
            วัตถุประสงค์ของประเภทงาน
          </span>
          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs sm:text-sm">
            <Receipt className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{primaryPurpose}</span>
          </div>
        </div>

        {/* ลูกค้า / ร้านค้า */}
        <div className="space-y-1 min-w-0">
          <span className="text-slate-400 font-medium block text-[11px]">
            ลูกค้า / ร้านค้า
          </span>
          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs sm:text-sm">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate" title={customerName}>
              {customerName}
            </span>
          </div>
        </div>

        {/* เลขที่เอกสาร / Order No (ถ้ามี) */}
        {target.orderNo ? (
          <div className="space-y-1 min-w-0">
            <span className="text-slate-400 font-medium block text-[11px]">
              เลขที่เอกสาร / Order No
            </span>
            <span className="font-bold text-slate-800 text-xs sm:text-sm block truncate">
              {target.orderNo}
            </span>
          </div>
        ) : null}

        {/* เป้ายอดเก็บเงินรวม (ถ้ามี) */}
        {targetAmount > 0 || (target.targetCollect && target.targetCollect !== "-") ? (
          <div className="space-y-1 min-w-0">
            <span className="text-slate-400 font-medium block text-[11px]">
              เป้ายอดเก็บเงินรวม
            </span>
            <div className="flex items-center gap-1 font-bold text-indigo-950 text-xs sm:text-sm">
              <DollarSign className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>
                {targetAmount > 0
                  ? `${targetAmount.toLocaleString()} บาท`
                  : target.targetCollect}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION: รายการบริษัท / ร้านค้า (Divided List) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {companyItems.length > 0 && (
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>เป้าหมายแยกตามบริษัท / ร้านค้า</span>
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {targetAmount > 0 && (
                <span className="text-[11px] font-medium text-slate-500">
                  รวม {targetAmount.toLocaleString()} บาท
                </span>
              )}
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
                {companyItems.length} ร้านค้า
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {companyItems.map((item, idx) => {
              const isBilling = item.collectType === "BILLING";
              const itemAmt =
                item.targetAmountNum ??
                item.collectAmount ??
                parseCleanAmount(item.targetCollect) ??
                0;
              const itemDisplayName =
                item.companyName || item.customer || item.storeName || "-";
              const itemNotes = item.detail || item.notes;

              return (
                <div
                  key={item.id || idx}
                  className="py-2.5 first:pt-1 last:pb-0 space-y-1.5"
                >
                  {/* Row 1: Item Index + Store Name + Type & Target Amount */}
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span
                        className="font-bold text-slate-900 text-xs sm:text-sm break-words"
                        title={itemDisplayName}
                      >
                        {itemDisplayName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5",
                          isBilling
                            ? "bg-sky-50 text-sky-800 border-sky-200"
                            : "bg-amber-50 text-amber-800 border-amber-200",
                        )}
                      >
                        {isBilling ? "วางบิล" : "เก็บเงิน"}
                      </Badge>

                      {!isBilling && (itemAmt > 0 || item.targetCollect) && (
                        <span className="text-xs font-bold text-indigo-950 bg-indigo-50/70 border border-indigo-100 px-2.5 py-0.5 rounded-md">
                          <span className="text-[10px] text-slate-400 font-normal mr-1">
                            เป้า:
                          </span>
                          {itemAmt > 0
                            ? `${itemAmt.toLocaleString()} บาท`
                            : item.targetCollect}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notes / Details (if any) */}
                  {itemNotes && (
                    <div className="pl-6 text-xs">
                      <div className="text-slate-600 bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-100/90 text-[11px] leading-relaxed whitespace-pre-wrap break-words">
                        <span className="text-slate-400 font-medium block text-[10px]">
                          รายละเอียดเพิ่มเติม:
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
