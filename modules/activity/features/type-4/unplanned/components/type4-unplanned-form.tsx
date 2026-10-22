"use client";

import React from "react";
import {
  Receipt,
  Plus,
  Trash2,
  FileText,
  Coins,
  CheckCircle2,
  AlertCircle,
  Upload,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityInput, ActivityCustomerSelect } from "@/modules/activity/ui";
import { cn } from "@/lib/utils";
import type { Type4UnplannedFormProps } from "../types/unplanned.types";
import type { StoreOption, Type4ImageFile } from "../../shared/types";

export type { Type4UnplannedFormProps };

export function Type4UnplannedForm({
  items,
  addItem,
  removeItem,
  updateItem,
  customers = [],
  readonly = false,
}: Type4UnplannedFormProps) {
  // Aggregate totals
  const totalReceived = items
    .filter((it) => it.collectType !== "BILLING")
    .reduce((sum, it) => sum + (Number(it.receivedAmount) || 0), 0);

  const billingItems = items.filter((it) => it.collectType === "BILLING");
  const billingSuccessCount = billingItems.filter(
    (it) => (it.billingStatus || "วางบิลสำเร็จ") === "วางบิลสำเร็จ",
  ).length;

  const handleImageUpload = (
    itemId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: Type4ImageFile[] = Array.from(files).map((file) => ({
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      url: URL.createObjectURL(file),
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
      rawFile: file,
      file,
      workTypeCode: "TYPE_4",
    }));

    const currentItem = items.find((it) => it.id === itemId);
    const updatedImages = [...(currentItem?.images || []), ...newImages];
    updateItem(itemId, "images", updatedImages);
  };

  const handleRemoveImage = (itemId: string, imageId: string) => {
    const currentItem = items.find((it) => it.id === itemId);
    const updatedImages = (currentItem?.images || []).filter(
      (img) => img.id !== imageId,
    );
    updateItem(itemId, "images", updatedImages);
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Receipt className="h-4 w-4 text-amber-600" />
          <span>บันทึกผลวางบิล / เก็บเงินนอกแผน</span>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addItem}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการร้านค้า
          </Button>
        )}
      </div>

      {/* Item Cards */}
      <div className="space-y-3.5">
        {items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            ยังไม่มีรายการวางบิล / เก็บเงินนอกแผน
          </div>
        ) : (
          items.map((item, index) => {
            const isBilling = item.collectType === "BILLING";
            const effectiveBillingStatus =
              item.billingStatus || (isBilling ? "วางบิลสำเร็จ" : "");

            return (
              <div
                key={item.id}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3.5 transition-all hover:border-amber-300"
              >
                {/* Header row: Index & Delete */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[11px] font-extrabold">
                      {index + 1}
                    </span>
                    ร้านค้าเป้าหมายที่ {index + 1}
                  </span>

                  {!readonly && items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 rounded-md text-red-500 hover:bg-red-50 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>ลบรายการ</span>
                    </button>
                  )}
                </div>

                {/* Radio selection: วางบิล หรือ เก็บเงิน */}
                <div className="space-y-1.5 border-b border-slate-100 pb-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    ประเภทการดำเนินการ <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-6 items-center pt-0.5">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                      <input
                        type="radio"
                        name={`type4-unplanned-collect-type-${item.id}`}
                        value="BILLING"
                        checked={isBilling}
                        onChange={() => {
                          updateItem(item.id, "collectType", "BILLING");
                          if (!item.billingStatus) {
                            updateItem(
                              item.id,
                              "billingStatus",
                              "วางบิลสำเร็จ",
                            );
                          }
                        }}
                        disabled={readonly}
                        className="w-4 h-4 text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        วางบิล
                      </span>
                    </label>

                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                      <input
                        type="radio"
                        name={`type4-unplanned-collect-type-${item.id}`}
                        value="COLLECT"
                        checked={!isBilling}
                        onChange={() =>
                          updateItem(item.id, "collectType", "COLLECT")
                        }
                        disabled={readonly}
                        className="w-4 h-4 text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Coins className="w-3.5 h-3.5 text-amber-600" />
                        เก็บเงิน
                      </span>
                    </label>
                  </div>
                </div>

                {/* Store Select & Invoice No */}
                <div className="grid grid-cols-1 md:grid-cols-10 gap-3">
                  <ActivityCustomerSelect
                    id={`unplanned-customer-${item.id}`}
                    type="STORE"
                    label="รายชื่อลูกค้า / ร้านค้า"
                    containerClassName="md:col-span-7"
                    labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                    triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-amber-500"
                    value={item.storeId || item.customerName || ""}
                    onChange={(val, cust) => {
                      updateItem(item.id, "customerName", cust?.name || val);
                      if (cust?.id) {
                        updateItem(item.id, "storeId", cust.id);
                      }
                    }}
                    customers={customers as any}
                    placeholder="เลือกร้านค้า / ลูกค้า..."
                    searchPlaceholder="ค้นหาร้านค้า / ลูกค้า..."
                    emptyText="ไม่พบลูกค้า"
                    disabled={readonly}
                    required
                  />
                </div>

                {/* Flow Specific Inputs */}
                {isBilling ? (
                  /* BILLING FLOW */
                  <div className="space-y-3 p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/60">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>ผลการวางบิล</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateItem(item.id, "billingStatus", "วางบิลสำเร็จ")
                          }
                          disabled={readonly}
                          className={cn(
                            "flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                            effectiveBillingStatus === "วางบิลสำเร็จ"
                              ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs ring-1 ring-emerald-400"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                          )}
                        >
                          <CheckCircle2
                            className={cn(
                              "w-4 h-4",
                              effectiveBillingStatus === "วางบิลสำเร็จ"
                                ? "text-emerald-600"
                                : "text-slate-400",
                            )}
                          />
                          <span>วางบิลสำเร็จ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateItem(
                              item.id,
                              "billingStatus",
                              "วางบิลไม่สำเร็จ",
                            )
                          }
                          disabled={readonly}
                          className={cn(
                            "flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                            effectiveBillingStatus === "วางบิลไม่สำเร็จ"
                              ? "bg-rose-50 border-rose-500 text-rose-800 shadow-xs ring-1 ring-rose-400"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                          )}
                        >
                          <AlertCircle
                            className={cn(
                              "w-4 h-4",
                              effectiveBillingStatus === "วางบิลไม่สำเร็จ"
                                ? "text-rose-600"
                                : "text-slate-400",
                            )}
                          />
                          <span>วางบิลไม่สำเร็จ</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        รายละเอียดการวางบิล
                      </label>
                      <ActivityInput
                        type="text"
                        value={item.billingDetail || ""}
                        onChange={(e) =>
                          updateItem(item.id, "billingDetail", e.target.value)
                        }
                        disabled={readonly}
                        placeholder="ระบุรายละเอียด เช่น กำหนดรับเช็ค, เอกสารที่ส่งมอบ..."
                      />
                    </div>
                  </div>
                ) : (
                  /* COLLECT FLOW */
                  <div className="space-y-3 p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/60">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        จำนวนเงินที่เก็บได้จริง (บาท){" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400 text-xs font-semibold z-10">
                          ฿
                        </span>
                        <ActivityInput
                          type="number"
                          min={0}
                          value={item.receivedAmount || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateItem(item.id, "receivedAmount", val);
                            updateItem(item.id, "targetAmount", val);
                          }}
                          disabled={readonly}
                          placeholder="0"
                          className="pl-7 pr-3 text-right font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        รายละเอียดการเก็บเงิน
                      </label>
                      <ActivityInput
                        type="text"
                        value={item.collectDetail || ""}
                        onChange={(e) =>
                          updateItem(item.id, "collectDetail", e.target.value)
                        }
                        disabled={readonly}
                        placeholder="ระบุรายละเอียด เช่น ชำระเงินสด, โอนเงิน, เช็ค..."
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary Footer */}
      {(totalReceived > 0 || billingItems.length > 0) && (
        <div className="bg-amber-100/70 border border-amber-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs text-xs font-bold text-amber-950">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-700" />
            <span>สรุปผลการปฏิบัติงานนอกแผน ({items.length} ร้านค้า):</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {totalReceived > 0 && (
              <span className="bg-white px-3 py-1 rounded-lg border border-amber-200">
                ยอดเก็บเงินจริงรวม:{" "}
                <span className="text-amber-800 font-extrabold text-sm ml-1">
                  ฿ {totalReceived.toLocaleString()}
                </span>
              </span>
            )}
            {billingItems.length > 0 && (
              <span className="bg-white px-3 py-1 rounded-lg border border-amber-200">
                วางบิลสำเร็จ:{" "}
                <span className="text-emerald-700 font-extrabold text-sm ml-1">
                  {billingSuccessCount} / {billingItems.length}
                </span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
