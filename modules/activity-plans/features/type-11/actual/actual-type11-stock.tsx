"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Trash2, Package, Store, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FormCombobox } from "@/components/custom/form-components";
import GalleryUpload from "@/components/custom/gallery-upload";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import {
  convertToFileMetadata,
  filesWithPreviewToImageFiles,
  isImageFilesEqual,
} from "@/modules/activity-plans/features/shared/actual-view/utils";
import type { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";
import { cn } from "@/lib/utils";
import { ActualTargetCard } from "@/modules/activity-plans/features/shared/actual-view/components/actual-target-card";
import { DEMO_PRODUCTS } from "@/modules/activity-plans/constants";
import { listProductsAction } from "@/modules/products/server/actions";

export interface StockCheckItem {
  id?: string;
  storeId?: string | null;
  storeName: string;
  productId?: string;
  productName: string;
  productCode?: string;
  remainingQty: string;
  reorderOpportunity?: "สูง" | "ยังไม่แน่ใจ" | "ต่ำ" | "";
  remarks: string;
  isCustom?: boolean;
}

interface ActualType11StockProps {
  isVisible: boolean;
  target: {
    store: string;
    detail: string;
    targetOpportunity: string;
    items?: Array<{ storeId?: string; store?: string; detail?: string }>;
  };
  products?: Array<{ id: string; name: string; productCode?: string | null } | string>;
  productList?: string;
  setProductList?: (v: string) => void;
  remainingQty?: string;
  setRemainingQty?: (v: string) => void;
  remarks?: string;
  setRemarks?: (v: string) => void;
  stockItems?: StockCheckItem[];
  setStockItems?: (items: StockCheckItem[]) => void;
  nextAction?: string;
  setNextAction?: (v: string) => void;
  images?: ImageFile[];
  setImages?: (v: ImageFile[]) => void;
}

export function ActualType11Stock({
  isVisible,
  target,
  products = [],
  productList = "",
  setProductList,
  remainingQty = "",
  setRemainingQty,
  remarks = "",
  setRemarks,
  stockItems,
  setStockItems,
  nextAction = "",
  setNextAction,
  images = [],
  setImages,
}: ActualType11StockProps) {
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
        console.error("Failed to load products in ActualType11Stock:", err);
      }
    }
    if (!products || products.length === 0) {
      loadProducts();
    }
    return () => {
      isMounted = false;
    };
  }, [products]);

  // Parse list of planned stores
  const storesList = useMemo(() => {
    if (!target.store || !target.store.trim()) return ["ร้านค้า"];
    const parsed = target.store
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return parsed.length > 0 ? parsed : [target.store.trim()];
  }, [target.store]);

  // Options for FormCombobox
  const productOptions: Array<{
    id?: string;
    value: string;
    label: string;
    subLabel?: string;
  }> = useMemo(() => {
    if (products && products.length > 0) {
      return products.map((p) => {
        if (typeof p === "string") {
          return { value: p, label: p };
        }
        return {
          id: p.id,
          value: p.name,
          label: p.name,
          subLabel: p.productCode || undefined,
        };
      });
    }
    if (dbProducts.length > 0) {
      return dbProducts.map((p) => ({
        id: p.id,
        value: p.name,
        label: p.name,
        subLabel: p.productCode || undefined,
      }));
    }
    return DEMO_PRODUCTS.map((p) => ({ value: p, label: p }));
  }, [products, dbProducts]);

  // Local state for stock items
  const [items, setItems] = useState<StockCheckItem[]>(() => {
    const primaryStore = target.store
      ? target.store.split(",")[0]?.trim() || "ร้านค้า"
      : "ร้านค้า";

    if (stockItems && stockItems.length > 0) {
      return stockItems.map((item) => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        storeName: item.storeName || primaryStore,
        remainingQty: item.remainingQty || "",
        reorderOpportunity: item.reorderOpportunity || "",
        remarks: item.remarks || "",
      }));
    }

    if (productList || remainingQty || remarks) {
      const pList = productList
        ? productList.split(",").map((s) => s.trim())
        : [];
      const qList = remainingQty
        ? remainingQty.split(",").map((s) => s.trim())
        : [];
      const rList = remarks ? remarks.split(",").map((s) => s.trim()) : [];
      const maxLen = Math.max(pList.length, qList.length, rList.length);
      const initial: StockCheckItem[] = [];
      for (let i = 0; i < maxLen; i++) {
        if (pList[i] || qList[i] || rList[i]) {
          initial.push({
            id: crypto.randomUUID(),
            storeName: primaryStore,
            productName: pList[i] || "",
            remainingQty: qList[i] || "",
            reorderOpportunity: "",
            remarks: rList[i] || "",
            isCustom: false,
          });
        }
      }
      if (initial.length > 0) return initial;
    }

    return [];
  });

  // Sync internal items back to parent props
  const updateItems = (newItems: StockCheckItem[]) => {
    setItems(newItems);
    if (setStockItems) {
      setStockItems(newItems);
    }
    if (setProductList) {
      setProductList(
        newItems
          .map((i) => i.productName)
          .filter(Boolean)
          .join(", "),
      );
    }
    if (setRemainingQty) {
      setRemainingQty(
        newItems
          .map((i) => i.remainingQty)
          .filter(Boolean)
          .join(", "),
      );
    }
    if (setRemarks) {
      setRemarks(
        newItems
          .map((i) => i.remarks)
          .filter(Boolean)
          .join(", "),
      );
    }
  };

  const handleAddProductToStore = (
    storeName: string,
    productName: string,
  ) => {
    if (!productName.trim()) return;

    // Prevent duplicate product in the same store
    const isDuplicate = items.some(
      (i) =>
        i.storeName === storeName &&
        i.productName.toLowerCase() === productName.trim().toLowerCase(),
    );
    if (isDuplicate) return;

    const matchedOpt = productOptions.find(
      (p) => p.value === productName || p.label === productName,
    );

    const matchedStore = (target.items || []).find(
      (s) => s.store?.trim() === storeName.trim(),
    );

    const newItem: StockCheckItem = {
      id: crypto.randomUUID(),
      storeId: matchedStore?.storeId || undefined,
      storeName,
      productId: matchedOpt?.id || undefined,
      productName: matchedOpt ? matchedOpt.label : productName.trim(),
      productCode: matchedOpt?.subLabel || undefined,
      remainingQty: "",
      reorderOpportunity: "",
      remarks: "",
      isCustom: false,
    };

    const newItems = [...items, newItem];
    updateItems(newItems);
  };

  const handleRemoveItem = (id: string) => {
    const newItems = items.filter((item) => item.id !== id);
    updateItems(newItems);
  };

  const handleItemChange = (
    id: string,
    field: "remainingQty" | "remarks" | "productName" | "reorderOpportunity",
    value: string,
  ) => {
    const newItems = items.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    updateItems(newItems);
  };

  const handleFilesChange = (files: FileWithPreview[]) => {
    const converted = filesWithPreviewToImageFiles(files);
    if (!isImageFilesEqual(images, converted) && setImages) {
      setImages(converted);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="border border-slate-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
            <Package className="h-4 w-4 text-slate-700" />
          </div>
          <h2 className="font-bold text-slate-900 text-base md:text-lg">
            ตรวจเช็กสต็อกหน้าร้าน
          </h2>
        </div>
      </div>

      {/* PLANNED TARGET CARD */}
      <ActualTargetCard
        iconColorClass="text-slate-600"
        badgeColorClass="bg-slate-200 text-slate-800"
        gridColsClass="grid-cols-1"
        items={[
          { label: "ร้านค้าที่ตรวจเช็กสต็อก:", value: target.store || "-" },
        ]}
      />

      {/* PER-STORE STOCK CHECK SECTIONS */}
      <div className="space-y-5 pt-1">
        {storesList.map((storeName, storeIdx) => {
          const storeItems = items.filter((i) => i.storeName === storeName);
          const availableOptionsForStore = productOptions.filter(
            (opt) => !storeItems.some((i) => i.productName === opt.value),
          );

          return (
            <div
              key={`${storeName}-${storeIdx}`}
              className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 md:p-5 space-y-4 shadow-2xs transition-all hover:border-slate-300"
            >
              {/* Store Header */}
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-white font-bold text-xs shadow-xs">
                    <Store className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>{storeName}</span>
                      <Badge
                        variant="outline"
                        className="text-[11px] font-semibold bg-white text-slate-700 border-slate-200"
                      >
                        {storeItems.length} รายการ
                      </Badge>
                    </h3>
                  </div>
                </div>
              </div>

              {/* Searchable Product Combobox for THIS store */}
              <div className="space-y-1.5">
                <FormCombobox
                  id={`combobox-store-${storeIdx}`}
                  label="ค้นหาและเลือกสินค้าที่ต้องการตรวจเช็กสต็อก"
                  labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                  triggerClassName="h-10 min-h-[40px] py-1 text-xs bg-white border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-slate-500 shadow-2xs"
                  value=""
                  onChange={(val) => {
                    if (val) {
                      handleAddProductToStore(storeName, val);
                    }
                  }}
                  options={availableOptionsForStore}
                  placeholder="+ ค้นหาด้วยชื่อสินค้า หรือรหัสสินค้า (เช่น 91CHR)..."
                  searchPlaceholder="ค้นหาด้วยรหัสสินค้า หรือชื่อสินค้า..."
                  emptyText="ไม่พบสินค้า"
                />
              </div>

              {/* Items List for THIS store */}
              {storeItems.length === 0 ? (
                <div className="py-6 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 text-xs">
                  ยังไม่มีรายการสินค้าที่ตรวจเช็กสำหรับร้านนี้ (ค้นหาและเลือกสินค้าจากช่องด้านบน)
                </div>
              ) : (
                <div className="space-y-3">
                  {storeItems.map((item, itemIdx) => (
                    <div
                      key={item.id || `${item.productName}-${itemIdx}`}
                      className="p-3.5 md:p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs relative group transition-all hover:border-slate-300"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                            {itemIdx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {item.productName}
                          </span>
                          {item.productCode && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0"
                            >
                              {item.productCode}
                            </Badge>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id!)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="ลบรายการนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Remaining Qty */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            จำนวนคงเหลือ <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Input
                              value={item.remainingQty}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id!,
                                  "remainingQty",
                                  e.target.value,
                                )
                              }
                              placeholder="ระบุจำนวนคงเหลือ"
                              className="bg-white border-slate-300 text-xs h-9 pr-12"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                              ลัง
                            </span>
                          </div>
                        </div>

                        {/* Reorder Opportunity (Per Item) */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            โอกาสการสั่งซื้อรอบใหม่ <span className="text-rose-500">*</span>
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(["สูง", "ยังไม่แน่ใจ", "ต่ำ"] as const).map((opp) => (
                              <button
                                key={opp}
                                type="button"
                                onClick={() =>
                                  handleItemChange(
                                    item.id!,
                                    "reorderOpportunity",
                                    opp,
                                  )
                                }
                                className={cn(
                                  "py-1.5 px-1 rounded-lg border text-xs font-semibold cursor-pointer transition-all",
                                  item.reorderOpportunity === opp
                                    ? opp === "สูง"
                                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                                      : opp === "ยังไม่แน่ใจ"
                                        ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                                        : "bg-slate-100 border-slate-400 text-slate-800 font-bold"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
                                )}
                              >
                                {opp}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Remarks (Optional) */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-xs font-semibold text-slate-700">
                          ข้อสังเกต / หมายเหตุ
                        </label>
                        <Input
                          value={item.remarks}
                          onChange={(e) =>
                            handleItemChange(
                              item.id!,
                              "remarks",
                              e.target.value,
                            )
                          }
                          placeholder="ระบุข้อสังเกตหรือข้อมูลเพิ่มเติม (ถ้ามี)"
                          className="bg-white border-slate-300 text-xs h-9"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Things to do next (Optional) */}
      <div className="space-y-1.5 pt-1">
        <label className="text-sm font-semibold text-slate-800">
          สิ่งที่ต้องดำเนินการต่อ
        </label>
        <Textarea
          rows={2}
          value={nextAction}
          onChange={(e) => setNextAction && setNextAction(e.target.value)}
          placeholder="เช่น ออกใบเสนอราคาสินค้าเพิ่มสต็อก หรือประสานงานฝ่ายจัดส่ง (ถ้ามี)"
          className="bg-white border-slate-300"
        />
      </div>

      {/* GalleryUpload for Stock Check Photos */}
      <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
            <Camera className="w-4 h-4 text-slate-700" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              รูปภาพการตรวจเช็กสต็อกหน้าร้าน
            </h4>
            <p className="text-[11px] text-slate-500">
              อัปโหลดรูปภาพการตรวจเช็กสต็อกสินค้าคงเหลือหน้าร้าน (สูงสุด 5 รูป)
            </p>
          </div>
        </div>
        <GalleryUpload
          maxFiles={5}
          maxSize={20 * 1024 * 1024}
          accept="image/*"
          multiple={true}
          initialFiles={convertToFileMetadata(images || [])}
          onFilesChange={handleFilesChange}
        />
      </div>
    </div>
  );
}
