"use client";

import React, { useState, useEffect } from "react";
import { Building2, Target, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ActualTargetCard } from "../actual-target-card";
import { ImageFile } from "../../types";

export interface TargetCollectCompanyItem {
  companyName: string;
  targetCollect: string;
  receivedAmount?: string;
}

interface ActualType4CollectProps {
  isVisible: boolean;
  target: {
    customer: string;
    orderNo: string;
    targetCollect: string;
    items?: TargetCollectCompanyItem[];
  };
  orderNo: string;
  setOrderNo: (v: string) => void;
  receivedAmount: string;
  setReceivedAmount: (v: string) => void;
  paymentImages: ImageFile[];
  onUploadImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
}

export function ActualType4Collect({
  isVisible,
  target,
  receivedAmount,
  setReceivedAmount,
}: ActualType4CollectProps) {
  // Local state per company for multi-company collect support
  const [companyItems, setCompanyItems] = useState<TargetCollectCompanyItem[]>(
    () => {
      if (target.items && target.items.length > 0) {
        return target.items.map((item, idx) => ({
          ...item,
          receivedAmount:
            item.receivedAmount || (idx === 0 ? "15500" : "10000"),
        }));
      }
      return [];
    },
  );

  if (!isVisible) return null;

  const hasMultipleCompanies = companyItems && companyItems.length > 0;

  const handleCompanyAmountChange = (index: number, value: string) => {
    const updated = [...companyItems];
    updated[index] = { ...updated[index], receivedAmount: value };
    setCompanyItems(updated);

    // Sync total sum of received amounts to parent
    const totalSum = updated.reduce(
      (sum, item) => sum + (Number(item.receivedAmount) || 0),
      0,
    );
    setReceivedAmount(totalSum > 0 ? String(totalSum) : "");
  };

  return (
    <div className="border border-indigo-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-bold text-indigo-900 text-base md:text-lg">
            วางบิล / เก็บเงิน
          </h2>
        </div>
        {hasMultipleCompanies && (
          <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            เป้าหมาย {companyItems.length} บริษัท/ร้านค้า
          </span>
        )}
      </div>

      {/* TARGET SUMMARY CARD FOR 2 COMPANIES */}
      {hasMultipleCompanies ? (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-600" />
              เป้าหมายการวางบิล/เก็บเงิน ({companyItems.length} บริษัท/ร้านค้า):
            </span>
            <span className="text-xs font-extrabold text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-md">
              เป้ายอดเก็บเงินรวม {target.targetCollect}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {companyItems.map((item, idx) => (
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
            { label: "ลูกค้า/ร้านค้า:", value: target.customer },
            {
              label: "เป้ายอดเก็บเงิน:",
              value: target.targetCollect,
              highlight: true,
            },
          ]}
        />
      )}

      {/* MULTI-COMPANY ACTUAL RECORDING FORM */}
      {hasMultipleCompanies ? (
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              บันทึกจำนวนเงินที่รับชำระจริง (แยกตามบริษัท/ร้านค้า)
            </label>
            <span className="text-xs text-slate-500 font-medium">
              * กรอกจำนวนเงินที่รับชำระจริงของแต่ละบริษัท
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {companyItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-indigo-50/30 border border-indigo-200/80 rounded-2xl p-4 space-y-2.5 shadow-2xs"
              >
                {/* Header for each Company */}
                <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
                  <div className="flex items-center gap-2 font-bold text-xs md:text-sm text-indigo-950">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-xs">
                      {idx + 1}
                    </span>
                    <span className="truncate">{item.companyName}</span>
                  </div>
                  <span className="text-[11px] bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-md shrink-0">
                    เป้า: {item.targetCollect}
                  </span>
                </div>

                {/* Amount Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    จำนวนเงินที่รับชำระจริง (บริษัทที่ {idx + 1}){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      min="0"
                      value={item.receivedAmount || ""}
                      onChange={(e) =>
                        handleCompanyAmountChange(idx, e.target.value)
                      }
                      placeholder="0.00"
                      className="bg-white border-slate-300 pr-12"
                    />
                    <span className="absolute right-3 text-xs font-semibold text-slate-500">
                      บาท
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TOTAL SUMMARY FOOTER */}
          <div className="bg-indigo-100/60 border border-indigo-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs md:text-sm">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span>
                สรุปรวมรับชำระเงินจริงทั้งหมด ({companyItems.length} บริษัท):
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="bg-white text-slate-800 font-bold px-3 py-1 rounded-lg border border-indigo-200">
                ยอดรับชำระรวม:{" "}
                <span className="text-indigo-700 font-extrabold text-sm">
                  {companyItems
                    .reduce(
                      (sum, item) => sum + (Number(item.receivedAmount) || 0),
                      0,
                    )
                    .toLocaleString()}{" "}
                  บาท
                </span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* SINGLE COMPANY FALLBACK FORM */
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                จำนวนเงินที่รับชำระจริง (บาท){" "}
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Input
                  type="number"
                  min="0"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-white border-slate-300 pr-12"
                />
                <span className="absolute right-3 text-xs font-semibold text-slate-500">
                  บาท
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
