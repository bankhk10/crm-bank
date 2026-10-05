"use client";

import React from "react";
import { Building2, Receipt, ImageIcon } from "lucide-react";
import { ActualTargetCard } from "@/modules/activity-plans/features/shared/actual-view/components/actual-target-card";
import { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";
import { Type4PlanCard } from "../shared/type4-plan-card";

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

import type {
  TargetCollectCompanyItem,
  DetailType4CollectProps,
} from "../actual/types";

export type { TargetCollectCompanyItem, DetailType4CollectProps };

export function DetailType4Collect({
  isVisible,
  target,
  orderNo,
  receivedAmount,
  paymentImages = [],
}: DetailType4CollectProps) {
  if (!isVisible) return null;

  const hasMultipleCompanies = target.items && target.items.length > 0;

  const totalReceived = hasMultipleCompanies
    ? target.items!.reduce(
        (sum, item) => sum + (parseCleanAmount(item.receivedAmount) || 0),
        0,
      )
    : parseCleanAmount(receivedAmount) || 0;

  const totalTarget = hasMultipleCompanies
    ? target.items!.reduce(
        (sum, item) =>
          sum +
          (item.targetAmountNum ??
            (item as any).collectAmount ??
            parseCleanAmount(item.targetCollect) ??
            0),
        0,
      )
    : ((target as any).targetAmountNum ??
      (target as any).collectAmount ??
      parseCleanAmount(target.targetCollect) ??
      0);

  const hasActual = hasMultipleCompanies
    ? totalReceived > 0
    : parseCleanAmount(receivedAmount) != null;

  const remainingAmount = hasActual
    ? Math.max(0, totalTarget - totalReceived)
    : totalTarget;

  const showRemaining = !hasActual || totalReceived < totalTarget;

  return (
    <div className="border border-indigo-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <Receipt className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-indigo-900 text-base md:text-lg">
            วางบิล / เก็บเงิน
          </h2>
        </div>
        {hasMultipleCompanies && (
          <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            เป้าหมาย {target.items!.length} บริษัท/ร้านค้า
          </span>
        )}
      </div>

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mt-4">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          <span>ผลการปฏิบัติงานจริง</span>
        </div>

        {hasMultipleCompanies ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {target.items!.map((item, idx) => {
                const itemRec = parseCleanAmount(item.receivedAmount);
                return (
                  <div
                    key={idx}
                    className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-500 font-medium block">
                        {idx + 1}. {item.companyName}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        เป้าหมาย: {item.targetCollect}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">
                        รับชำระจริง
                      </span>
                      <span className="text-sm font-extrabold text-indigo-900">
                        {itemRec != null
                          ? `${itemRec.toLocaleString()} ฿`
                          : "-"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalReceived > 0 && (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-indigo-900">
                  รวมเงินที่รับชำระจริงทั้งหมด:
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-base font-black text-indigo-900">
                    {totalReceived.toLocaleString()} ฿
                  </span>
                  {showRemaining && remainingAmount > 0 && (
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md">
                      ยอดคงค้าง: {remainingAmount.toLocaleString()} ฿
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {(orderNo || target.orderNo) && (
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  เลขที่เอกสาร/ใบสั่งซื้อ:
                </span>
                <span className="font-semibold text-slate-800">
                  {orderNo || target.orderNo}
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
                <span className="text-xs text-slate-500 font-medium block">
                  เป้ายอดเก็บเงิน
                </span>
                <span className="text-sm sm:text-base font-extrabold text-slate-900 block">
                  {totalTarget > 0 ? `${totalTarget.toLocaleString()} ฿` : "-"}
                </span>
              </div>

              <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 space-y-1">
                <span className="text-xs text-indigo-600 font-medium block">
                  ยอดเก็บเงินจริง
                </span>
                <span className="text-sm sm:text-base font-extrabold text-indigo-900 block">
                  {hasActual ? `${totalReceived.toLocaleString()} ฿` : "-"}
                </span>
              </div>

              {showRemaining && (
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-1">
                  <span className="text-xs text-amber-700 font-medium block">
                    ยอดคงค้าง
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-amber-900 block">
                    {`${remainingAmount.toLocaleString()} ฿`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PAYMENT IMAGES (READ-ONLY) */}
        {paymentImages.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              หลักฐานการชำระเงิน / ภาพถ่ายเอกสาร
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {paymentImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 aspect-video flex items-center justify-center shadow-2xs"
                >
                  <img
                    src={img.url}
                    alt={img.name || "Payment Receipt"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
