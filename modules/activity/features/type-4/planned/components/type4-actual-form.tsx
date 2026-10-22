"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Coins,
  Upload,
  Trash2,
  ImageIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Type4PlanCard } from "./type4-plan-card";
import type {
  TargetCollectCompanyItem,
  Type4TargetItem,
} from "../types/planned.types";
import type { Type4ActualFormProps } from "../types/actual.types";

export type { TargetCollectCompanyItem, Type4TargetItem, Type4ActualFormProps };

export function Type4ActualForm({
  isVisible,
  planType,
  target,
  targets,
  receivedAmount,
  setReceivedAmount,
  billingStatus = "",
  setBillingStatus,
  billingDetail = "",
  setBillingDetail,
  collectDetail = "",
  setCollectDetail,
  items,
  onUpdateItems,
  paymentImages = [],
  onUploadImages,
  onRemoveImage,
}: Type4ActualFormProps) {
  // Resolve effective target (supporting multi-target / targets list)
  const resolvedTarget: Type4TargetItem | undefined = useMemo(() => {
    // 1. If target already has multiple aggregated items, prioritize it
    if (target && target.items && target.items.length > 1) {
      return target;
    }

    // 2. If targets list has multiple targets, aggregate all items across all targets
    if (targets && targets.length > 1) {
      const allItems: TargetCollectCompanyItem[] = targets.flatMap((t, idx) => {
        if (t.items && t.items.length > 0) {
          return t.items.map((it) => ({
            ...it,
            detail:
              it.detail ||
              (it as any).notes ||
              t.detail ||
              (t as any).notes ||
              "",
          }));
        }
        const custDisplay =
          t.customer ||
          (t as any).companyName ||
          (t as any).store?.name ||
          "ร้านค้า / ลูกค้า";
        const amtNum =
          t.targetAmountNum ??
          t.collectAmount ??
          (t.targetAmount != null ? Number(t.targetAmount) : 0);
        const targetCollectStr =
          t.targetCollect ||
          (amtNum > 0 ? `${amtNum.toLocaleString()} บาท` : "");
        const collectType = (
          t.collectType === "BILLING" ? "BILLING" : "COLLECT"
        ) as "BILLING" | "COLLECT";
        return [
          {
            id: t.id || `t4-item-${idx}`,
            customer: custDisplay,
            companyName: t.companyName || (t as any).store?.name || custDisplay,
            storeId: t.storeId || undefined,
            collectType,
            targetCollect: targetCollectStr,
            targetAmountNum: amtNum,
            detail: t.detail || (t as any).notes || "",
          },
        ];
      });

      const totalAmount = targets.reduce(
        (sum, t) =>
          sum +
          (t.targetAmountNum ??
            t.collectAmount ??
            (t.targetAmount != null ? Number(t.targetAmount) : 0)),
        0,
      );

      return {
        ...targets[0],
        customer: targets
          .map(
            (t) =>
              t.customer ||
              (t as any).store?.name ||
              (t as any).companyName ||
              "",
          )
          .filter(Boolean)
          .join(", "),
        targetCollect:
          totalAmount > 0
            ? `${totalAmount.toLocaleString()} บาท`
            : targets[0].targetCollect,
        targetAmountNum: totalAmount,
        collectAmount: totalAmount,
        items: allItems,
      };
    }

    // 3. Fallback to single target with items
    if (target && target.items && target.items.length > 0) {
      return target;
    }

    // 4. Fallback to single target in targets list
    if (targets && targets.length === 1) {
      const t = targets[0];
      if (t.items && t.items.length > 0) return t;
      const custDisplay =
        t.customer ||
        (t as any).companyName ||
        (t as any).store?.name ||
        "ร้านค้า / ลูกค้า";
      const amtNum =
        t.targetAmountNum ??
        t.collectAmount ??
        (t.targetAmount != null ? Number(t.targetAmount) : 0);
      const targetCollectStr =
        t.targetCollect || (amtNum > 0 ? `${amtNum.toLocaleString()} บาท` : "");
      const collectType = (
        t.collectType === "BILLING" ? "BILLING" : "COLLECT"
      ) as "BILLING" | "COLLECT";
      return {
        ...t,
        customer: custDisplay,
        companyName: t.companyName || (t as any).store?.name || custDisplay,
        items: [
          {
            id: t.id || "t4-item-0",
            customer: custDisplay,
            companyName: t.companyName || (t as any).store?.name || custDisplay,
            storeId: t.storeId || undefined,
            collectType,
            targetCollect: targetCollectStr,
            targetAmountNum: amtNum,
            detail: t.detail || (t as any).notes || "",
          },
        ],
      };
    }

    return target;
  }, [target, targets]);

  // Local state per company for multi-company support
  const [companyItems, setCompanyItems] = useState<TargetCollectCompanyItem[]>(
    () => {
      if (resolvedTarget?.items && resolvedTarget.items.length > 0) {
        return resolvedTarget.items.map(
          (item: TargetCollectCompanyItem, idx: number) => {
            const isBilling =
              (item.collectType || resolvedTarget?.collectType) === "BILLING";
            const planNotes = item.detail || (item as any).notes || "";

            const existingItem =
              items?.find(
                (it) =>
                  (it.id && it.id === item.id) ||
                  (it.storeId && it.storeId === item.storeId),
              ) || items?.[idx];

            return {
              ...item,
              collectType:
                item.collectType || resolvedTarget?.collectType || "COLLECT",
              receivedAmount:
                existingItem?.receivedAmount || item.receivedAmount || "",
              billingStatus: (existingItem?.billingStatus ||
                item.billingStatus ||
                (isBilling ? "วางบิลสำเร็จ" : "")) as
                | ""
                | "วางบิลสำเร็จ"
                | "วางบิลไม่สำเร็จ",
              billingDetail:
                existingItem?.billingDetail ||
                item.billingDetail ||
                (isBilling ? planNotes : ""),
              collectDetail:
                existingItem?.collectDetail ||
                item.collectDetail ||
                (!isBilling ? planNotes : ""),
              detail: item.detail || planNotes,
            };
          },
        );
      }
      return [];
    },
  );

  // Sync incoming hydrated props into companyItems
  useEffect(() => {
    if (!resolvedTarget?.items || resolvedTarget.items.length === 0) {
      if (
        (resolvedTarget?.collectType === "BILLING" ||
          target?.collectType === "BILLING") &&
        !billingStatus
      ) {
        setBillingStatus?.("วางบิลสำเร็จ");
      }
      return;
    }

    setCompanyItems((prev) => {
      // Check if items prop has actual data loaded from database
      const hasActualInItems =
        items &&
        items.length > 0 &&
        items.some(
          (it) =>
            it.receivedAmount ||
            it.billingStatus ||
            (it.billingDetail && it.billingDetail !== it.detail) ||
            (it.collectDetail && it.collectDetail !== it.detail),
        );

      const isPrevEmpty =
        !prev ||
        prev.length === 0 ||
        prev.every((it) => !it.receivedAmount && !it.billingStatus);

      // 1. Initial hydration, item count change, or newly arrived actual data
      if (
        !prev ||
        prev.length === 0 ||
        prev.length !== resolvedTarget.items!.length ||
        (hasActualInItems && isPrevEmpty)
      ) {
        const newItems = resolvedTarget.items!.map(
          (targetItem: TargetCollectCompanyItem, idx: number) => {
            const isBilling =
              (targetItem.collectType || resolvedTarget?.collectType) ===
              "BILLING";
            const planNotes =
              targetItem.detail || (targetItem as any).notes || "";

            const existingItem =
              items?.find(
                (it) =>
                  (it.id && it.id === targetItem.id) ||
                  (it.storeId && it.storeId === targetItem.storeId),
              ) ||
              items?.[idx] ||
              prev?.[idx];

            return {
              ...targetItem,
              collectType:
                targetItem.collectType ||
                resolvedTarget?.collectType ||
                "COLLECT",
              receivedAmount:
                existingItem?.receivedAmount || targetItem.receivedAmount || "",
              billingStatus: (existingItem?.billingStatus ||
                targetItem.billingStatus ||
                (isBilling ? "วางบิลสำเร็จ" : "")) as
                | ""
                | "วางบิลสำเร็จ"
                | "วางบิลไม่สำเร็จ",
              billingDetail:
                existingItem?.billingDetail ||
                targetItem.billingDetail ||
                (isBilling ? planNotes : ""),
              collectDetail:
                existingItem?.collectDetail ||
                targetItem.collectDetail ||
                (!isBilling ? planNotes : ""),
              detail: targetItem.detail || planNotes,
            };
          },
        );

        onUpdateItems?.(newItems);

        // Sync total sum to parent if available
        const totalSum = newItems
          .filter((it) => it.collectType !== "BILLING")
          .reduce((sum, item) => sum + (Number(item.receivedAmount) || 0), 0);
        if (totalSum > 0) {
          setReceivedAmount(String(totalSum));
        }

        // Sync first billing status to parent if available and parent billingStatus is empty
        const firstBillingItem = newItems.find(
          (it) => it.collectType === "BILLING" || it.billingStatus,
        );
        if (firstBillingItem?.billingStatus && !billingStatus) {
          setBillingStatus?.(firstBillingItem.billingStatus);
        }

        return newItems;
      }

      // 2. If single store, sync from top-level props if they were updated externally
      if (resolvedTarget.items!.length === 1) {
        const item = prev[0];
        const isBilling = item.collectType === "BILLING";
        let itemUpdated = false;
        let newStatus = item.billingStatus;
        let newBillingDetail = item.billingDetail;
        let newCollectDetail = item.collectDetail;
        let newRec = item.receivedAmount;

        if (isBilling) {
          if (billingStatus && item.billingStatus !== billingStatus) {
            newStatus = billingStatus as "วางบิลสำเร็จ" | "วางบิลไม่สำเร็จ";
            itemUpdated = true;
          }
          if (
            billingDetail !== undefined &&
            billingDetail !== "" &&
            item.billingDetail !== billingDetail
          ) {
            newBillingDetail = billingDetail;
            itemUpdated = true;
          }
        } else {
          if (
            collectDetail !== undefined &&
            collectDetail !== "" &&
            item.collectDetail !== collectDetail
          ) {
            newCollectDetail = collectDetail;
            itemUpdated = true;
          }
          if (
            receivedAmount !== undefined &&
            receivedAmount !== "" &&
            item.receivedAmount !== receivedAmount
          ) {
            newRec = receivedAmount;
            itemUpdated = true;
          }
        }

        if (itemUpdated) {
          const updated = [
            {
              ...item,
              billingStatus: newStatus,
              billingDetail: newBillingDetail,
              collectDetail: newCollectDetail,
              receivedAmount: newRec,
            },
          ];
          onUpdateItems?.(updated);
          return updated;
        }
      }

      return prev;
    });
  }, [
    resolvedTarget?.items,
    resolvedTarget?.collectType,
    items,
    billingStatus,
    billingDetail,
    collectDetail,
    receivedAmount,
  ]);

  if (!isVisible) return null;

  const hasMultipleCompanies = companyItems && companyItems.length > 0;

  const handleCompanyAmountChange = (index: number, value: string) => {
    const updated = [...companyItems];
    updated[index] = { ...updated[index], receivedAmount: value };
    setCompanyItems(updated);
    onUpdateItems?.(updated);

    // Sync total sum of received amounts for collect items to parent
    const totalSum = updated
      .filter((it) => it.collectType !== "BILLING")
      .reduce((sum, item) => sum + (Number(item.receivedAmount) || 0), 0);
    setReceivedAmount(totalSum > 0 ? String(totalSum) : "");
  };

  const handleCompanyBillingStatusChange = (
    index: number,
    status: "วางบิลสำเร็จ" | "วางบิลไม่สำเร็จ",
  ) => {
    const updated = [...companyItems];
    updated[index] = { ...updated[index], billingStatus: status };
    setCompanyItems(updated);
    onUpdateItems?.(updated);

    setBillingStatus?.(status);
  };

  const handleCompanyBillingDetailChange = (index: number, detail: string) => {
    const updated = [...companyItems];
    updated[index] = { ...updated[index], billingDetail: detail };
    setCompanyItems(updated);
    onUpdateItems?.(updated);

    if (updated.length === 1) {
      setBillingDetail?.(detail);
    } else {
      const summary = updated
        .filter((it) => it.collectType === "BILLING" && it.billingDetail)
        .map((it) => `${it.companyName}: ${it.billingDetail}`)
        .join("; ");
      setBillingDetail?.(summary);
    }
  };

  const handleCompanyCollectDetailChange = (index: number, detail: string) => {
    const updated = [...companyItems];
    updated[index] = { ...updated[index], collectDetail: detail };
    setCompanyItems(updated);
    onUpdateItems?.(updated);

    if (updated.length === 1) {
      setCollectDetail?.(detail);
    } else {
      const summary = updated
        .filter((it) => it.collectType !== "BILLING" && it.collectDetail)
        .map((it) => `${it.companyName}: ${it.collectDetail}`)
        .join("; ");
      setCollectDetail?.(summary);
    }
  };

  // Summaries (Calculated only for COLLECT items)
  const collectItems = companyItems.filter(
    (it) => it.collectType !== "BILLING",
  );
  const totalReceived = collectItems.reduce(
    (sum, item) => sum + (Number(item.receivedAmount) || 0),
    0,
  );
  const totalTarget = collectItems.reduce(
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
        {planType !== "UNPLANNED" && hasMultipleCompanies && (
          <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            เป้าหมาย {companyItems.length} บริษัท/ร้านค้า
          </span>
        )}
      </div>

      {/* TARGET SUMMARY CARD */}
      <Type4PlanCard planType={planType} target={resolvedTarget} />

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
                          value={item.billingDetail || ""}
                          onChange={(e) =>
                            handleCompanyBillingDetailChange(
                              idx,
                              e.target.value,
                            )
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
                          value={item.collectDetail || ""}
                          onChange={(e) =>
                            handleCompanyCollectDetailChange(
                              idx,
                              e.target.value,
                            )
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
          {target?.collectType === "BILLING" ? (
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
                  value={billingDetail || target?.detail || target?.notes || ""}
                  onChange={(e) => setBillingDetail?.(e.target.value)}
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
                    String(target?.targetCollect || "").replace(/[^0-9.]/g, ""),
                  ) || 0;
                if (targetVal <= 0) return null;
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
                  value={collectDetail || target?.detail || target?.notes || ""}
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

// Backward-compatible alias
export const ActualType4Collect = Type4ActualForm;
