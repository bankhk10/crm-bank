"use client";

import React from "react";
import {
  Building2,
  Receipt,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";
import type {
  TargetCollectCompanyItem,
  DetailType4CollectProps,
} from "../actual/types";

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

export type { TargetCollectCompanyItem, DetailType4CollectProps };

export function DetailType4Collect({
  isVisible,
  target,
  orderNo,
  receivedAmount,
  billingStatus,
  collectDetail,
  paymentImages = [],
}: DetailType4CollectProps) {
  if (!isVisible) return null;

  const hasMultipleCompanies = Boolean(
    target?.items && target.items.length > 0,
  );

  // Calculate totals
  const totalReceived = hasMultipleCompanies
    ? target!.items!.reduce((sum, item, idx) => {
        const itemVal =
          parseCleanAmount(item.receivedAmount) ??
          (idx === 0 ? parseCleanAmount(receivedAmount) : null) ??
          0;
        return sum + itemVal;
      }, 0)
    : parseCleanAmount(receivedAmount) || 0;

  const totalTarget = hasMultipleCompanies
    ? target!.items!.reduce(
        (sum, item) =>
          sum +
          (item.targetAmountNum ??
            (item as any).collectAmount ??
            parseCleanAmount(item.targetCollect) ??
            0),
        0,
      )
    : ((target as any)?.targetAmountNum ??
      (target as any)?.collectAmount ??
      parseCleanAmount(target?.targetCollect) ??
      0);

  const hasActual = hasMultipleCompanies
    ? totalReceived > 0
    : parseCleanAmount(receivedAmount) != null;

  const totalRemaining = hasActual
    ? Math.max(0, totalTarget - totalReceived)
    : totalTarget;

  const billingItems = hasMultipleCompanies
    ? target!.items!.filter((it) => it.collectType === "BILLING")
    : target?.collectType === "BILLING"
      ? [target]
      : [];

  const billingSuccessCount = hasMultipleCompanies
    ? target!.items!.filter(
        (item, idx) =>
          item.collectType === "BILLING" &&
          (item.billingStatus === "วางบิลสำเร็จ" ||
            (!item.billingStatus &&
              idx === 0 &&
              billingStatus === "วางบิลสำเร็จ")),
      ).length
    : billingStatus === "วางบิลสำเร็จ"
      ? 1
      : 0;

  return (
    <div className="border border-indigo-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      {/* HEADER */}
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
            เป้าหมาย {target!.items!.length} บริษัท/ร้านค้า
          </span>
        )}
      </div>

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          <span>ผลการปฏิบัติงานจริง</span>
        </div>

        {hasMultipleCompanies ? (
          /* MULTI-COMPANY RESULT CARDS */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {target!.items!.map((item, idx) => {
                const isBilling = item.collectType === "BILLING";
                const targetVal =
                  item.targetAmountNum ??
                  (item as any).collectAmount ??
                  parseCleanAmount(item.targetCollect) ??
                  0;
                const recVal =
                  parseCleanAmount(item.receivedAmount) ??
                  (idx === 0 ? parseCleanAmount(receivedAmount) : null) ??
                  0;
                const remaining = Math.max(0, targetVal - recVal);
                const itemBillingStatus =
                  item.billingStatus ||
                  (idx === 0 && billingStatus ? billingStatus : "");
                const itemDetail =
                  item.detail ||
                  (idx === 0 && collectDetail ? collectDetail : "");

                return (
                  <div
                    key={idx}
                    className="bg-indigo-50/30 border border-indigo-200/80 rounded-2xl p-4 space-y-3 shadow-2xs"
                  >
                    {/* Header for each company */}
                    <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
                      <div className="flex items-center gap-2 font-bold text-xs md:text-sm text-indigo-950">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-xs">
                          {idx + 1}
                        </span>
                        <span className="truncate">{item.companyName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "text-[11px] font-semibold px-2 py-0.5 rounded-md",
                            isBilling
                              ? "bg-sky-100 text-sky-800"
                              : "bg-amber-100 text-amber-800",
                          )}
                        >
                          {isBilling ? "วางบิล" : "เก็บเงิน"}
                        </span>
                        {item.targetCollect && !isBilling && (
                          <span className="text-[11px] bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-md shrink-0">
                            เป้า: {item.targetCollect}
                          </span>
                        )}
                      </div>
                    </div>

                    {isBilling ? (
                      /* CASE 1: วางบิล (BILLING) */
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs">
                          <span className="text-slate-600 font-semibold">
                            ผลการวางบิล:
                          </span>
                          {itemBillingStatus === "วางบิลสำเร็จ" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              วางบิลสำเร็จ
                            </span>
                          ) : itemBillingStatus === "วางบิลไม่สำเร็จ" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              วางบิลไม่สำเร็จ
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">
                              -
                            </span>
                          )}
                        </div>

                        {itemDetail && (
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs space-y-1">
                            <span className="text-slate-500 font-medium block">
                              รายละเอียดเพิ่มเติม:
                            </span>
                            <span className="text-slate-800 font-medium block whitespace-pre-wrap">
                              {itemDetail}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* CASE 2: เก็บเงิน (COLLECT) */
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs">
                          <span className="text-slate-600 font-semibold">
                            จำนวนเงินที่เก็บได้จริง:
                          </span>
                          <span className="font-extrabold text-indigo-900 text-sm">
                            {recVal > 0
                              ? `${recVal.toLocaleString()} บาท`
                              : "-"}
                          </span>
                        </div>

                        {targetVal > 0 && (
                          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                              <Coins className="w-3.5 h-3.5 text-amber-600" />
                              ยอดคงค้าง:
                            </span>
                            <span
                              className={cn(
                                "font-bold px-2.5 py-0.5 rounded-md text-xs",
                                remaining === 0 && recVal > 0
                                  ? "bg-emerald-100 text-emerald-800 font-extrabold"
                                  : remaining > 0
                                    ? "bg-amber-100 text-amber-900 font-extrabold"
                                    : "bg-slate-100 text-slate-600",
                              )}
                            >
                              {remaining.toLocaleString()} บาท
                              {remaining === 0 &&
                                recVal > 0 &&
                                " (ชำระครบถ้วน)"}
                            </span>
                          </div>
                        )}

                        {itemDetail && (
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs space-y-1">
                            <span className="text-slate-500 font-medium block">
                              รายละเอียดเพิ่มเติม:
                            </span>
                            <span className="text-slate-800 font-medium block whitespace-pre-wrap">
                              {itemDetail}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* TOTAL SUMMARY FOOTER */}
            <div className="bg-indigo-100/60 border border-indigo-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs md:text-sm">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>
                  สรุปผลการปฏิบัติงาน ({target!.items!.length} บริษัท/ร้านค้า):
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {totalTarget > 0 && (
                  <>
                    <span className="bg-white text-slate-800 font-bold px-3 py-1 rounded-lg border border-indigo-200">
                      ยอดรับชำระรวม:{" "}
                      <span className="text-indigo-700 font-extrabold text-sm">
                        {totalReceived.toLocaleString()} บาท
                      </span>
                    </span>
                    <span className="bg-white text-slate-800 font-bold px-3 py-1 rounded-lg border border-indigo-200">
                      ยอดคงค้างรวม:{" "}
                      <span
                        className={cn(
                          "font-extrabold text-sm",
                          totalRemaining === 0
                            ? "text-emerald-600"
                            : "text-amber-700",
                        )}
                      >
                        {totalRemaining.toLocaleString()} บาท
                      </span>
                    </span>
                  </>
                )}
                {billingItems.length > 0 && (
                  <span className="bg-white text-slate-800 font-bold px-3 py-1 rounded-lg border border-indigo-200">
                    วางบิลสำเร็จ:{" "}
                    <span className="text-emerald-700 font-extrabold text-sm">
                      {billingSuccessCount} / {billingItems.length} รายการ
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* SINGLE COMPANY / FALLBACK RESULT DISPLAY */
          <div className="space-y-3">
            {(orderNo || target?.orderNo) && (
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  เลขที่เอกสาร/ใบสั่งซื้อ:
                </span>
                <span className="font-semibold text-slate-800">
                  {orderNo || target?.orderNo}
                </span>
              </div>
            )}

            {target?.collectType === "BILLING" ? (
              /* SINGLE BILLING DISPLAY */
              <div className="bg-indigo-50/30 border border-indigo-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200/80 text-xs">
                  <span className="text-slate-700 font-bold text-xs">
                    ผลการวางบิล:
                  </span>
                  {billingStatus === "วางบิลสำเร็จ" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      วางบิลสำเร็จ
                    </span>
                  ) : billingStatus === "วางบิลไม่สำเร็จ" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      วางบิลไม่สำเร็จ
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium">-</span>
                  )}
                </div>

                {collectDetail && (
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
                    <span className="text-slate-500 font-medium block">
                      รายละเอียดเพิ่มเติม:
                    </span>
                    <span className="text-slate-800 font-medium block whitespace-pre-wrap">
                      {collectDetail}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* SINGLE COLLECT DISPLAY */
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
                    <span className="text-xs text-slate-500 font-medium block">
                      เป้ายอดเก็บเงิน
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 block">
                      {totalTarget > 0
                        ? `${totalTarget.toLocaleString()} บาท`
                        : "-"}
                    </span>
                  </div>

                  <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 space-y-1">
                    <span className="text-xs text-indigo-600 font-medium block">
                      ยอดเก็บเงินจริง
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-indigo-900 block">
                      {hasActual
                        ? `${totalReceived.toLocaleString()} บาท`
                        : "-"}
                    </span>
                  </div>

                  {totalTarget > 0 && (
                    <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-1">
                      <span className="text-xs text-amber-700 font-medium block">
                        ยอดคงค้าง
                      </span>
                      <span
                        className={cn(
                          "text-sm sm:text-base font-extrabold block",
                          totalRemaining === 0
                            ? "text-emerald-700"
                            : "text-amber-900",
                        )}
                      >
                        {totalRemaining.toLocaleString()} บาท
                        {totalRemaining === 0 &&
                          totalReceived > 0 &&
                          " (ชำระครบถ้วน)"}
                      </span>
                    </div>
                  )}
                </div>

                {collectDetail && (
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1">
                    <span className="text-slate-500 font-medium block">
                      รายละเอียดเพิ่มเติม:
                    </span>
                    <span className="text-slate-800 font-medium block whitespace-pre-wrap">
                      {collectDetail}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PAYMENT IMAGES (READ-ONLY) */}
        {paymentImages && paymentImages.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
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
