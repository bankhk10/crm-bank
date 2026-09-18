"use client";

import React from "react";
import { DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ActualTargetsState } from "@/modules/activity-plans/features/shared/actual-view/types";

interface ApprovalType4CollectProps {
  isVisible: boolean;
  target: ActualTargetsState["t4"];
  actualCollectAmount?: number | string | null;
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

export function ApprovalType4Collect({
  isVisible,
  target,
  actualCollectAmount,
}: ApprovalType4CollectProps) {
  if (!isVisible) return null;

  // 1. Target collect amount
  const targetAmount =
    (target as any).targetAmountNum ??
    (target as any).collectAmount ??
    parseCleanAmount(target.targetCollect) ??
    0;

  // 2. Actual collect amount
  const rawActual =
    actualCollectAmount !== undefined
      ? actualCollectAmount
      : (target as any).actualCollectAmount !== undefined
        ? (target as any).actualCollectAmount
        : null;

  const actualAmount = rawActual != null ? parseCleanAmount(rawActual) : null;
  const hasActual = actualAmount != null;

  // 3. Remaining calculation:
  // - ถ้ายอดเก็บเงินจริง >= เป้ายอดเก็บเงิน ไม่ต้องแสดง "ยอดคงค้าง"
  // - ถ้ายังไม่มียอดเก็บเงินจริง ยอดคงค้าง = เป้ายอดเก็บเงิน
  const remainingAmount = hasActual
    ? Math.max(0, targetAmount - actualAmount)
    : targetAmount;

  const showRemaining = !hasActual || actualAmount < targetAmount;

  return (
    <div className="border border-amber-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
            <DollarSign className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-amber-900 text-sm sm:text-base">
            วางบิล / เก็บเงิน
          </h4>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-bold bg-amber-50 text-amber-800 border-amber-200"
        >
          TYPE_4
        </Badge>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs",
          showRemaining
            ? "md:grid-cols-3 lg:grid-cols-5"
            : "md:grid-cols-2 lg:grid-cols-4",
        )}
      >
        <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/80 sm:col-span-1">
          <span className="text-amber-700 block text-[11px] font-bold mb-1">
            วัตถุประสงค์ของประเภทงาน
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.collectType === "BILLING"
              ? "วางบิล"
              : "วางบิลและติดตามยอดเก็บเงิน"}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            ลูกค้า / ร้านค้า
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.customer || "-"}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            เป้ายอดเก็บเงิน
          </span>
          <span className="font-bold text-amber-700 block text-xs sm:text-sm">
            {targetAmount > 0
              ? `${targetAmount.toLocaleString()} ฿`
              : target.targetCollect &&
                  parseCleanAmount(target.targetCollect) != null
                ? `${parseCleanAmount(target.targetCollect)!.toLocaleString()} ฿`
                : "-"}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            ยอดเก็บเงินจริง
          </span>
          <span className="font-bold text-emerald-700 block text-xs sm:text-sm">
            {hasActual ? `${actualAmount.toLocaleString()} ฿` : "-"}
          </span>
        </div>

        {showRemaining && (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              ยอดคงค้าง
            </span>
            <span className="font-bold text-rose-700 block text-xs sm:text-sm">
              {`${remainingAmount.toLocaleString()} ฿`}
            </span>
          </div>
        )}
      </div>

      {/* Multiple Companies Breakdown if applicable */}
      {target.items && target.items.length > 1 && (
        <div className="bg-slate-50/60 rounded-xl p-2.5 border border-slate-100 space-y-1.5">
          <span className="text-[11px] font-bold text-slate-600 block">
            เป้าหมายแยกตามร้านค้า ({target.items.length} ร้านค้า):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {target.items.map((item, idx) => {
              const itemAmt =
                item.targetAmountNum ??
                (item as any).collectAmount ??
                parseCleanAmount(item.targetCollect) ??
                0;
              return (
                <div
                  key={idx}
                  className="bg-white p-2 rounded-lg border border-slate-200/80 flex items-center justify-between font-medium"
                >
                  <span className="truncate text-slate-800">
                    {idx + 1}. {item.companyName}
                  </span>
                  <span className="text-amber-700 font-bold ml-2 shrink-0">
                    {itemAmt > 0 ? `${itemAmt.toLocaleString()} ฿` : "-"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
