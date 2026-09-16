"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Target,
  CheckCircle2,
  AlertCircle,
  Coins,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ActualTargetCard } from "../actual-target-card";
import { ImageFile } from "../../types";

export interface TargetCollectCompanyItem {
  id?: string;
  customer?: string;
  companyName: string;
  targetCollect: string;
  targetAmountNum?: number;
  collectType?: "BILLING" | "COLLECT";
  receivedAmount?: string;
  billingStatus?: "วางบิลสำเร็จ" | "วางบิลไม่สำเร็จ" | "";
  detail?: string;
}

interface ActualType4CollectProps {
  isVisible: boolean;
  target: {
    customer: string;
    orderNo: string;
    targetCollect: string;
    collectType?: "BILLING" | "COLLECT";
    items?: TargetCollectCompanyItem[];
  };
  orderNo: string;
  setOrderNo: (v: string) => void;
  receivedAmount: string;
  setReceivedAmount: (v: string) => void;
  billingStatus?: string;
  setBillingStatus?: (v: string) => void;
  collectDetail?: string;
  setCollectDetail?: (v: string) => void;
  paymentImages?: ImageFile[];
  onUploadImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: (id: string) => void;
}

export function ActualType4Collect({
  isVisible,
  target,
  receivedAmount,
  setReceivedAmount,
  billingStatus = "",
  setBillingStatus,
  collectDetail = "",
  setCollectDetail,
}: ActualType4CollectProps) {
  // Local state per company for multi-company support
  const [companyItems, setCompanyItems] = useState<TargetCollectCompanyItem[]>(
    () => {
      if (target.items && target.items.length > 0) {
        return target.items.map((item, idx) => ({
          ...item,
          collectType: item.collectType || target.collectType || "COLLECT",
          receivedAmount:
            item.receivedAmount ||
            (idx === 0 && receivedAmount ? receivedAmount : ""),
          billingStatus:
            item.billingStatus ||
            (idx === 0 && billingStatus
              ? (billingStatus as "วางบิลสำเร็จ" | "วางบิลไม่สำเร็จ")
              : "วางบิลสำเร็จ"),
          detail:
            item.detail || (idx === 0 && collectDetail ? collectDetail : ""),
        }));
      }
      return [];
    },
  );

  // Sync initial single fallback billingStatus if not set
  useEffect(() => {
    if (!billingStatus && setBillingStatus) {
      setBillingStatus("วางบิลสำเร็จ");
    }
  }, [billingStatus, setBillingStatus]);

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

  const handleCompanyBillingStatusChange = (
    index: number,
    status: "วางบิลสำเร็จ" | "วางบิลไม่สำเร็จ",
  ) => {
    const updated = [...companyItems];
    updated[index] = { ...updated[index], billingStatus: status };
    setCompanyItems(updated);
    setBillingStatus?.(status);
  };

  const handleCompanyDetailChange = (index: number, detail: string) => {
    const updated = [...companyItems];
    updated[index] = { ...updated[index], detail };
    setCompanyItems(updated);
    setCollectDetail?.(detail);
  };

  // Summaries
  const totalReceived = companyItems.reduce(
    (sum, item) => sum + (Number(item.receivedAmount) || 0),
    0,
  );
  const totalTarget = companyItems.reduce(
    (sum, item) =>
      sum +
      (item.targetAmountNum ??
        (parseFloat(String(item.targetCollect || "").replace(/[^0-9.]/g, "")) ||
          0)),
    0,
  );
  const totalRemaining = Math.max(0, totalTarget - totalReceived);

  const billingSuccessCount = companyItems.filter(
    (item) => item.billingStatus === "วางบิลสำเร็จ",
  ).length;

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

      {/* TARGET SUMMARY CARD */}
      {hasMultipleCompanies ? (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-600" />
              เป้าหมายการวางบิล/เก็บเงิน ({companyItems.length} บริษัท/ร้านค้า):
            </span>
            {target.targetCollect && (
              <span className="text-xs font-extrabold text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-md">
                เป้ายอดรวม {target.targetCollect}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {companyItems.map((item, idx) => {
              const isBilling = item.collectType === "BILLING";
              return (
                <div
                  key={idx}
                  className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs flex items-center justify-between font-bold text-slate-900"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{item.companyName}</span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-1.5 py-0.2 rounded ml-1",
                        isBilling
                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200",
                      )}
                    >
                      {isBilling ? "วางบิล" : "เก็บเงิน"}
                    </span>
                  </span>
                  {item.targetCollect ? (
                    <span className="text-indigo-700 font-bold">
                      {item.targetCollect}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal">-</span>
                  )}
                </div>
              );
            })}
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
              label:
                target.collectType === "BILLING"
                  ? "เป้าหมาย:"
                  : "เป้ายอดเก็บเงิน:",
              value:
                target.targetCollect ||
                (target.collectType === "BILLING" ? "วางบิล" : "-"),
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
              บันทึกผลการปฏิบัติงานจริง (แยกตามบริษัท/ร้านค้า)
            </label>
            <span className="text-xs text-slate-500 font-medium">
              * บันทึกข้อมูลตามประเภทงานที่กำหนดในแผน
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {companyItems.map((item, idx) => {
              const isBilling = item.collectType === "BILLING";
              const targetVal =
                item.targetAmountNum ??
                (parseFloat(
                  String(item.targetCollect || "").replace(/[^0-9.]/g, ""),
                ) ||
                  0);
              const recVal =
                parseFloat(String(item.receivedAmount || "0")) || 0;
              const remaining = Math.max(0, targetVal - recVal);

              return (
                <div
                  key={idx}
                  className="bg-indigo-50/30 border border-indigo-200/80 rounded-2xl p-4 space-y-3 shadow-2xs"
                >
                  {/* Header for each Company */}
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

                  {/* CASE 1: วางบิล (BILLING) */}
                  {isBilling ? (
                    <div className="space-y-3">
                      {/* ผลการวางบิล */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span>ผลการวางบิล</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleCompanyBillingStatusChange(
                                idx,
                                "วางบิลสำเร็จ",
                              )
                            }
                            className={cn(
                              "flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                              item.billingStatus === "วางบิลสำเร็จ"
                                ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs ring-1 ring-emerald-400"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                            )}
                          >
                            <CheckCircle2
                              className={cn(
                                "w-4 h-4",
                                item.billingStatus === "วางบิลสำเร็จ"
                                  ? "text-emerald-600"
                                  : "text-slate-400",
                              )}
                            />
                            <span>วางบิลสำเร็จ</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleCompanyBillingStatusChange(
                                idx,
                                "วางบิลไม่สำเร็จ",
                              )
                            }
                            className={cn(
                              "flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                              item.billingStatus === "วางบิลไม่สำเร็จ"
                                ? "bg-rose-50 border-rose-500 text-rose-800 shadow-xs ring-1 ring-rose-400"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                            )}
                          >
                            <AlertCircle
                              className={cn(
                                "w-4 h-4",
                                item.billingStatus === "วางบิลไม่สำเร็จ"
                                  ? "text-rose-600"
                                  : "text-slate-400",
                              )}
                            />
                            <span>วางบิลไม่สำเร็จ</span>
                          </button>
                        </div>
                      </div>

                      {/* รายละเอียดเพิ่มเติม */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-800">
                          รายละเอียดเพิ่มเติม
                        </label>
                        <Input
                          type="text"
                          value={item.detail || ""}
                          onChange={(e) =>
                            handleCompanyDetailChange(idx, e.target.value)
                          }
                          placeholder="ระบุรายละเอียดเพิ่มเติมการวางบิล เช่น กำหนดรับเช็ค, เอกสารที่ส่งมอบ..."
                          className="bg-white border-slate-300 text-xs h-9"
                        />
                      </div>
                    </div>
                  ) : (
                    /* CASE 2: เก็บเงิน (COLLECT) */
                    <div className="space-y-3">
                      {/* Amount Input */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-800">
                          จำนวนเงินที่เก็บได้จริง (บาท){" "}
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
                            className="bg-white border-slate-300 pr-12 text-xs h-9"
                          />
                          <span className="absolute right-3 text-xs font-semibold text-slate-500">
                            บาท
                          </span>
                        </div>
                      </div>

                      {/* ยอดคงค้าง */}
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
                          {remaining === 0 && recVal > 0 && " (ชำระครบถ้วน)"}
                        </span>
                      </div>

                      {/* รายละเอียดเพิ่มเติม */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-800">
                          รายละเอียดเพิ่มเติม
                        </label>
                        <Input
                          type="text"
                          value={item.detail || ""}
                          onChange={(e) =>
                            handleCompanyDetailChange(idx, e.target.value)
                          }
                          placeholder="ระบุรายละเอียดเพิ่มเติม เช่น ชำระเงินสด, โอนเงิน, เช็ค..."
                          className="bg-white border-slate-300 text-xs h-9"
                        />
                      </div>
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
                สรุปผลการปฏิบัติงาน ({companyItems.length} บริษัท/ร้านค้า):
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
              {companyItems.some((it) => it.collectType === "BILLING") && (
                <span className="bg-white text-slate-800 font-bold px-3 py-1 rounded-lg border border-indigo-200">
                  วางบิลสำเร็จ:{" "}
                  <span className="text-emerald-700 font-extrabold text-sm">
                    {billingSuccessCount} /{" "}
                    {
                      companyItems.filter((it) => it.collectType === "BILLING")
                        .length
                    }{" "}
                    รายการ
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* SINGLE COMPANY FALLBACK FORM */
        <div className="space-y-4 pt-1">
          {target.collectType === "BILLING" ? (
            <div className="bg-indigo-50/30 border border-indigo-200/80 rounded-2xl p-4 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>ผลการวางบิล</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setBillingStatus?.("วางบิลสำเร็จ")}
                    className={cn(
                      "flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                      billingStatus === "วางบิลสำเร็จ"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs ring-1 ring-emerald-400"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <CheckCircle2
                      className={cn(
                        "w-4 h-4",
                        billingStatus === "วางบิลสำเร็จ"
                          ? "text-emerald-600"
                          : "text-slate-400",
                      )}
                    />
                    <span>วางบิลสำเร็จ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingStatus?.("วางบิลไม่สำเร็จ")}
                    className={cn(
                      "flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                      billingStatus === "วางบิลไม่สำเร็จ"
                        ? "bg-rose-50 border-rose-500 text-rose-800 shadow-xs ring-1 ring-rose-400"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <AlertCircle
                      className={cn(
                        "w-4 h-4",
                        billingStatus === "วางบิลไม่สำเร็จ"
                          ? "text-rose-600"
                          : "text-slate-400",
                      )}
                    />
                    <span>วางบิลไม่สำเร็จ</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  รายละเอียดเพิ่มเติม
                </label>
                <Input
                  type="text"
                  value={collectDetail}
                  onChange={(e) => setCollectDetail?.(e.target.value)}
                  placeholder="ระบุรายละเอียดเพิ่มเติมการวางบิล เช่น กำหนดรับเช็ค..."
                  className="bg-white border-slate-300 text-xs h-9"
                />
              </div>
            </div>
          ) : (
            <div className="bg-indigo-50/30 border border-indigo-200/80 rounded-2xl p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  จำนวนเงินที่เก็บได้จริง (บาท){" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Input
                    type="number"
                    min="0"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-white border-slate-300 pr-12 text-xs h-9"
                  />
                  <span className="absolute right-3 text-xs font-semibold text-slate-500">
                    บาท
                  </span>
                </div>
              </div>

              {/* ยอดคงค้าง */}
              {(() => {
                const targetVal =
                  parseFloat(
                    String(target.targetCollect || "").replace(/[^0-9.]/g, ""),
                  ) || 0;
                const recVal = parseFloat(String(receivedAmount || "0")) || 0;
                const remaining = Math.max(0, targetVal - recVal);
                return (
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
                      {remaining === 0 && recVal > 0 && " (ชำระครบถ้วน)"}
                    </span>
                  </div>
                );
              })()}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  รายละเอียดเพิ่มเติม
                </label>
                <Input
                  type="text"
                  value={collectDetail}
                  onChange={(e) => setCollectDetail?.(e.target.value)}
                  placeholder="ระบุรายละเอียดเพิ่มเติมการเก็บเงิน..."
                  className="bg-white border-slate-300 text-xs h-9"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
