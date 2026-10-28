"use client";

import React from "react";
import { Package, Plus, Trash2, Store, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityCustomerSelect,
  ActivityAddressSelect,
  ActivityInput,
  ActivitySelect,
  ActivityPhotoUpload,
  ActivityProductSelect,
} from "@/modules/activity/ui";
import type {
  Type13UnplannedFormProps,
  Type13UnplannedItem,
} from "../types/unplanned.types";
import type { Type13SprayingProduct } from "../../shared/types";

export function Type13UnplannedForm({
  item,
  onChange,
  items,
  onItemsChange,
  addItem,
  deleteItem,
  updateItem,
  dealers = [],
  products = [],
  readonly = false,
  className = "",
}: Type13UnplannedFormProps) {
  // Determine effective items list (supports both multi-village and single-item props)
  const effectiveItems: Type13UnplannedItem[] =
    items && items.length > 0
      ? items
      : item
        ? [item]
        : [
            {
              id: `unplanned-plot-${Date.now()}-1`,
              name: "แปลงที่ 1",
              plotName: "แปลงที่ 1",
              storeId: "",
              dealerName: "",
              province: "",
              district: "",
              subdistrict: "",
              village: "",
              actualPlotsCount: 1,
              objective: "",
              notes: "",
              products: [],
              images: [],
              afterSprayImages: [],
            },
          ];

  // Handler: Update village item
  const handleUpdateItem = (idx: number, updatedItem: Type13UnplannedItem) => {
    if (readonly) return;
    if (updateItem) {
      updateItem(idx, updatedItem);
    } else if (onItemsChange) {
      const next = [...effectiveItems];
      next[idx] = updatedItem;
      onItemsChange(next);
    } else if (onChange && idx === 0) {
      onChange(updatedItem);
    }
  };

  // Handler: Add village item (max 10)
  const handleAddItem = () => {
    if (readonly || effectiveItems.length >= 10) return;
    if (addItem) {
      addItem();
    } else if (onItemsChange) {
      const nextPlotNum = effectiveItems.length + 1;
      const first = effectiveItems[0];
      const newItem: Type13UnplannedItem = {
        id: `unplanned-plot-${Date.now()}-${nextPlotNum}`,
        name: `แปลงที่ ${nextPlotNum}`,
        plotName: `แปลงที่ ${nextPlotNum}`,
        storeId: first?.storeId || "",
        dealerName: first?.dealerName || "",
        province: first?.province || "",
        district: first?.district || "",
        subdistrict: "",
        village: "",
        actualPlotsCount: 1,
        objective: "",
        notes: "",
        products: [],
        images: [],
        afterSprayImages: [],
      };
      onItemsChange([...effectiveItems, newItem]);
    }
  };

  // Handler: Delete village item (min 1)
  const handleDeleteItem = (idx: number) => {
    if (readonly || effectiveItems.length <= 1) return;
    if (deleteItem) {
      deleteItem(idx);
    } else if (onItemsChange) {
      onItemsChange(effectiveItems.filter((_, i) => i !== idx));
    }
  };

  // Handler: Add product to a specific village
  const handleAddProduct = (itemIdx: number) => {
    if (readonly) return;
    const cur = effectiveItems[itemIdx];
    if (!cur) return;
    const newProduct: Type13SprayingProduct = {
      productId: "",
      productName: "",
      actualRate: "",
      quantityUsed: 1,
      actualQuantity: 1,
      extraQuantity: "",
      extraUnit: "ซีซี",
      unit: "ขวด",
    };
    handleUpdateItem(itemIdx, {
      ...cur,
      products: [...(cur.products || []), newProduct],
    });
  };

  // Handler: Remove product from a specific village
  const handleRemoveProduct = (itemIdx: number, pIdx: number) => {
    if (readonly) return;
    const cur = effectiveItems[itemIdx];
    if (!cur) return;
    handleUpdateItem(itemIdx, {
      ...cur,
      products: (cur.products || []).filter((_, i) => i !== pIdx),
    });
  };

  // ATOMIC product update (fixes: "ช่อง สินค้ากดเลือกแล้ว สินค้าไม่นำมาแสดงในช่อง")
  const handleUpdateProductRow = (
    itemIdx: number,
    pIdx: number,
    updates: Partial<Type13SprayingProduct>,
  ) => {
    if (readonly) return;
    const cur = effectiveItems[itemIdx];
    if (!cur) return;
    const prods = [...(cur.products || [])];
    if (prods[pIdx]) {
      prods[pIdx] = {
        ...prods[pIdx],
        ...updates,
      };
      if (updates.actualQuantity !== undefined) {
        prods[pIdx].quantityUsed = updates.actualQuantity;
      }
      handleUpdateItem(itemIdx, { ...cur, products: prods });
    }
  };

  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 space-y-6 shadow-2xs ${className}`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 font-bold text-sm shrink-0">
            13
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <span>กิจกรรมนอกแผน: ฉีดแปลงแฮตแทค (TYPE_13)</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                ทั้งหมด {effectiveItems.length} / 10 หมู่บ้าน
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              ระบุข้อมูลตัวแทนจำหน่าย ที่อยู่แปลง จำนวนแปลงที่ฉีดพ่นจริง สินค้าที่ใช้
              และรูปภาพหลักฐาน (รองรับสูงสุด 10 หมู่บ้าน)
            </p>
          </div>
        </div>

        {/* Add Village Button (Up to 10) */}
        {!readonly && effectiveItems.length < 10 && (
          <Button
            type="button"
            onClick={handleAddItem}
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl px-3 shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>เพิ่มหมู่บ้าน ({effectiveItems.length}/10)</span>
          </Button>
        )}
      </div>

      {/* Villages List (1 to 10) */}
      <div className="space-y-6">
        {effectiveItems.map((villageItem, itemIdx) => {
          const villageTitle = villageItem.village?.trim()
            ? `บ้าน${villageItem.village.trim()}`
            : villageItem.name || `หมู่บ้าน / แปลงที่ ${itemIdx + 1}`;

          return (
            <div
              key={villageItem.id || itemIdx}
              className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-5 shadow-2xs"
            >
              {/* Village Header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                    {itemIdx + 1}
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {villageTitle}
                  </span>
                  {villageItem.dealerName && (
                    <span className="text-xs text-slate-500 font-normal hidden sm:inline">
                      ({villageItem.dealerName})
                    </span>
                  )}
                </div>

                {!readonly && effectiveItems.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(itemIdx)}
                    className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg px-2 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบหมู่บ้านนี้</span>
                  </Button>
                )}
              </div>

              {/* 1. ข้อมูลตัวแทนจำหน่ายและพื้นที่แปลง */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <h5 className="font-bold text-xs sm:text-sm text-slate-800">
                    1. ข้อมูลตัวแทนจำหน่ายและพื้นที่แปลง
                  </h5>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-start">
                  {/* Dealer Select */}
                  <div>
                    <ActivityCustomerSelect
                      id={`type13-unplanned-dealer-${itemIdx}`}
                      type="STORE"
                      label="ร้านค้า Dealer"
                      value={villageItem.storeId || ""}
                      onChange={(val, cust) => {
                        handleUpdateItem(itemIdx, {
                          ...villageItem,
                          storeId: val,
                          dealerName: cust?.name || "",
                          province: cust?.province || villageItem.province,
                          district: cust?.district || villageItem.district,
                          subdistrict:
                            cust?.subdistrict || villageItem.subdistrict,
                        });
                      }}
                      customers={dealers as any}
                      placeholder="เลือกร้านค้า Dealer..."
                      searchPlaceholder="ค้นหาร้านค้า..."
                      emptyText="ไม่พบร้านค้า"
                      disabled={readonly}
                      required
                    />
                  </div>

                  {/* Address Select */}
                  <div className="md:col-span-2">
                    <ActivityAddressSelect
                      id={`type13-unplanned-address-${itemIdx}`}
                      levels="province-district-subdistrict"
                      provinceLabel="จังหวัด"
                      districtLabel="อำเภอ"
                      subdistrictLabel="ตำบล"
                      value={{
                        province: villageItem.province || "",
                        district: villageItem.district || "",
                        subdistrict: villageItem.subdistrict || "",
                      }}
                      onChange={(val) => {
                        handleUpdateItem(itemIdx, {
                          ...villageItem,
                          province: val.province || "",
                          district: val.district || "",
                          subdistrict: val.subdistrict || "",
                        });
                      }}
                      disabled={readonly}
                      required
                    />
                  </div>
                </div>

                {/* Village & Actual Plots Count Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 border-t border-slate-200/60">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      หมู่บ้าน
                    </label>
                    <ActivityInput
                      type="text"
                      placeholder="ระบุหมู่บ้าน เช่น บ้านหนองหว้า..."
                      value={
                        villageItem.village || villageItem.villageName || ""
                      }
                      onChange={(e) =>
                        handleUpdateItem(itemIdx, {
                          ...villageItem,
                          village: e.target.value,
                          villageName: e.target.value,
                        })
                      }
                      disabled={readonly}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      จำนวนแปลงที่ฉีดพ่นจริง (แปลง){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      type="number"
                      min={1}
                      placeholder="เช่น 3"
                      value={
                        villageItem.actualPlotsCount !== undefined &&
                        villageItem.actualPlotsCount !== null
                          ? String(villageItem.actualPlotsCount)
                          : ""
                      }
                      onChange={(e) =>
                        handleUpdateItem(itemIdx, {
                          ...villageItem,
                          actualPlotsCount: e.target.value
                            ? Number(e.target.value)
                            : "",
                        })
                      }
                      disabled={readonly}
                      required
                    />
                  </div>
                </div>

                {/* วัตถุประสงค์ */}
                <div className="space-y-1 pt-1 border-t border-slate-200/60">
                  <label className="block text-xs font-semibold text-slate-700">
                    วัตถุประสงค์
                  </label>
                  <ActivityInput
                    type="text"
                    placeholder="ระบุวัตถุประสงค์ เช่น เพื่อทดสอบประสิทธิภาพสาร..."
                    value={villageItem.objective || ""}
                    onChange={(e) =>
                      handleUpdateItem(itemIdx, {
                        ...villageItem,
                        objective: e.target.value,
                      })
                    }
                    disabled={readonly}
                  />
                </div>
              </div>

              {/* 2. สินค้าสาธิต (Demo Products) */}
              <div className="space-y-3.5 pt-4 border-t border-slate-200/80">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <h5 className="font-bold text-xs sm:text-sm text-slate-800">
                      2. สินค้าสาธิต (Demo Products)
                    </h5>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      {villageItem.products?.length || 0} รายการ
                    </span>
                  </div>

                  {!readonly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddProduct(itemIdx)}
                      className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-2.5 rounded-xl shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      <span>เพิ่มสินค้า</span>
                    </Button>
                  )}
                </div>

                {!villageItem.products || villageItem.products.length === 0 ? (
                  <div className="bg-white rounded-xl border border-dashed border-slate-200 p-4 text-center">
                    <p className="text-xs text-slate-500">
                      ยังไม่มีรายการสินค้าที่ใช้ สามารถกดปุ่ม{" "}
                      <span className="font-semibold text-emerald-700">
                        เพิ่มสินค้า
                      </span>{" "}
                      เพื่อระบุสารเคมีหรือสินค้าที่ฉีดพ่น
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {villageItem.products.map((prod, pIdx) => (
                      <div
                        key={pIdx}
                        className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 space-y-3 shadow-2xs"
                      >
                        {/* Header with Product Name / Index and Delete Button */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">
                            รายการที่ {pIdx + 1}
                            {prod.productName ? `: ${prod.productName}` : ""}
                          </span>
                          {!readonly && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProduct(itemIdx, pIdx)}
                              className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบรายการนี้</span>
                            </Button>
                          )}
                        </div>

                        {/* Product Selection with Atomic Handler */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">
                            สินค้า <span className="text-rose-500">*</span>
                          </label>
                          <ActivityProductSelect
                            id={`type13-unplanned-prod-${itemIdx}-${pIdx}`}
                            value={prod.productId || ""}
                            valueKey="id"
                            onChange={(val, selectedProd) => {
                              handleUpdateProductRow(itemIdx, pIdx, {
                                productId: val,
                                productName:
                                  selectedProd?.name || prod.productName || "",
                                unit:
                                  selectedProd?.unit || prod.unit || "ขวด",
                              });
                            }}
                            products={products as any}
                            placeholder="เลือกผลิตภัณฑ์แฮตแทค..."
                            searchPlaceholder="ค้นหาชื่อ หรือรหัสสินค้า..."
                            emptyText="ไม่พบสินค้า"
                            disabled={readonly}
                          />
                        </div>

                        {/* 3 Detail Columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          {/* 1. จำนวนที่ใช้จริง */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              จำนวนที่ใช้จริง ({prod.unit || "ขวด"}){" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <ActivityInput
                              type="number"
                              min="0"
                              value={
                                prod.actualQuantity != null
                                  ? String(prod.actualQuantity)
                                  : prod.quantityUsed != null
                                    ? String(prod.quantityUsed)
                                    : ""
                              }
                              onChange={(e) =>
                                handleUpdateProductRow(itemIdx, pIdx, {
                                  actualQuantity: e.target.value
                                    ? Number(e.target.value)
                                    : "",
                                })
                              }
                              disabled={readonly}
                              placeholder="เช่น 1"
                              required
                            />
                          </div>

                          {/* 2. ปริมาณที่ใช้เพิ่ม */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              ปริมาณที่ใช้เพิ่ม (กรณีใช้ไปครึ่งขวด)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <ActivityInput
                                type="number"
                                min="0"
                                value={
                                  prod.extraQuantity != null
                                    ? String(prod.extraQuantity)
                                    : ""
                                }
                                onChange={(e) =>
                                  handleUpdateProductRow(itemIdx, pIdx, {
                                    extraQuantity: e.target.value,
                                  })
                                }
                                disabled={readonly}
                                placeholder="เช่น 250"
                              />
                              <ActivitySelect
                                value={prod.extraUnit || "ซีซี"}
                                onChange={(val) =>
                                  handleUpdateProductRow(itemIdx, pIdx, {
                                    extraUnit: val,
                                  })
                                }
                                options={[
                                  { value: "ซีซี", label: "ซีซี (ขวด)" },
                                  { value: "กรัม", label: "กรัม (ซอง)" },
                                  { value: "มล.", label: "มล." },
                                  { value: "ลิตร", label: "ลิตร" },
                                ]}
                                disabled={readonly}
                              />
                            </div>
                          </div>

                          {/* 3. อัตราการใช้ */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              อัตราการใช้ <span className="text-rose-500">*</span>
                            </label>
                            <ActivityInput
                              value={prod.actualRate || ""}
                              onChange={(e) =>
                                handleUpdateProductRow(itemIdx, pIdx, {
                                  actualRate: e.target.value,
                                })
                              }
                              disabled={readonly}
                              placeholder="เช่น 20 ซีซี / น้ำ 20 ลิตร"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. รูปหลังฉีดพ่น (ต่อหมู่บ้าน สูงสุด 20 ภาพ) */}
              <div className="pt-4 border-t border-slate-200/80">
                <ActivityPhotoUpload
                  title="3. รูปหลังฉีดพ่น (ต่อหมู่บ้าน)"
                  description="รองรับไฟล์รูปภาพ PNG, JPG หรือ WEBP (สูงสุด 20 รูปต่อหมู่บ้าน)"
                  images={
                    ((villageItem.images ||
                      villageItem.afterSprayImages) as any) || []
                  }
                  onImagesChange={(imgs) => {
                    handleUpdateItem(itemIdx, {
                      ...villageItem,
                      images: imgs as any,
                      afterSprayImages: imgs as any,
                    });
                  }}
                  maxFiles={20}
                  accentColor="emerald"
                  disabled={readonly}
                />
              </div>

              {/* 4. Additional Notes */}
              <div className="space-y-1 pt-3 border-t border-slate-200/80">
                <label className="block text-xs font-semibold text-slate-700">
                  4. บันทึกเพิ่มเติม (Notes)
                </label>
                <ActivityInput
                  placeholder="ระบุหมายเหตุหรือข้อสังเกตเพิ่มเติม (ถ้ามี)..."
                  value={villageItem.notes || ""}
                  onChange={(e) =>
                    handleUpdateItem(itemIdx, {
                      ...villageItem,
                      notes: e.target.value,
                    })
                  }
                  disabled={readonly}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
