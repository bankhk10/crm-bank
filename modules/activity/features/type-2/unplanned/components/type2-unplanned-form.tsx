"use client";

import React, { useMemo } from "react";
import {
  Store,
  UserCheck,
  Plus,
  Trash2,
  Package,
  AlertTriangle,
  Camera,
} from "lucide-react";
import { ActivityAddressSelect } from "@/components/activity/activity-address-select";
import { ActivityCustomerSelect } from "@/components/activity/activity-customer-select";
import { ActivityPhotoUpload } from "@/components/activity/activity-photo-upload";
import { ActivityProductSelect } from "@/components/activity/activity-product-select";
import { FormCombobox } from "@/components/custom/form-components";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { USAGE_RESULTS } from "../../shared/constants";
import type { Type2UnplannedFormProps } from "../types/unplanned.types";

export function Type2UnplannedForm({
  readonly = false,
  items,
  customers = [],
  products = [],
  addItem,
  updateItem,
  deleteItem,
  addProductToItem,
  updateProductInItem,
  deleteProductFromItem,
}: Type2UnplannedFormProps) {
  const currentItems =
    items && items.length > 0
      ? items
      : [
          {
            id: "1",
            visitPurpose: "FARMER" as const,
            province: "",
            isUnregisteredFarmer: false,
            storeId: "",
            customerName: "",
            unregisteredFarmerName: "",
            unregisteredFarmerPhone: "",
            notes: "",
            products: [
              {
                id: "p0",
                productName: "",
                notes: "",
                usageResult: "พืชตอบสนองดี" as const,
                followupDetail: "",
                problemDetail: "",
              },
            ],
            images: [],
          },
        ];

  const productComboboxOptions = useMemo(() => {
    return products.map((p) => ({
      value: p.name,
      label: p.name,
      subLabel: p.productCode || undefined,
    }));
  }, [products]);

  const nonBoxProducts = useMemo(() => {
    return (products || []).filter((p) => (p.unit || "").trim() !== "กล่อง");
  }, [products]);

  const handleUsageResultChange = (
    itemId: string,
    prodId: string,
    newUsage: "ลูกค้าพึงพอใจ" | "พบปัญหา",
  ) => {
    if (!updateProductInItem) return;
    updateProductInItem(itemId, prodId, "usageResult", newUsage);
    if (newUsage === "ลูกค้าพึงพอใจ") {
      updateProductInItem(itemId, prodId, "problemDetail", "");
    } else {
      updateProductInItem(itemId, prodId, "followupDetail", "");
    }
  };

  const handlePurposeChange = (
    id: string,
    currentPurpose: "FARMER" | "STORE",
    newPurpose: "FARMER" | "STORE",
  ) => {
    if (newPurpose === currentPurpose) return;
    updateItem(id, "visitPurpose", newPurpose);
    updateItem(id, "storeId", undefined);
    updateItem(id, "customerName", "");
    updateItem(id, "province", "");
    updateItem(id, "isUnregisteredFarmer", false);
    updateItem(id, "unregisteredFarmerName", "");
    updateItem(id, "unregisteredFarmerPhone", "");
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            รายการติดตามผลการใช้สินค้า (นอกแผน)
          </h3>
          <p className="text-xs text-slate-500">
            ระบุร้านค้า/เกษตรกร พร้อมบันทึกผลการตอบสนองและปัญหาที่พบในครั้งเดียว
          </p>
        </div>
        {!readonly && addItem && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addItem}
            className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" />
            เพิ่มเป้าหมาย
          </Button>
        )}
      </div>

      {/* Target Items List */}
      <div className="space-y-6">
        {currentItems.map((item, index) => {
          const isStore = item.visitPurpose === "STORE";

          return (
            <div
              key={item.id}
              className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-5"
            >
              {/* Item Top Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    เป้าหมายที่ {index + 1}
                  </span>
                </div>
                {!readonly && deleteItem && currentItems.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteItem(item.id)}
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-8 px-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    ลบเป้าหมาย
                  </Button>
                )}
              </div>

              {/* 1. Purpose Selector */}
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  กลุ่มเป้าหมายที่เข้าพบ <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    disabled={readonly}
                    onClick={() =>
                      handlePurposeChange(item.id, item.visitPurpose, "FARMER")
                    }
                    className={cn(
                      "flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer",
                      !isStore
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>เกษตรกร</span>
                  </button>
                  <button
                    type="button"
                    disabled={readonly}
                    onClick={() =>
                      handlePurposeChange(item.id, item.visitPurpose, "STORE")
                    }
                    className={cn(
                      "flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer",
                      isStore
                        ? "bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <Store className="w-4 h-4" />
                    <span>ร้านค้า</span>
                  </button>
                </div>
              </div>

              {/* 2. Target Customer Selection */}
              <div className="space-y-3">
                {isStore ? (
                  <div>
                    <ActivityCustomerSelect
                      id={`unplanned-type2-store-${item.id}`}
                      type="STORE"
                      value={item.storeId || ""}
                      onChange={(val, cust) => {
                        updateItem(item.id, "storeId", val || undefined);
                        updateItem(
                          item.id,
                          "customerName",
                          cust?.name || "",
                        );
                      }}
                      customers={customers}
                      disabled={readonly}
                      required
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                    <ActivityAddressSelect
                      id={`unplanned-type2-province-${item.id}`}
                      levels="province"
                      value={item.province || ""}
                      onChange={(val: string) =>
                        updateItem(item.id, "province", val)
                      }
                      disabled={readonly}
                      required
                    />

                    <ActivityCustomerSelect
                      id={`unplanned-type2-farmer-${item.id}`}
                      type="FARMER"
                      province={item.province}
                      value={item.storeId || ""}
                      onChange={(val, cust) => {
                        updateItem(item.id, "storeId", val || undefined);
                        updateItem(
                          item.id,
                          "customerName",
                          cust?.name || "",
                        );
                      }}
                      customers={customers}
                      disabled={readonly}
                      required
                      allowUnregistered
                      isUnregistered={Boolean(item.isUnregisteredFarmer)}
                      onUnregisteredToggle={(chk) => {
                        updateItem(item.id, "isUnregisteredFarmer", chk);
                        if (chk) {
                          updateItem(item.id, "storeId", undefined);
                          updateItem(item.id, "customerName", "");
                        }
                      }}
                      unregisteredName={item.unregisteredFarmerName || ""}
                      onUnregisteredNameChange={(val) =>
                        updateItem(item.id, "unregisteredFarmerName", val)
                      }
                      unregisteredPhone={item.unregisteredFarmerPhone || ""}
                      onUnregisteredPhoneChange={(val) =>
                        updateItem(item.id, "unregisteredFarmerPhone", val)
                      }
                    />
                  </div>
                )}
              </div>

              {/* 3. Products Tracked & Actual Feedback (สไตล์บันทึกผลการติดตามสินค้าตามแผน แบบ Type 2 Actual) */}
              <div className="border-t border-slate-200/80 pt-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <label className="text-sm font-bold text-slate-900">
                      บันทึกผลการติดตามสินค้า ({item.products.length} รายการ)
                    </label>
                  </div>
                  {!readonly && addProductToItem && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addProductToItem(item.id)}
                      className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-7 px-2.5 rounded-lg cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      เพิ่มสินค้า
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {item.products.map((prod, pIdx) => {
                    const isProblem = prod.usageResult === "พบปัญหา";
                    const activeUsage =
                      prod.usageResult === "พบปัญหา"
                        ? "พบปัญหา"
                        : "ลูกค้าพึงพอใจ";

                    return (
                      <div
                        key={prod.id || pIdx}
                        className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs transition-all hover:border-emerald-300"
                      >
                        {/* Header สินค้า */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                              {pIdx + 1}
                            </span>
                            <span>
                              สินค้าชิ้นที่ {pIdx + 1}
                              {prod.productName ? `: ${prod.productName}` : ""}
                            </span>
                          </div>

                          {!readonly &&
                            deleteProductFromItem &&
                            item.products.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  deleteProductFromItem(item.id, prod.id)
                                }
                                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium py-1 px-2 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>ลบสินค้า</span>
                              </button>
                            )}
                        </div>

                        {/* เลือกสินค้า */}
                        <div>
                          <ActivityProductSelect
                            id={`unplanned-product-${item.id}-${prod.id}`}
                            label="สินค้า"
                            labelClassName="block text-xs font-semibold text-slate-700 mb-1"
                            triggerClassName="h-10 text-xs bg-white border-slate-300 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                            value={prod.productName || ""}
                            valueKey="name"
                            onChange={(val, pItem) => {
                              if (updateProductInItem) {
                                updateProductInItem(
                                  item.id,
                                  prod.id,
                                  "productName",
                                  val || "",
                                );
                                updateProductInItem(
                                  item.id,
                                  prod.id,
                                  "productId",
                                  pItem?.id || "",
                                );
                              }
                            }}
                            products={
                              nonBoxProducts.length > 0
                                ? nonBoxProducts
                                : products
                            }
                            placeholder="เลือกสินค้า..."
                            searchPlaceholder="ค้นหาสินค้า..."
                            emptyText="ไม่พบสินค้า"
                            disabled={readonly}
                            required
                          />
                        </div>

                        {/* ผลการใช้สินค้า (Toggle Buttons: 🟢 ลูกค้าพึงพอใจ / ⚠️ พบปัญหา) */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-800">
                            ผลการใช้สินค้า{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {(["ลูกค้าพึงพอใจ", "พบปัญหา"] as const).map(
                              (opt) => {
                                const isSelected = activeUsage === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    disabled={readonly}
                                    onClick={() =>
                                      handleUsageResultChange(
                                        item.id,
                                        prod.id,
                                        opt,
                                      )
                                    }
                                    className={cn(
                                      "py-2.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5",
                                      isSelected
                                        ? opt === "ลูกค้าพึงพอใจ"
                                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs"
                                          : "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20 shadow-xs"
                                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300",
                                      readonly &&
                                        "opacity-75 cursor-not-allowed",
                                    )}
                                  >
                                    <span>
                                      {opt === "ลูกค้าพึงพอใจ"
                                        ? "🟢"
                                        : "⚠️"}
                                    </span>
                                    <span>{opt}</span>
                                  </button>
                                );
                              },
                            )}
                          </div>
                        </div>

                        {/* รายละเอียดการติดตาม (เมื่อไม่พบปัญหา) */}
                        {!isProblem && (
                          <div className="space-y-1.5 animate-in fade-in-50 duration-150">
                            <label className="text-xs font-bold text-slate-800">
                              รายละเอียดการติดตาม
                            </label>
                            <Textarea
                              rows={2}
                              value={prod.followupDetail || ""}
                              onChange={(e) => {
                                if (updateProductInItem) {
                                  updateProductInItem(
                                    item.id,
                                    prod.id,
                                    "followupDetail",
                                    e.target.value,
                                  );
                                }
                              }}
                              disabled={readonly}
                              placeholder={`ระบุข้อแนะนำ หรือรายละเอียดการติดตามสำหรับ ${prod.productName || "สินค้านี้"}`}
                              className="bg-white border-slate-300 text-xs rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                            />
                          </div>
                        )}

                        {/* ระบุรายละเอียดปัญหาที่พบ (เมื่อพบปัญหา) */}
                        {isProblem && (
                          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 space-y-2 animate-in fade-in-50 duration-150">
                            <label className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>
                                ระบุรายละเอียดปัญหาที่พบสำหรับ{" "}
                                {prod.productName || "สินค้านี้"}
                              </span>
                              <span className="text-rose-500">*</span>
                            </label>
                            <Textarea
                              rows={2}
                              value={prod.problemDetail || ""}
                              onChange={(e) => {
                                if (updateProductInItem) {
                                  updateProductInItem(
                                    item.id,
                                    prod.id,
                                    "problemDetail",
                                    e.target.value,
                                  );
                                }
                              }}
                              disabled={readonly}
                              placeholder="เช่น ยอดไหม้ ใบเหลือง หรือไม่มีการตอบสนอง..."
                              className="bg-white border-rose-200 text-xs rounded-lg focus:border-rose-400 focus:ring-rose-400"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Photo upload & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200/80 pt-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-slate-500" />
                    <span>รูปภาพสภาพพืช / แปลง</span>
                  </label>
                  <ActivityPhotoUpload
                    images={item.images || []}
                    onImagesChange={(newImgs) =>
                      updateItem(item.id, "images", newImgs)
                    }
                    readonly={readonly}
                    maxFiles={5}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                    หมายเหตุเพิ่มเติม
                  </label>
                  <Textarea
                    placeholder="บันทึกข้อมูลเพิ่มเติมเกี่ยวกับเป้าหมาย..."
                    value={item.notes || ""}
                    onChange={(e) =>
                      updateItem(item.id, "notes", e.target.value)
                    }
                    disabled={readonly}
                    rows={3}
                    className="text-xs bg-white"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
