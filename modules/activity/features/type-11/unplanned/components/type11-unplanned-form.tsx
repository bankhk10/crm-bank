"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Store, Package, Camera } from "lucide-react";
import {
  ActivityCustomerSelect,
  ActivityProductSelect,
  ActivityInput,
  ActivityCombobox,
  ActivityPhotoUpload,
} from "@/modules/activity/ui";
import { listProductsAction } from "@/modules/products/server/actions";
import {
  STOCK_STATUS_OPTIONS,
  REORDER_OPPORTUNITY_OPTIONS,
} from "../../shared/constants";
import type { Type11ProductOption } from "../../shared/types";
import type { Type11UnplannedFormProps } from "../types/unplanned.types";

export type { Type11UnplannedFormProps };

export function Type11UnplannedForm({
  readonly = false,
  items = [],
  customers = [],
  products = [],
  addItem,
  updateItem,
  deleteItem,
  addStockItem,
  updateStockItem,
  deleteStockItem,
}: Type11UnplannedFormProps) {
  const [dbProducts, setDbProducts] = useState<
    Array<{ id: string; name: string; productCode?: string | null }>
  >([]);

  // Fetch active products from DB if not provided
  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        const res = await listProductsAction({
          status: "ACTIVE",
          perPage: 1000,
        });
        if (isMounted && res?.products && res.products.length > 0) {
          setDbProducts(res.products);
        }
      } catch (err) {
        console.error("Failed to load products in Type11UnplannedForm:", err);
      }
    }
    if (!products || products.length === 0) {
      loadProducts();
    }
    return () => {
      isMounted = false;
    };
  }, [products]);

  const effectiveProducts: Type11ProductOption[] =
    products && products.length > 0
      ? products
      : dbProducts.map((p) => ({
          id: p.id,
          name: p.name,
          productCode: p.productCode || undefined,
        }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-teal-600" />
            <span>ตรวจเช็คสต๊อกหน้าร้าน (Unplanned)</span>
          </h4>
          <p className="text-xs text-slate-500">
            บันทึกการเข้าตรวจเช็กสต็อกสินค้าคงเหลือหน้าร้านและโอกาสการสั่งซื้อ
          </p>
        </div>

        {!readonly && addItem && (
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มร้านค้าตรวจสต็อก</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {items.map((item, index) => {
          return (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px]">
                    {index + 1}
                  </span>
                  <span>{item.storeName || `ร้านค้าที่ ${index + 1}`}</span>
                </span>

                {!readonly && deleteItem && items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Store Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  เลือกร้านค้า <span className="text-red-500">*</span>
                </label>
                <ActivityCustomerSelect
                  id={`unplanned-store-${item.id}`}
                  type="STORE"
                  value={item.storeId || ""}
                  valueKey="id"
                  onChange={(selectedId, foundCustomer) => {
                    const cName =
                      foundCustomer?.name ||
                      customers?.find((c) => c.id === selectedId)?.name ||
                      "";
                    updateItem(item.id, "storeId", selectedId);
                    updateItem(item.id, "storeName", cName);
                  }}
                  customers={customers as any}
                  placeholder="ค้นหาและเลือกร้านค้า..."
                  disabled={readonly}
                  triggerClassName="h-10 text-xs bg-white"
                />
              </div>

              {/* Stock Items Sub-section */}
              <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-teal-600" />
                    <span>รายการสินค้าตรวจเช็ก ({item.stockItems?.length || 0})</span>
                  </span>

                  {!readonly && addStockItem && (
                    <div className="w-full sm:w-64">
                      <ActivityProductSelect
                        products={effectiveProducts as any}
                        value=""
                        onChange={(selectedProdId) => {
                          if (selectedProdId) {
                            addStockItem(item.id, selectedProdId);
                          }
                        }}
                        placeholder="+ เพิ่มสินค้าตรวจเช็ก..."
                        id={`unplanned-add-prod-${item.id}`}
                      />
                    </div>
                  )}
                </div>

                {(!item.stockItems || item.stockItems.length === 0) ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    ยังไม่มีรายการสินค้าตรวจเช็กสำหรับร้านนี้
                  </div>
                ) : (
                  <div className="space-y-3">
                    {item.stockItems.map((si) => (
                      <div
                        key={si.id}
                        className="bg-white border border-slate-200 rounded-xl p-3 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                            {si.productName}
                          </span>
                          {!readonly && deleteStockItem && si.id && (
                            <button
                              type="button"
                              onClick={() => deleteStockItem(item.id, si.id!)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[11px] font-medium text-slate-600 block mb-1">
                              จำนวนคงเหลือ <span className="text-red-500">*</span>
                            </label>
                            <ActivityInput
                              type="text"
                              value={String(si.remainingQty ?? "")}
                              onChange={(e) =>
                                updateStockItem &&
                                si.id &&
                                updateStockItem(
                                  item.id,
                                  si.id,
                                  "remainingQty",
                                  e.target.value,
                                )
                              }
                              placeholder="เช่น 15 กล่อง"
                              disabled={readonly}
                              className="h-9 text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-medium text-slate-600 block mb-1">
                              สถานะสต็อก
                            </label>
                            <ActivityCombobox
                              value={si.stockStatus || "ปกติ"}
                              onChange={(val) =>
                                updateStockItem &&
                                si.id &&
                                updateStockItem(
                                  item.id,
                                  si.id,
                                  "stockStatus",
                                  val,
                                )
                              }
                              options={STOCK_STATUS_OPTIONS as any}
                              disabled={readonly}
                              placeholder="เลือกสถานะสต็อก"
                              triggerClassName="h-9 text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-medium text-slate-600 block mb-1">
                              โอกาสสั่งซื้อซ้ำ <span className="text-red-500">*</span>
                            </label>
                            <ActivityCombobox
                              value={si.reorderOpportunity || ""}
                              onChange={(val) =>
                                updateStockItem &&
                                si.id &&
                                updateStockItem(
                                  item.id,
                                  si.id,
                                  "reorderOpportunity",
                                  val,
                                )
                              }
                              options={REORDER_OPPORTUNITY_OPTIONS as any}
                              disabled={readonly}
                              placeholder="เลือกโอกาสสั่งซื้อ"
                              triggerClassName="h-9 text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-slate-600 block mb-1">
                            ข้อสังเกต / หมายเหตุ
                          </label>
                          <ActivityInput
                            type="text"
                            value={si.remarks || ""}
                            onChange={(e) =>
                              updateStockItem &&
                              si.id &&
                              updateStockItem(
                                item.id,
                                si.id,
                                "remarks",
                                e.target.value,
                              )
                            }
                            placeholder="เช่น ตำแหน่งวางสินค้า, ความต้องการของลูกค้า"
                            disabled={readonly}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Next action & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    สิ่งที่ต้องดำเนินการต่อ
                  </label>
                  <ActivityInput
                    type="text"
                    value={item.nextAction || ""}
                    onChange={(e) =>
                      updateItem(item.id, "nextAction", e.target.value)
                    }
                    placeholder="เช่น ส่งใบเสนอราคา, โทรติดตามยอดสัปดาห์หน้า"
                    disabled={readonly}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    หมายเหตุเพิ่มเติมของร้านนี้
                  </label>
                  <ActivityInput
                    type="text"
                    value={item.remarks || ""}
                    onChange={(e) =>
                      updateItem(item.id, "remarks", e.target.value)
                    }
                    placeholder="บันทึกข้อความทั่วไป"
                    disabled={readonly}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-semibold text-slate-800">
                    รูปภาพการตรวจสต็อกหน้าร้าน ({item.images?.length || 0} รูป)
                  </span>
                </div>
                <ActivityPhotoUpload
                  images={item.images as any}
                  onImagesChange={(newPhotos: any) =>
                    updateItem(item.id, "images", newPhotos)
                  }
                  maxFiles={10}
                  readonly={readonly}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
