"use client";

import React from "react";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Package,
  DollarSign,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivitySelect } from "@/modules/activity/ui";
import {
  ActivityInput,
  ActivityCustomerSelect,
  ActivityProductSelect,
} from "@/modules/activity/ui";
import { cn } from "@/lib/utils";
import { NOT_CLOSED_REASONS } from "../../shared/constants";
import type { Type3UnplannedFormProps } from "../types/unplanned.types";

export type { Type3UnplannedFormProps };

export function Type3UnplannedForm({
  items = [],
  addItem,
  removeItem,
  updateItem,
  addProduct,
  removeProduct,
  updateProduct,
  customers = [],
  products = [],
  readonly = false,
}: Type3UnplannedFormProps) {
  const totalTargetQty = items.reduce(
    (sum, it) =>
      sum +
      it.products.reduce(
        (pSum, p) => pSum + (Number(p.targetQuantity) || 0),
        0,
      ),
    0,
  );

  const totalActualQty = items.reduce(
    (sum, it) =>
      sum +
      it.products.reduce(
        (pSum, p) => pSum + (Number(p.actualQuantity) || 0),
        0,
      ),
    0,
  );

  const totalActualAmount = items.reduce(
    (sum, it) =>
      sum +
      it.products.reduce((pSum, p) => pSum + (Number(p.actualTotal) || 0), 0),
    0,
  );

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm sm:text-base">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div>
            <span>เสนอขายสินค้านอกแผน (Unplanned Sales Proposal 2-in-1)</span>
            <p className="text-xs text-slate-500 font-normal">
              ระบุร้านค้า สินค้า และยอดขายจริงที่ปิดได้ทันทีหน้างาน
            </p>
          </div>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addItem}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg h-8 px-3 shadow-sm cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มร้านค้าเป้าหมาย
          </Button>
        )}
      </div>

      {/* 2. Unplanned Stores List */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 text-xs">
            ยังไม่มีรายการเสนอขายสินค้านอกแผน กดปุ่ม
            &quot;เพิ่มร้านค้าเป้าหมาย&quot; ด้านบนเพื่อเริ่มต้น
          </div>
        ) : (
          items.map((item, index) => {
            const isSubDealer = Boolean(item.isSubDealer);

            const cardTargetQty = item.products.reduce(
              (sum, p) => sum + (Number(p.targetQuantity) || 0),
              0,
            );
            const cardActualQty = item.products.reduce(
              (sum, p) => sum + (Number(p.actualQuantity) || 0),
              0,
            );
            const cardActualAmount = item.products.reduce(
              (sum, p) => sum + (Number(p.actualTotal) || 0),
              0,
            );

            return (
              <div
                key={item.id}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4 transition-all hover:border-emerald-300"
              >
                {/* Store Card Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      ร้านค้าเป้าหมายที่ {index + 1}
                    </span>
                    {isSubDealer && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {item.isUnregisteredSubdealer
                          ? "Subdealer (ระบุเอง)"
                          : "Subdealer"}
                      </span>
                    )}
                  </div>

                  {!readonly && items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 rounded-md text-rose-500 hover:bg-rose-50 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>ลบร้านค้านี้</span>
                    </button>
                  )}
                </div>

                {/* Customer Type Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    ประเภทลูกค้า / ร้านค้า{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-5">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                      <input
                        type="radio"
                        name={`unplanned-type-${item.id}`}
                        checked={!isSubDealer}
                        onChange={() => {
                          updateItem(item.id, "isSubDealer", false);
                          updateItem(item.id, "subDealerStore", "");
                          updateItem(item.id, "subdealerId", "");
                          updateItem(item.id, "subdealerName", "");
                          updateItem(item.id, "isUnregisteredSubdealer", false);
                        }}
                        disabled={readonly}
                        className="text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                      />
                      <span>ตัวแทนจำหน่ายหลัก (Dealer)</span>
                    </label>

                    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                      <input
                        type="radio"
                        name={`unplanned-type-${item.id}`}
                        checked={isSubDealer}
                        onChange={() => {
                          updateItem(item.id, "isSubDealer", true);
                        }}
                        disabled={readonly}
                        className="text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                      />
                      <span>ร้านค้าย่อย (Subdealer)</span>
                    </label>
                  </div>
                </div>

                {/* Customer Selection Fields */}
                {!isSubDealer ? (
                  <div>
                    <ActivityCustomerSelect
                      id={`unplanned-cust-${item.id}`}
                      type="DEALER"
                      label="ชื่อร้านค้า (Dealer)"
                      labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                      triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                      value={item.storeId || ""}
                      onChange={(val, cust) => {
                        updateItem(item.id, "storeId", val || undefined);
                        updateItem(item.id, "storeName", cust?.name || "");
                        updateItem(item.id, "dealerName", cust?.name || "");
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
                                updateItem(
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
                              id={`unplanned-parent-${item.id}`}
                              type="DEALER"
                              label="2. Dealer ต้นสังกัด"
                              labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                              triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                              value={item.storeId || ""}
                              onChange={(val, cust) => {
                                updateItem(
                                  item.id,
                                  "storeId",
                                  val || undefined,
                                );
                                updateItem(
                                  item.id,
                                  "storeName",
                                  cust?.name || "",
                                );
                                updateItem(
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
                                  updateItem(
                                    item.id,
                                    "isUnregisteredSubdealer",
                                    isChecked,
                                  );
                                  if (!isChecked) {
                                    updateItem(item.id, "subDealerStore", "");
                                  } else {
                                    updateItem(item.id, "subdealerId", "");
                                    updateItem(item.id, "subdealerName", "");
                                  }
                                }}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
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
                              id={`unplanned-subdealer-${item.id}`}
                              type="SUBDEALER"
                              label="เลือกร้านค้า Subdealer จากระบบ"
                              labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                              triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                              value={item.subdealerId || ""}
                              onChange={(val, cust) => {
                                updateItem(
                                  item.id,
                                  "subdealerId",
                                  val || undefined,
                                );
                                updateItem(
                                  item.id,
                                  "subdealerName",
                                  cust?.name || "",
                                );
                                if (cust) {
                                  if (cust.parentDealerId) {
                                    const parent = customers.find(
                                      (c) => c.id === cust.parentDealerId,
                                    );
                                    if (parent) {
                                      updateItem(item.id, "storeId", parent.id);
                                      updateItem(
                                        item.id,
                                        "storeName",
                                        parent.name,
                                      );
                                      updateItem(
                                        item.id,
                                        "dealerName",
                                        parent.name,
                                      );
                                    }
                                  }
                                } else {
                                  updateItem(item.id, "subdealerName", "");
                                }
                              }}
                              customers={customers}
                              placeholder="เลือกร้านค้า Subdealer ในระบบ..."
                              searchPlaceholder="ค้นหาร้านค้า Subdealer..."
                              emptyText="ไม่พบร้านค้า Subdealer ในระบบ"
                              disabled={readonly}
                              required
                            />
                          </div>

                          <div>
                            <ActivityCustomerSelect
                              id={`unplanned-parent-${item.id}`}
                              type="DEALER"
                              label="Dealer ต้นสังกัด"
                              labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                              triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                              value={item.storeId || ""}
                              onChange={(val, cust) => {
                                updateItem(
                                  item.id,
                                  "storeId",
                                  val || undefined,
                                );
                                updateItem(
                                  item.id,
                                  "storeName",
                                  cust?.name || "",
                                );
                                updateItem(
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
                                  updateItem(
                                    item.id,
                                    "isUnregisteredSubdealer",
                                    isChecked,
                                  );
                                  if (isChecked) {
                                    updateItem(item.id, "subdealerId", "");
                                    updateItem(item.id, "subdealerName", "");
                                  } else {
                                    updateItem(item.id, "subDealerStore", "");
                                  }
                                }}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                              />
                              <span>ร้านค้านี้ไม่มีในระบบ (ระบุเอง)</span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Product Lines Section */}
                <div className="space-y-3 bg-slate-50/60 p-3 sm:p-3.5 rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-emerald-600" />
                      รายการสินค้าและยอดขายจริง{" "}
                      <span className="text-rose-500">*</span>
                    </span>
                    {!readonly && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addProduct(item.id)}
                        className="h-7 text-xs px-2.5 border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 shadow-2xs cursor-pointer"
                      >
                        <Plus className="h-3 w-3 mr-1 text-emerald-600" />
                        เพิ่มสินค้า
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {item.products.map((prod, pIdx) => {
                      const isUnclosed =
                        Number(prod.actualQuantity) <= 0 ||
                        Boolean(prod.unclosedReason);

                      return (
                        <div
                          key={prod.id}
                          className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs space-y-2.5"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                            {/* Product Select */}
                            <div className="md:col-span-5">
                              <ActivityProductSelect
                                id={`unplanned-prod-${item.id}-${prod.id}`}
                                label={`สินค้าที่ ${pIdx + 1}`}
                                labelClassName="block text-[11px] font-semibold text-slate-600 mb-1 mx-0"
                                triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                                value={prod.productName}
                                valueKey="name"
                                unitFilter="box"
                                onChange={(val, pOption) =>
                                  updateProduct(
                                    item.id,
                                    prod.id,
                                    "productName",
                                    val,
                                    pOption,
                                  )
                                }
                                products={products}
                                placeholder="เลือกสินค้า..."
                                searchPlaceholder="ค้นหาสินค้า..."
                                emptyText="ไม่พบสินค้า"
                                disabled={readonly}
                                required
                              />
                            </div>

                            {/* Actual Quantity Sold */}
                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                ขายได้จริง{" "}
                                <span className="text-rose-500">*</span>
                              </label>
                              <ActivityInput
                                type="number"
                                min={0}
                                value={
                                  prod.actualQuantity === 0
                                    ? ""
                                    : prod.actualQuantity
                                }
                                onChange={(e) =>
                                  updateProduct(
                                    item.id,
                                    prod.id,
                                    "actualQuantity",
                                    e.target.value === ""
                                      ? 0
                                      : parseInt(e.target.value) || 0,
                                  )
                                }
                                disabled={readonly}
                                className="text-center font-bold text-emerald-900"
                                placeholder="0"
                                required
                              />
                            </div>

                            {/* Unit Price */}
                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                ราคา/ลัง (บาท)
                              </label>
                              <ActivityInput
                                type="number"
                                min={0}
                                value={
                                  prod.unitPrice === 0 ? "" : prod.unitPrice
                                }
                                onChange={(e) =>
                                  updateProduct(
                                    item.id,
                                    prod.id,
                                    "unitPrice",
                                    e.target.value === ""
                                      ? 0
                                      : parseFloat(e.target.value) || 0,
                                  )
                                }
                                disabled={readonly}
                                className="text-right font-medium"
                                placeholder="0"
                              />
                            </div>

                            {/* Actual Total Amount */}
                            <div className="md:col-span-3 flex items-center gap-1.5">
                              <div className="flex-1">
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                  ยอดขายจริง
                                </label>
                                <div className="h-9 px-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-900">
                                  <span>฿</span>
                                  <span>
                                    {(
                                      Number(prod.actualTotal) || 0
                                    ).toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              {!readonly && item.products.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeProduct(item.id, prod.id)
                                  }
                                  className="h-9 w-9 mt-5 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="ลบสินค้านี้"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Unclosed Reason if not sold or under target */}
                          {isUnclosed && (
                            <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-2.5 space-y-1.5">
                              <span className="text-amber-800 font-bold text-xs flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                เหตุผลที่ไม่สามารถปิดการขายได้ /
                                ปิดได้ไม่ครบตามเป้า{" "}
                                <span className="text-rose-500">*</span>
                              </span>
                              {(() => {
                                const STANDARD_REASONS =
                                  NOT_CLOSED_REASONS.filter(
                                    (r) => r !== "อื่นๆ",
                                  );
                                const reasonVal = prod.unclosedReason || "";
                                const isStd = STANDARD_REASONS.includes(
                                  reasonVal as any,
                                );
                                const isOther =
                                  Boolean(reasonVal) &&
                                  (!isStd || reasonVal === "อื่นๆ");
                                const selectVal = isStd
                                  ? reasonVal
                                  : isOther
                                    ? "อื่นๆ"
                                    : "";
                                const customText = isStd
                                  ? ""
                                  : reasonVal === "อื่นๆ"
                                    ? ""
                                    : reasonVal;

                                return (
                                  <div
                                    className={cn(
                                      "grid gap-2",
                                      isOther
                                        ? "grid-cols-1 sm:grid-cols-2"
                                        : "grid-cols-1",
                                    )}
                                  >
                                    <ActivitySelect
                                      value={selectVal}
                                      onChange={(val) =>
                                        updateProduct(
                                          item.id,
                                          prod.id,
                                          "unclosedReason",
                                          val,
                                        )
                                      }
                                      options={[...NOT_CLOSED_REASONS]}
                                      placeholder="-- เลือกเหตุผลหลัก --"
                                      disabled={readonly}
                                    />
                                    {isOther && (
                                      <ActivityInput
                                        type="text"
                                        value={customText}
                                        onChange={(e) =>
                                          updateProduct(
                                            item.id,
                                            prod.id,
                                            "unclosedReason",
                                            e.target.value || "อื่นๆ",
                                          )
                                        }
                                        placeholder="หรือพิมพ์ระบุเหตุผล/คู่แข่งเพิ่มเติม..."
                                        className="bg-white text-xs"
                                        disabled={readonly}
                                        autoFocus
                                      />
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Store Subtotal */}
                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">
                    ขายได้จริง:{" "}
                    <strong className="text-emerald-800 ml-1">
                      {cardActualQty.toLocaleString()}
                    </strong>{" "}
                    ลัง
                  </span>
                  <span className="text-slate-600">
                    ยอดขายร้านนี้:{" "}
                    <strong className="text-emerald-700 text-sm ml-1">
                      ฿
                      {cardActualAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Global Summary Footer */}
      {items.length > 0 && (
        <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-emerald-900 font-bold">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>สรุปผลการเสนอขายรวมทั้งหมด</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              {items.length} ร้านค้า
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-600">
              ขายได้จริงรวม:{" "}
              <strong className="text-emerald-800 ml-1">
                {totalActualQty.toLocaleString()}
              </strong>{" "}
              ลัง
            </span>
            <span className="text-emerald-900 font-extrabold text-sm sm:text-base">
              ยอดขายรวม: ฿
              {totalActualAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
