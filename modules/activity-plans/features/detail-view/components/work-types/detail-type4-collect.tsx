"use client";

import React from "react";
import { Building2, Receipt, ImageIcon } from "lucide-react";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";
import { ImageFile } from "@/modules/activity-plans/features/actual-view/types";

export interface TargetCollectCompanyItem {
  companyName: string;
  targetCollect: string;
  receivedAmount?: string;
}

interface DetailType4CollectProps {
  isVisible: boolean;
  target: {
    customer: string;
    orderNo: string;
    targetCollect: string;
    items?: TargetCollectCompanyItem[];
  };
  orderNo?: string;
  receivedAmount?: string;
  paymentImages?: ImageFile[];
}

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
        (sum, item) => sum + (Number(item.receivedAmount?.replace(/,/g, "")) || 0),
        0,
      )
    : Number(receivedAmount?.replace(/,/g, "")) || 0;

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

      {/* PLANNED TARGET CARD */}
      {hasMultipleCompanies ? (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <span className="text-xs font-bold text-slate-800">
              เป้าหมายการวางบิล/เก็บเงิน ({target.items!.length} บริษัท/ร้านค้า):
            </span>
            <span className="text-xs font-extrabold text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-md">
              เป้ายอดเก็บเงินรวม {target.targetCollect || "-"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {target.items!.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between font-bold text-slate-900"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  {item.companyName}
                </span>
                <span className="text-indigo-700 font-bold">
                  {item.targetCollect}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ActualTargetCard
          iconColorClass="text-indigo-600"
          badgeColorClass="bg-indigo-100 text-indigo-800"
          gridColsClass="grid-cols-1 sm:grid-cols-2"
          items={[
            { label: "ลูกค้า/ร้านค้า:", value: target.customer || "-" },
            {
              label: "เป้ายอดเก็บเงิน:",
              value: target.targetCollect || "-",
              highlight: true,
            },
          ]}
        />
      )}

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          <span>ผลการปฏิบัติงานจริง</span>
        </div>

        {hasMultipleCompanies ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {target.items!.map((item, idx) => (
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
                      {item.receivedAmount
                        ? `฿${Number(item.receivedAmount.replace(/,/g, "")).toLocaleString()}`
                        : "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {totalReceived > 0 && (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900">
                  รวมเงินที่รับชำระจริงทั้งหมด:
                </span>
                <span className="text-base font-black text-indigo-900">
                  ฿{totalReceived.toLocaleString()} บาท
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-slate-500 font-medium block">
                เลขที่เอกสาร/ใบสั่งซื้อ
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
                {orderNo || target.orderNo || "-"}
              </span>
            </div>

            <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-indigo-600 font-medium block">
                จำนวนเงินที่รับชำระจริง
              </span>
              <span className="text-sm sm:text-base font-extrabold text-indigo-900 block">
                {receivedAmount
                  ? `฿${Number(receivedAmount.replace(/,/g, "")).toLocaleString()} บาท`
                  : "-"}
              </span>
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
