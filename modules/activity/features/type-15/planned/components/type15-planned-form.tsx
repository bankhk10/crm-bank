"use client";

import React from "react";
import { Megaphone, Plus, Trash2, Home, Target, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityInput,
  ActivityTextarea,
  ActivityCustomerSelect,
} from "@/modules/activity/ui";
import type {
  Type15PlannedFormProps,
  Type15PlanFormProps,
} from "../types/planned.types";

export type { Type15PlannedFormProps, Type15PlanFormProps };

export function Type15PlannedForm({
  readonly = false,
  type15Items = [],
  addType15Row,
  updateType15Row,
  deleteType15Row,
  customers = [],
}: Type15PlannedFormProps) {
  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm sm:text-base">
          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
            <Megaphone className="h-4 w-4" />
          </div>
          <div>
            <span>บูมทีม / คาราวาน (Boom Team / Caravan)</span>
            <p className="text-xs text-slate-500 font-normal">
              ระบุร้านค้าเป้าหมาย หมู่บ้าน วัตถุประสงค์ และรายละเอียดกิจกรรม
            </p>
          </div>
        </div>

        {!readonly && addType15Row && (
          <Button
            type="button"
            size="sm"
            onClick={addType15Row}
            className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg h-8 px-3 shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มเป้าหมาย
          </Button>
        )}
      </div>

      {/* Target Items List */}
      <div className="space-y-4">
        {type15Items.length === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 text-xs">
            ยังไม่มีรายการเป้าหมายบูมทีม / คาราวาน กดปุ่ม &quot;เพิ่มเป้าหมาย&quot; ด้านบนเพื่อเริ่มต้น
          </div>
        ) : (
          type15Items.map((item, index) => {
            const isSubDealer = Boolean(item.isSubDealer);

            return (
              <div
                key={item.id}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4 transition-all hover:border-orange-300"
              >
                {/* Store Card Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      เป้าหมายบูมทีม / คาราวานที่ {index + 1}
                    </span>
                    {isSubDealer && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {item.isUnregisteredSubdealer
                          ? "Subdealer (ระบุเอง)"
                          : "Subdealer"}
                      </span>
                    )}
                  </div>

                  {!readonly && deleteType15Row && type15Items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteType15Row(item.id)}
                      className="p-1 rounded-md text-rose-500 hover:bg-rose-50 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>ลบเป้าหมายนี้</span>
                    </button>
                  )}
                </div>

                {/* 1. ประเภทลูกค้า / ร้านค้า (ตามเงื่อนไข Type 3) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    ประเภทลูกค้า / ร้านค้า <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-5">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                      <input
                        type="radio"
                        name={`customer-type-${item.id}`}
                        checked={!isSubDealer}
                        onChange={() => {
                          updateType15Row(item.id, "isSubDealer", false);
                          updateType15Row(item.id, "subDealerStore", "");
                          updateType15Row(item.id, "subdealerId", "");
                          updateType15Row(item.id, "subdealerName", "");
                          updateType15Row(
                            item.id,
                            "isUnregisteredSubdealer",
                            false,
                          );
                        }}
                        disabled={readonly}
                        className="text-orange-600 focus:ring-orange-500 h-4 w-4 cursor-pointer"
                      />
                      <span>ตัวแทนจำหน่ายหลัก (Dealer)</span>
                    </label>

                    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                      <input
                        type="radio"
                        name={`customer-type-${item.id}`}
                        checked={isSubDealer}
                        onChange={() => {
                          updateType15Row(item.id, "isSubDealer", true);
                        }}
                        disabled={readonly}
                        className="text-orange-600 focus:ring-orange-500 h-4 w-4 cursor-pointer"
                      />
                      <span>ร้านค้าย่อย (Subdealer)</span>
                    </label>
                  </div>
                </div>

                {/* Customer Selection Fields */}
                {!isSubDealer ? (
                  <div>
                    <ActivityCustomerSelect
                      id={`customer-combobox-${item.id}`}
                      type="DEALER"
                      label="ชื่อร้านค้า (Dealer)"
                      labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                      triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500"
                      value={item.storeId || ""}
                      onChange={(val, cust) => {
                        updateType15Row(item.id, "storeId", val || undefined);
                        updateType15Row(
                          item.id,
                          "customerName",
                          cust?.name || "",
                        );
                        updateType15Row(
                          item.id,
                          "dealerName",
                          cust?.name || "",
                        );
                      }}
                      customers={customers}
                      placeholder="เลือกร้านค้า Dealer..."
                      searchPlaceholder="ค้นหาร้านค้า Dealer..."
                      emptyText="ไม่พบร้านค้า Dealer ในระบบ"
                      disabled={readonly}
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-3 p-3 bg-amber-50/40 rounded-xl border border-amber-200/70">
                    {item.isUnregisteredSubdealer ? (
                      /* กรณี Subdealer ไม่มีในระบบ (ระบุเอง) */
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              1. ชื่อร้าน Subdealer{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <ActivityInput
                              type="text"
                              value={item.subDealerStore || ""}
                              onChange={(e) =>
                                updateType15Row(
                                  item.id,
                                  "subDealerStore",
                                  e.target.value,
                                )
                              }
                              disabled={readonly}
                              placeholder="ระบุชื่อร้านค้า Subdealer..."
                              required
                            />
                          </div>

                          <div>
                            <ActivityCustomerSelect
                              id={`parent-dealer-combobox-${item.id}`}
                              type="DEALER"
                              label="2. Dealer ต้นสังกัด"
                              labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                              triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500"
                              value={item.storeId || ""}
                              onChange={(val, cust) => {
                                updateType15Row(
                                  item.id,
                                  "storeId",
                                  val || undefined,
                                );
                                updateType15Row(
                                  item.id,
                                  "customerName",
                                  cust?.name || "",
                                );
                                updateType15Row(
                                  item.id,
                                  "dealerName",
                                  cust?.name || "",
                                );
                              }}
                              customers={customers}
                              placeholder="เลือก Dealer ต้นสังกัด..."
                              searchPlaceholder="ค้นหา Dealer ต้นสังกัด..."
                              emptyText="ไม่พบ Dealer ในระบบ"
                              disabled={readonly}
                              required
                            />
                          </div>
                        </div>

                        {!readonly && (
                          <div className="flex items-center justify-start pt-1">
                            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={Boolean(item.isUnregisteredSubdealer)}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  updateType15Row(
                                    item.id,
                                    "isUnregisteredSubdealer",
                                    isChecked,
                                  );
                                  if (!isChecked) {
                                    updateType15Row(
                                      item.id,
                                      "subDealerStore",
                                      "",
                                    );
                                  } else {
                                    updateType15Row(item.id, "subdealerId", "");
                                    updateType15Row(
                                      item.id,
                                      "subdealerName",
                                      "",
                                    );
                                  }
                                }}
                                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 h-3.5 w-3.5"
                              />
                              <span className="text-amber-800 font-semibold">
                                ร้านค้านี้ไม่มีในระบบ (ระบุเอง)
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* กรณี Subdealer มีในระบบ */
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <ActivityCustomerSelect
                              id={`subdealer-combobox-${item.id}`}
                              type="SUBDEALER"
                              label="เลือกร้านค้า Subdealer จากระบบ"
                              labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                              triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500"
                              value={item.subdealerId || ""}
                              onChange={(val, cust) => {
                                updateType15Row(
                                  item.id,
                                  "subdealerId",
                                  val || undefined,
                                );
                                updateType15Row(
                                  item.id,
                                  "subdealerName",
                                  cust?.name || "",
                                );
                                if (cust && cust.parentDealerId) {
                                  const parent = customers.find(
                                    (c) => c.id === cust.parentDealerId,
                                  );
                                  if (parent) {
                                    updateType15Row(
                                      item.id,
                                      "storeId",
                                      parent.id,
                                    );
                                    updateType15Row(
                                      item.id,
                                      "customerName",
                                      parent.name,
                                    );
                                    updateType15Row(
                                      item.id,
                                      "dealerName",
                                      parent.name,
                                    );
                                  }
                                }
                              }}
                              customers={customers}
                              placeholder="เลือกร้านค้า Subdealer..."
                              searchPlaceholder="ค้นหาร้านค้า Subdealer..."
                              emptyText="ไม่พบร้านค้า Subdealer ในระบบ"
                              disabled={readonly}
                              required
                            />
                          </div>

                          <div>
                            <ActivityCustomerSelect
                              id={`parent-dealer-combobox-${item.id}`}
                              type="DEALER"
                              label="Dealer ต้นสังกัด (ดึงข้อมูลอัตโนมัติ)"
                              labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                              triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-orange-500"
                              value={item.storeId || ""}
                              onChange={(val, cust) => {
                                updateType15Row(
                                  item.id,
                                  "storeId",
                                  val || undefined,
                                );
                                updateType15Row(
                                  item.id,
                                  "customerName",
                                  cust?.name || "",
                                );
                                updateType15Row(
                                  item.id,
                                  "dealerName",
                                  cust?.name || "",
                                );
                              }}
                              customers={customers}
                              placeholder="เลือก Dealer ต้นสังกัด..."
                              searchPlaceholder="ค้นหา Dealer ต้นสังกัด..."
                              emptyText="ไม่พบ Dealer ในระบบ"
                              disabled={readonly}
                              required
                            />
                          </div>
                        </div>

                        {!readonly && (
                          <div className="flex items-center justify-start pt-1">
                            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={Boolean(item.isUnregisteredSubdealer)}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  updateType15Row(
                                    item.id,
                                    "isUnregisteredSubdealer",
                                    isChecked,
                                  );
                                  if (isChecked) {
                                    updateType15Row(item.id, "subdealerId", "");
                                    updateType15Row(
                                      item.id,
                                      "subdealerName",
                                      "",
                                    );
                                  }
                                }}
                                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 h-3.5 w-3.5"
                              />
                              <span className="text-amber-800 font-semibold">
                                ร้านค้านี้ไม่มีในระบบ (ระบุเอง)
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. หมู่บ้าน */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    <span className="inline-flex items-center gap-1">
                      <Home className="h-3.5 w-3.5 text-slate-500" />
                      หมู่บ้าน
                    </span>
                  </label>
                  <ActivityInput
                    type="text"
                    value={item.village || ""}
                    onChange={(e) =>
                      updateType15Row(item.id, "village", e.target.value)
                    }
                    disabled={readonly}
                    placeholder="ระบุชื่อหมู่บ้านหรือชุมชนเป้าหมาย เช่น บ้านหนองเสือ ม.4"
                  />
                </div>

                {/* 3. วัตถุประสงค์ */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    <span className="inline-flex items-center gap-1">
                      <Target className="h-3.5 w-3.5 text-slate-500" />
                      วัตถุประสงค์
                    </span>
                  </label>
                  <ActivityInput
                    type="text"
                    value={item.objective || ""}
                    onChange={(e) =>
                      updateType15Row(item.id, "objective", e.target.value)
                    }
                    disabled={readonly}
                    placeholder="ระบุวัตถุประสงค์ เช่น ขบวนคาราวานประชาสัมพันธ์สินค้า, สาธิตสินค้าแก่เกษตรกร"
                  />
                </div>

                {/* 4. รายละเอียดเพิ่มเติม */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      รายละเอียดเพิ่มเติม
                    </span>
                  </label>
                  <ActivityTextarea
                    value={item.detail || ""}
                    onChange={(e) =>
                      updateType15Row(item.id, "detail", e.target.value)
                    }
                    disabled={readonly}
                    rows={3}
                    placeholder="ระบุรายละเอียดเพิ่มเติม เช่น กำหนดการ แผนการเดินทาง หรือกิจกรรมที่วางแผนไว้..."
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

