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

              {/* 3. Products Tracked & Actual Feedback */}
              <div className="border-t border-slate-200/80 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>สินค้าและผลการตอบสนอง</span>
                  </div>
                  {!readonly && addProductToItem && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addProductToItem(item.id)}
                      className="text-xs text-emerald-700 hover:bg-emerald-50 h-7 px-2 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      เพิ่มสินค้า
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {item.products.map((prod, pIdx) => (
                    <div
                      key={prod.id}
                      className="bg-white border border-slate-200 rounded-md p-3 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                          สินค้าชิ้นที่ {pIdx + 1}
                        </span>
                        {!readonly &&
                          deleteProductFromItem &&
                          item.products.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                deleteProductFromItem(item.id, prod.id)
                              }
                              className="text-slate-400 hover:text-rose-600 text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              ลบ
                            </button>
                          )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-600 mb-1 block">
                            ชื่อสินค้า <span className="text-rose-500">*</span>
                          </label>
                          <FormCombobox
                            value={prod.productName || ""}
                            options={productComboboxOptions}
                            placeholder="เลือกสินค้า..."
                            searchPlaceholder="ค้นหาชื่อสินค้า..."
                            emptyText="ไม่พบสินค้า"
                            disabled={readonly}
                            onChange={(val) => {
                              if (updateProductInItem) {
                                const matched = products.find(
                                  (p) => p.name === val,
                                );
                                updateProductInItem(
                                  item.id,
                                  prod.id,
                                  "productName",
                                  val,
                                );
                                updateProductInItem(
                                  item.id,
                                  prod.id,
                                  "productId",
                                  matched?.id || "",
                                );
                              }
                            }}
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-600 mb-1 block">
                            ผลการตอบสนองของพืช / ความพึงพอใจ
                          </label>
                          <select
                            disabled={readonly}
                            value={prod.usageResult || ""}
                            onChange={(e) => {
                              if (updateProductInItem) {
                                updateProductInItem(
                                  item.id,
                                  prod.id,
                                  "usageResult",
                                  e.target.value,
                                );
                              }
                            }}
                            className="w-full text-sm border border-slate-300 rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="">-- เลือกผลการใช้สินค้า --</option>
                            {USAGE_RESULTS.map((res) => (
                              <option key={res} value={res}>
                                {res}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Problem detail warning if "พบปัญหา" */}
                      {prod.usageResult === "พบปัญหา" && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>ระบุปัญหาที่พบ *</span>
                          </div>
                          <Textarea
                            placeholder="เช่น ยอดไหม้ ใบเหลือง หรือไม่มีการตอบสนอง..."
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
                            rows={2}
                            className="text-xs bg-white"
                          />
                        </div>
                      )}

                      <div>
                        <input
                          type="text"
                          placeholder="รายละเอียดการติดตาม / คำแนะนำเพิ่มเติม..."
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
                          className="w-full text-xs border border-slate-200 rounded p-1.5 bg-slate-50 focus:bg-white"
                        />
                      </div>
                    </div>
                  ))}
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
