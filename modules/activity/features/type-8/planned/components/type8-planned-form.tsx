"use client";

import React from "react";
import { Users, Plus, Trash2, X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityCustomerSelect,
  ActivityProductSelect,
  ActivityInput,
  ActivityTextarea,
} from "@/modules/activity/ui";
import type {
  Type8MeetingItem,
  Type8PromotionProductItem,
  Type8MeetingTarget,
  Type8FarmerChannel,
  Type8PlannedFormProps,
  Type8PlanFormProps,
} from "../types/planned.types";

export type { Type8PlanFormProps, Type8PlannedFormProps };

export function Type8PlannedForm({
  readonly = false,
  type8Items = [],
  addType8Row,
  updateType8Row,
  deleteType8Row,
  addPromotionProduct,
  updatePromotionProduct,
  deletePromotionProduct,
  customers = [],
  products = [],
  onDealerSelect,
}: Type8PlannedFormProps) {
  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm sm:text-base">
          <Users className="h-4 w-4 text-indigo-600" />
          <span>จัดประชุม (Type 8)</span>
        </div>

        {/* ปิดไว้ก่อนเดียวมาเปิดเอง */}
        {/*
        {!readonly && addType8Row && (
          <Button
            type="button"
            size="sm"
            onClick={addType8Row}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl h-8 px-3 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการประชุม
          </Button>
        )} */}
      </div>

      {/* List of Meeting Cards */}
      <div className="space-y-4">
        {type8Items.length === 0 ? (
          <div className="py-8 text-center text-slate-400 italic bg-white rounded-xl border border-slate-200 text-xs">
            ยังไม่มีรายการประชุม
          </div>
        ) : (
          type8Items.map((item, index) => {
            const meetingTarget: Type8MeetingTarget =
              item.meetingTarget || "FARMER";
            const farmerChannel: Type8FarmerChannel =
              item.farmerChannel || "DEALER";

            const selectedProducts = item.targetProducts || [];
            const promoItems = item.promotionProducts || [];

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 transition-all hover:border-indigo-300"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-extrabold">
                      {index + 1}
                    </span>
                    รายการจัดประชุมที่ {index + 1}
                  </span>
                  {!readonly && deleteType8Row && type8Items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteType8Row(item.id)}
                      className="p-1 rounded-md text-red-500 hover:bg-red-50 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>ลบรายการ</span>
                    </button>
                  )}
                </div>

                {/* 1. จัดประชุมให้ใคร (Target Audience) */}
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      จัดประชุมให้ใคร <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-5">
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name={`meeting-target-${item.id}`}
                          value="FARMER"
                          checked={meetingTarget === "FARMER"}
                          onChange={() => {
                            updateType8Row(item.id, "meetingTarget", "FARMER");
                          }}
                          disabled={readonly}
                          className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span>ฟาร์มเมอร์ (เกษตรกร)</span>
                      </label>

                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name={`meeting-target-${item.id}`}
                          value="DEALER"
                          checked={meetingTarget === "DEALER"}
                          onChange={() => {
                            updateType8Row(item.id, "meetingTarget", "DEALER");
                            updateType8Row(item.id, "subDealerStore", "");
                            updateType8Row(item.id, "subdealerId", "");
                            updateType8Row(
                              item.id,
                              "isUnregisteredSubdealer",
                              false,
                            );
                          }}
                          disabled={readonly}
                          className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span>ดีลเลอร์</span>
                      </label>

                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name={`meeting-target-${item.id}`}
                          value="SUBDEALER"
                          checked={meetingTarget === "SUBDEALER"}
                          onChange={() => {
                            updateType8Row(
                              item.id,
                              "meetingTarget",
                              "SUBDEALER",
                            );
                          }}
                          disabled={readonly}
                          className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span>ซับดีลเลอร์</span>
                      </label>
                    </div>
                  </div>

                  {/* Case 1: ฟาร์มเมอร์ (เลือกช่องทาง ดีลเลอร์ vs ซับดีลเลอร์) */}
                  {meetingTarget === "FARMER" && (
                    <div className="pt-2 border-t border-slate-200/60 space-y-3">
                      <div className="flex items-center gap-4">
                        <span className="text-[11px] font-bold text-slate-600">
                          ช่องทางจัดประชุม:
                        </span>
                        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name={`farmer-channel-${item.id}`}
                            value="DEALER"
                            checked={farmerChannel === "DEALER"}
                            onChange={() => {
                              updateType8Row(
                                item.id,
                                "farmerChannel",
                                "DEALER",
                              );
                              updateType8Row(item.id, "subDealerStore", "");
                              updateType8Row(item.id, "subdealerId", "");
                              updateType8Row(
                                item.id,
                                "isUnregisteredSubdealer",
                                false,
                              );
                            }}
                            disabled={readonly}
                            className="text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                          />
                          <span>ดีลเลอร์</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="radio"
                            name={`farmer-channel-${item.id}`}
                            value="SUBDEALER"
                            checked={farmerChannel === "SUBDEALER"}
                            onChange={() => {
                              updateType8Row(
                                item.id,
                                "farmerChannel",
                                "SUBDEALER",
                              );
                            }}
                            disabled={readonly}
                            className="text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                          />
                          <span>ซับดีลเลอร์</span>
                        </label>
                      </div>

                      {farmerChannel === "DEALER" ? (
                        <div>
                          <ActivityCustomerSelect
                            id={`dealer-combobox-${item.id}`}
                            type="DEALER"
                            label="เลือกร้านค้า Dealer จาก Customer Master"
                            labelClassName="block text-xs font-semibold text-slate-700 mb-1"
                            value={item.dealerId || ""}
                            onChange={(val, cust) => {
                              updateType8Row(
                                item.id,
                                "dealerName",
                                cust?.name || "",
                              );
                              updateType8Row(
                                item.id,
                                "dealerId",
                                cust?.id || "",
                              );
                              if (onDealerSelect)
                                onDealerSelect(
                                  cust
                                    ? customers.find((c) => c.id === cust.id) ||
                                        null
                                    : null,
                                );
                            }}
                            customers={customers as any}
                            placeholder="เลือกร้านค้า Dealer..."
                            searchPlaceholder="ค้นหาร้านค้า Dealer..."
                            emptyText="ไม่พบร้านค้า Dealer ในระบบ"
                            disabled={readonly}
                            required
                          />
                        </div>
                      ) : item.isUnregisteredSubdealer ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">
                              ชื่อร้านค้า Subdealer{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <ActivityInput
                              value={item.subDealerStore || ""}
                              onChange={(e) =>
                                updateType8Row(
                                  item.id,
                                  "subDealerStore",
                                  e.target.value,
                                )
                              }
                              disabled={readonly}
                              placeholder="ระบุชื่อร้านค้า Subdealer..."
                            />
                            {!readonly && (
                              <div className="mt-2 flex items-center justify-start">
                                <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(
                                      item.isUnregisteredSubdealer,
                                    )}
                                    onChange={(e) => {
                                      const isChecked = e.target.checked;
                                      updateType8Row(
                                        item.id,
                                        "isUnregisteredSubdealer",
                                        isChecked,
                                      );
                                      if (isChecked) {
                                        updateType8Row(
                                          item.id,
                                          "subdealerId",
                                          "",
                                        );
                                      } else {
                                        updateType8Row(
                                          item.id,
                                          "subDealerStore",
                                          "",
                                        );
                                      }
                                    }}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                                  />
                                  <span>ร้านค้านี้ไม่มีในระบบ (ระบุเอง)</span>
                                </label>
                              </div>
                            )}
                          </div>
                          <div>
                            <ActivityCustomerSelect
                              id={`parent-dealer-combobox-${item.id}`}
                              type="DEALER"
                              label="เลือก Dealer ต้นสังกัด จาก Customer Master"
                              labelClassName="block text-xs font-semibold text-slate-700 mb-1"
                              value={item.dealerId || ""}
                              onChange={(val, cust) => {
                                updateType8Row(
                                  item.id,
                                  "dealerName",
                                  cust?.name || "",
                                );
                                updateType8Row(
                                  item.id,
                                  "dealerId",
                                  cust?.id || "",
                                );
                                if (onDealerSelect)
                                  onDealerSelect(
                                    cust
                                      ? customers.find(
                                          (c) => c.id === cust.id,
                                        ) || null
                                      : null,
                                  );
                              }}
                              customers={customers as any}
                              placeholder="เลือกร้านค้า Dealer ต้นสังกัด..."
                              searchPlaceholder="ค้นหา Dealer..."
                              emptyText="ไม่พบร้านค้า Dealer ในระบบ"
                              disabled={readonly}
                              required
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            เลือกร้านค้า Subdealer จาก Customer Master{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <ActivityCustomerSelect
                            id={`farmer-subdealer-combobox-${item.id}`}
                            type="SUBDEALER"
                            label=""
                            labelClassName="hidden"
                            value={item.subdealerId || ""}
                            onChange={(val, cust) => {
                              if (cust) {
                                updateType8Row(item.id, "subdealerId", cust.id);
                                if (cust.parentDealerId) {
                                  const parent = customers.find(
                                    (c) => c.id === cust.parentDealerId,
                                  );
                                  if (parent) {
                                    updateType8Row(
                                      item.id,
                                      "dealerId",
                                      parent.id,
                                    );
                                    updateType8Row(
                                      item.id,
                                      "dealerName",
                                      parent.name,
                                    );
                                    if (onDealerSelect)
                                      onDealerSelect(parent as any);
                                  }
                                }
                              } else {
                                updateType8Row(item.id, "subdealerId", "");
                              }
                            }}
                            customers={customers as any}
                            placeholder="เลือกร้านค้า Subdealer..."
                            searchPlaceholder="ค้นหาร้านค้า Subdealer..."
                            emptyText="ไม่พบร้านค้า Subdealer ในระบบ"
                            disabled={readonly}
                            required
                          />
                          {!readonly && (
                            <div className="mt-2.5 flex items-center justify-start">
                              <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={Boolean(
                                    item.isUnregisteredSubdealer,
                                  )}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    updateType8Row(
                                      item.id,
                                      "isUnregisteredSubdealer",
                                      isChecked,
                                    );
                                    if (isChecked) {
                                      updateType8Row(
                                        item.id,
                                        "subdealerId",
                                        "",
                                      );
                                    } else {
                                      updateType8Row(
                                        item.id,
                                        "subDealerStore",
                                        "",
                                      );
                                    }
                                  }}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                                />
                                <span>ร้านค้านี้ไม่มีในระบบ (ระบุเอง)</span>
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Case 2: ดีลเลอร์ */}
                  {meetingTarget === "DEALER" && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <ActivityCustomerSelect
                        id={`dealer-only-combobox-${item.id}`}
                        type="DEALER"
                        label="เลือกร้านค้า Dealer จาก Customer Master"
                        labelClassName="block text-xs font-semibold text-slate-700 mb-1"
                        value={item.dealerId || ""}
                        onChange={(val, cust) => {
                          updateType8Row(
                            item.id,
                            "dealerName",
                            cust?.name || "",
                          );
                          updateType8Row(item.id, "dealerId", cust?.id || "");
                          if (onDealerSelect)
                            onDealerSelect(
                              cust
                                ? customers.find((c) => c.id === cust.id) ||
                                    null
                                : null,
                            );
                        }}
                        customers={customers as any}
                        placeholder="เลือกร้านค้า Dealer..."
                        searchPlaceholder="ค้นหาร้านค้า Dealer..."
                        emptyText="ไม่พบร้านค้า Dealer ในระบบ"
                        disabled={readonly}
                        required
                      />
                    </div>
                  )}

                  {/* Case 3: ซับดีลเลอร์ */}
                  {meetingTarget === "SUBDEALER" && (
                    <div className="pt-2 border-t border-slate-200/60">
                      {item.isUnregisteredSubdealer ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">
                              ชื่อร้านค้า Subdealer{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <ActivityInput
                              value={item.subDealerStore || ""}
                              onChange={(e) =>
                                updateType8Row(
                                  item.id,
                                  "subDealerStore",
                                  e.target.value,
                                )
                              }
                              disabled={readonly}
                              placeholder="ระบุชื่อร้านค้า Subdealer..."
                            />
                            {!readonly && (
                              <div className="mt-2 flex items-center justify-start">
                                <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(
                                      item.isUnregisteredSubdealer,
                                    )}
                                    onChange={(e) => {
                                      const isChecked = e.target.checked;
                                      updateType8Row(
                                        item.id,
                                        "isUnregisteredSubdealer",
                                        isChecked,
                                      );
                                      if (isChecked) {
                                        updateType8Row(
                                          item.id,
                                          "subdealerId",
                                          "",
                                        );
                                      } else {
                                        updateType8Row(
                                          item.id,
                                          "subDealerStore",
                                          "",
                                        );
                                      }
                                    }}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                                  />
                                  <span>ร้านค้านี้ไม่มีในระบบ (ระบุเอง)</span>
                                </label>
                              </div>
                            )}
                          </div>
                          <div>
                            <ActivityCustomerSelect
                              id={`subdealer-parent-dealer-combobox-${item.id}`}
                              type="DEALER"
                              label="เลือก Dealer ต้นสังกัด จาก Customer Master"
                              labelClassName="block text-xs font-semibold text-slate-700 mb-1"
                              value={item.dealerId || ""}
                              onChange={(val, cust) => {
                                updateType8Row(
                                  item.id,
                                  "dealerName",
                                  cust?.name || "",
                                );
                                updateType8Row(
                                  item.id,
                                  "dealerId",
                                  cust?.id || "",
                                );
                                if (onDealerSelect)
                                  onDealerSelect(
                                    cust
                                      ? customers.find(
                                          (c) => c.id === cust.id,
                                        ) || null
                                      : null,
                                  );
                              }}
                              customers={customers as any}
                              placeholder="เลือกร้านค้า Dealer ต้นสังกัด..."
                              searchPlaceholder="ค้นหา Dealer..."
                              emptyText="ไม่พบร้านค้า Dealer ในระบบ"
                              disabled={readonly}
                              required
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            เลือกร้านค้า Subdealer จาก Customer Master{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <ActivityCustomerSelect
                            id={`subdealer-target-combobox-${item.id}`}
                            type="SUBDEALER"
                            label=""
                            labelClassName="hidden"
                            value={item.subdealerId || ""}
                            onChange={(val, cust) => {
                              if (cust) {
                                updateType8Row(item.id, "subdealerId", cust.id);
                                if (cust.parentDealerId) {
                                  const parent = customers.find(
                                    (c) => c.id === cust.parentDealerId,
                                  );
                                  if (parent) {
                                    updateType8Row(
                                      item.id,
                                      "dealerId",
                                      parent.id,
                                    );
                                    updateType8Row(
                                      item.id,
                                      "dealerName",
                                      parent.name,
                                    );
                                    if (onDealerSelect)
                                      onDealerSelect(parent as any);
                                  }
                                }
                              } else {
                                updateType8Row(item.id, "subdealerId", "");
                              }
                            }}
                            customers={customers as any}
                            placeholder="เลือกร้านค้า Subdealer..."
                            searchPlaceholder="ค้นหาร้านค้า Subdealer..."
                            emptyText="ไม่พบร้านค้า Subdealer ในระบบ"
                            disabled={readonly}
                            required
                          />
                          {!readonly && (
                            <div className="mt-2.5 flex items-center justify-start">
                              <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-700 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={Boolean(
                                    item.isUnregisteredSubdealer,
                                  )}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    updateType8Row(
                                      item.id,
                                      "isUnregisteredSubdealer",
                                      isChecked,
                                    );
                                    if (isChecked) {
                                      updateType8Row(
                                        item.id,
                                        "subdealerId",
                                        "",
                                      );
                                    } else {
                                      updateType8Row(
                                        item.id,
                                        "subDealerStore",
                                        "",
                                      );
                                    }
                                  }}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                                />
                                <span>ร้านค้านี้ไม่มีในระบบ (ระบุเอง)</span>
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. หัวข้อการประชุม & เป้าหมายผู้เข้าร่วม */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                  <div className="md:col-span-8 space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      หัวข้อที่จะประชุม <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      value={item.topic || ""}
                      onChange={(e) =>
                        updateType8Row(item.id, "topic", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="เช่น ประชุมวางแผนฤดูกาลเพาะปลูก แนะนำปุ๋ยสูตรใหม่..."
                      required
                    />
                  </div>

                  <div className="md:col-span-4 space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      เป้าหมายผู้เข้าร่วม (คน){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      type="number"
                      min={1}
                      value={item.attendeesCount ?? 10}
                      onChange={(e) =>
                        updateType8Row(
                          item.id,
                          "attendeesCount",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      disabled={readonly}
                      className="text-center font-bold text-indigo-900"
                    />
                  </div>
                </div>

                {/* 3. สินค้าเป้าหมาย (สูงสุด 5 รายการ) */}
                <div className="space-y-2 p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      สินค้าเป้าหมายที่จะแนะนำ (สูงสุด 5 รายการ)
                    </label>
                    <span className="text-[11px] font-semibold text-indigo-700">
                      {selectedProducts.length}/5 รายการ
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedProducts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProducts.map((prod) => (
                          <span
                            key={prod}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 text-xs font-medium border border-indigo-200 shadow-2xs"
                          >
                            {prod}
                            {!readonly && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = selectedProducts.filter(
                                    (p) => p !== prod,
                                  );
                                  const prodObj = (products || []).find(
                                    (p) => p.name === prod || p.id === prod,
                                  );
                                  const updatedIds = (
                                    item.targetProductIds || []
                                  ).filter(
                                    (id) => id !== prodObj?.id && id !== prod,
                                  );
                                  updateType8Row(
                                    item.id,
                                    "targetProducts",
                                    updated,
                                  );
                                  updateType8Row(
                                    item.id,
                                    "targetProductIds",
                                    updatedIds,
                                  );
                                }}
                                className="text-indigo-400 hover:text-indigo-700 font-bold ml-1 cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    {!readonly && selectedProducts.length < 5 && (
                      <ActivityProductSelect
                        id={`target-product-combobox-${item.id}`}
                        value=""
                        valueKey="name"
                        excludeValues={selectedProducts}
                        onChange={(val, prod) => {
                          if (!val) return;
                          if (
                            selectedProducts.length < 5 &&
                            !selectedProducts.includes(val)
                          ) {
                            const newProdName = prod?.name || val;
                            const newProdId = prod?.id || val;
                            updateType8Row(item.id, "targetProducts", [
                              ...selectedProducts,
                              newProdName,
                            ]);
                            updateType8Row(item.id, "targetProductIds", [
                              ...(item.targetProductIds || []),
                              newProdId,
                            ]);
                          }
                        }}
                        products={products as any}
                        placeholder={`+ เพิ่มสินค้าเป้าหมาย (${selectedProducts.length}/5)`}
                        searchPlaceholder="ค้นหาสินค้าเป้าหมาย..."
                        emptyText="ไม่พบสินค้า"
                        disabled={readonly}
                      />
                    )}

                    {selectedProducts.length === 5 && (
                      <span className="text-[11px] text-amber-600 font-medium block">
                        เลือกครบ 5 รายการแล้ว
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. รายการสินค้าที่เสนอขาย / โปรโมชันหน้าร้าน */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                      <ShoppingBag className="h-4 w-4 text-teal-600" />
                      รายการสินค้าที่เสนอขาย / โปรโมชันหน้าร้าน
                    </span>

                    {!readonly && addPromotionProduct && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addPromotionProduct(item.id)}
                        className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg h-7 px-2.5 shadow-xs"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        เพิ่มรายการโปรโมชัน
                      </Button>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-2 px-2.5 text-center w-12">
                            ลำดับ
                          </th>
                          <th className="py-2 px-2.5 min-w-[240px]">
                            รายละเอียด (โปรโมชัน)
                          </th>
                          {!readonly && (
                            <th className="py-2 px-2 text-center w-12">ลบ</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {promoItems.length === 0 ? (
                          <tr>
                            <td
                              colSpan={readonly ? 2 : 3}
                              className="py-4 text-center text-slate-400 italic"
                            >
                              ยังไม่มีรายการโปรโมชัน
                            </td>
                          </tr>
                        ) : (
                          promoItems.map((promo, pIdx) => {
                            return (
                              <tr
                                key={promo.id}
                                className="hover:bg-slate-50/60 transition-colors"
                              >
                                <td className="py-2 px-2.5 text-center font-medium text-slate-500">
                                  {pIdx + 1}
                                </td>
                                <td className="py-1.5 px-2.5">
                                  <ActivityInput
                                    value={promo.notes || ""}
                                    onChange={(e) => {
                                      if (updatePromotionProduct) {
                                        updatePromotionProduct(
                                          item.id,
                                          promo.id,
                                          "notes",
                                          e.target.value,
                                        );
                                      }
                                    }}
                                    disabled={readonly}
                                    placeholder="ระบุรายละเอียด เช่น โปรโมชัน 10 แถม 1..."
                                  />
                                </td>
                                {!readonly && deletePromotionProduct && (
                                  <td className="py-1.5 px-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        deletePromotionProduct(
                                          item.id,
                                          promo.id,
                                        )
                                      }
                                      className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                      title="ลบรายการ"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mx-auto" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. รายละเอียดเพิ่มเติม */}
                <ActivityTextarea
                  label="รายละเอียดเพิ่มเติม / กำหนดการ"
                  labelClassName="block text-xs font-semibold text-slate-700 mb-1"
                  rows={2}
                  value={item.detail || ""}
                  onChange={(e) =>
                    updateType8Row(item.id, "detail", e.target.value)
                  }
                  disabled={readonly}
                  placeholder="ระบุรายละเอียดเพิ่มเติมการจัดประชุม เช่น กำหนดการ..."
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Backward-compatible alias
export const Type8PlanForm = Type8PlannedForm;
export const Type8Meeting = Type8PlannedForm;
