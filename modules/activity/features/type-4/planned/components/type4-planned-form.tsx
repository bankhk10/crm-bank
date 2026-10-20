"use client";

import React from "react";
import { Receipt, Plus, Trash2, FileText, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityInput,
  ActivityCustomerSelect,
} from "@/modules/activity/ui";
import type {
  Type4PlannedFormProps,
  Type4PlanFormProps,
  Type4CollectProps,
} from "../types/planned.types";
import type { StoreOption } from "../../shared/types";

export type {
  Type4PlannedFormProps,
  Type4PlanFormProps,
  Type4CollectProps,
  StoreOption,
};

export function Type4PlannedForm({
  readonly = false,
  type4Items,
  addType4Row,
  updateType4Row,
  deleteType4Row,
  customers = [],
}: Type4PlannedFormProps) {
  const totalAllCollect = type4Items.reduce(
    (sum, item) => sum + (item.collectAmount || 0),
    0,
  );

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Receipt className="h-4 w-4 text-amber-600" />
          <span>วางบิล / เก็บเงิน</span>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addType4Row}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการ
          </Button>
        )}
      </div>

      {/* List of Collect Cards */}
      <div className="space-y-3">
        {type4Items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            ยังไม่มีรายการวางบิล / เก็บเงิน
          </div>
        ) : (
          type4Items.map((item, index) => {
            const currentCollectType =
              item.collectType === "BILLING" ? "BILLING" : "COLLECT";

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 md:p-4 space-y-3.5 transition-all hover:border-amber-200"
              >
                {/* Header of Item */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold text-xs">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      รายการที่ {index + 1}
                    </span>
                  </div>

                  {!readonly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteType4Row(item.id)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Sub-form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Collect Type Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ประเภทรายการ <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={readonly}
                        onClick={() =>
                          updateType4Row(item.id, "collectType", "BILLING")
                        }
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                          currentCollectType === "BILLING"
                            ? "border-blue-500 bg-blue-50 text-blue-700 shadow-xs font-semibold"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        } ${readonly ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        วางบิล
                      </button>

                      <button
                        type="button"
                        disabled={readonly}
                        onClick={() =>
                          updateType4Row(item.id, "collectType", "COLLECT")
                        }
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                          currentCollectType === "COLLECT"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs font-semibold"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        } ${readonly ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <Coins className="h-3.5 w-3.5" />
                        เก็บเงิน
                      </button>
                    </div>
                  </div>

                  {/* Customer / Store */}
                  <div>
                    <ActivityCustomerSelect
                      id={`type4-customer-${item.id}`}
                      type="STORE"
                      label="ร้านค้า / ลูกค้า"
                      labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                      triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-amber-500"
                      required
                      value={item.storeId || ""}
                      customers={customers as any}
                      onChange={(val, cust) => {
                        updateType4Row(item.id, "storeId", val);
                        if (cust?.name) {
                          updateType4Row(item.id, "customerName", cust.name);
                        } else if (!val) {
                          updateType4Row(item.id, "customerName", "");
                        }
                      }}
                      placeholder="เลือกร้านค้า..."
                      searchPlaceholder="ค้นหาร้านค้า..."
                      emptyText="ไม่พบร้านค้าในระบบ"
                      disabled={readonly}
                    />
                  </div>

                  {/* Target Amount */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {currentCollectType === "BILLING"
                        ? "ยอดเงินตามบิล (บาท)"
                        : "ยอดเงินเป้าหมายที่จะเก็บ (บาท)"}{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      type="number"
                      min="0"
                      step="any"
                      value={item.collectAmount || ""}
                      onChange={(e) =>
                        updateType4Row(
                          item.id,
                          "collectAmount",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      disabled={readonly}
                      placeholder="0.00"
                    />
                  </div>

                  {/* Invoice / Reference No */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      เลขที่บิล / ใบสั่งซื้อ (ถ้ามี)
                    </label>
                    <ActivityInput
                      type="text"
                      value={item.invoiceNo || ""}
                      onChange={(e) =>
                        updateType4Row(item.id, "invoiceNo", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="เช่น INV-2026-001..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      รายละเอียดเพิ่มเติม
                    </label>
                    <ActivityInput
                      type="text"
                      value={item.detail}
                      onChange={(e) =>
                        updateType4Row(item.id, "detail", e.target.value)
                      }
                      disabled={readonly}
                      placeholder={
                        currentCollectType === "BILLING"
                          ? "ระบุรายละเอียดการวางบิล เช่น เอกสารที่ต้องเตรียม..."
                          : "ระบุรายละเอียดการเก็บเงิน..."
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalAllCollect > 0 && (
        <div className="flex justify-end p-3 rounded-xl bg-amber-100/70 border border-amber-200 text-xs font-bold text-amber-900">
          <span>
            รวมเป้ายอดเงินทั้งสิ้น:{" "}
            <span className="text-sm font-extrabold text-amber-700 ml-1.5">
              ฿ {totalAllCollect.toLocaleString()}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

// Backward-compatible aliases
export const Type4PlanForm = Type4PlannedForm;
export const Type4Collect = Type4PlannedForm;
