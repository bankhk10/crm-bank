"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Trash2, Package, Store, Camera, Plus } from "lucide-react";
import {
  ActivityPhotoUpload,
  ActivityProductSelect,
  ActivityInput,
  ActivityCombobox,
} from "@/modules/activity/ui";
import { cn } from "@/lib/utils";
import { listProductsAction } from "@/modules/products/server/actions";
import { Type11PlanCard } from "./type11-plan-card";
import {
  STOCK_STATUS_OPTIONS,
  REORDER_OPPORTUNITY_OPTIONS,
} from "../../shared/constants";
import type { Type11StockItem, Type11ProductOption } from "../../shared/types";
import type { ActualType11StockProps } from "../types/actual.types";

export type {
  ActualType11StockProps,
  ActualType11StockProps as Type11ActualFormProps,
};

export function Type11ActualForm({
  isVisible,
  planType,
  target,
  targets,
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
        console.error("Failed to load products in Type11ActualForm:", err);
      }
    }
    if (!products || products.length === 0) {
      loadProducts();
    }
    return () => {
      isMounted = false;
    };
  }, [products]);

    // Normalized product options
  const productOptions: Type11ProductOption[] = useMemo(() => {
    if (products && products.length > 0) {
      return products.map((p) => {
        if (typeof p === "string") {
          return { id: p, name: p, productCode: undefined };
        }
        return {
          id: p.id,
          name: p.name,
          productCode: p.productCode || undefined,
        };
      });
    }
    if (dbProducts.length > 0) {
      return dbProducts.map((p) => ({
        id: p.id,
        name: p.name,
        productCode: p.productCode || undefined,
      }));
    }
    return [];
  }, [products, dbProducts]);

  // Local state for stock items
  const [items, setItems] = useState<Type11StockItem[]>(() => {
    const primaryStore =
      (target as any)?.storeName ||
      (typeof target?.store === "string"
        ? target.store.split(",")[0]?.trim()
        : (target as any)?.store?.name) ||
      "ร้านค้า";

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
      const initial: Type11StockItem[] = [];
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

  // Sync internal items when stockItems prop changes from parent hydration
  useEffect(() => {
    if (stockItems && stockItems.length > 0) {
      const primaryStore =
        (target as any)?.storeName ||
        (typeof target?.store === "string"
          ? target.store.split(",")[0]?.trim()
          : (target as any)?.store?.name) ||
        "ร้านค้า";

      setItems(
        stockItems.map((item) => ({
          ...item,
          id: item.id || crypto.randomUUID(),
          storeName: item.storeName || primaryStore,
          remainingQty:
            item.remainingQty != null ? String(item.remainingQty) : "",
          reorderOpportunity: item.reorderOpportunity || "",
          remarks: item.remarks || "",
        })),
      );
    }
  }, [stockItems, target]);

  // Parse list of planned stores (including targets, target, and stock items)
  const storesList = useMemo(() => {
    const list: string[] = [];

    // 1. From targets
    if (targets && targets.length > 0) {
      targets.forEach((t: any) => {
        const name =
          t.storeName ||
          (typeof t.store === "string" ? t.store : t.store?.name) ||
          "";
        if (name && name.trim()) list.push(name.trim());
      });
    } else if (target) {
      const targetName =
        (target as any).storeName ||
        (typeof (target as any).store === "string"
          ? (target as any).store
          : (target as any).store?.name) ||
        "";
      if (targetName && targetName.trim()) {
        targetName
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
          .forEach((s: string) => list.push(s));
      }
    }

    // 2. From items (in case items belong to stores not in targets)
    if (items && items.length > 0) {
      items.forEach((i) => {
        if (i.storeName && i.storeName.trim() && !list.includes(i.storeName.trim())) {
          list.push(i.storeName.trim());
        }
      });
    }

    if (list.length === 0) return ["ร้านค้า"];
    return Array.from(new Set(list));
  }, [target, targets, items]);

  // Sync internal items back to parent props
  const updateItems = (newItems: Type11StockItem[]) => {
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
    selectedProductId: string,
  ) => {
    if (!selectedProductId.trim()) return;

    const matchedOpt = productOptions.find(
      (p) => p.id === selectedProductId || p.name === selectedProductId,
    );
    const prodName = matchedOpt?.name || selectedProductId;

    // Prevent duplicate product in the same store
    const isDuplicate = items.some(
      (i) =>
        i.storeName === storeName &&
        i.productName.toLowerCase() === prodName.trim().toLowerCase(),
    );
    if (isDuplicate) return;

    const matchedStore = (targets || target?.items || []).find(
      (s: any) =>
        (s.storeName && s.storeName.trim() === storeName.trim()) ||
        (typeof s.store === "string" && s.store.trim() === storeName.trim()) ||
        (s.store?.name && s.store.name.trim() === storeName.trim()),
    );

    const newItem: Type11StockItem = {
      id: crypto.randomUUID(),
      storeId: matchedStore?.storeId || undefined,
      storeName,
      productId: matchedOpt?.id || undefined,
      productName: prodName,
      productCode: matchedOpt?.productCode || undefined,
      remainingQty: "",
      stockStatus: "ปกติ",
      reorderOpportunity: "สูง",
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
    field: keyof Type11StockItem,
    value: any,
  ) => {
    const newItems = items.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    updateItems(newItems);
  };

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      {/* 1. Plan Overview Card */}
      {planType !== "UNPLANNED" && target && (
        <Type11PlanCard target={target} planType={planType} />
      )}

      {/* 2. Actual Record Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-6 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              บันทึกผลการตรวจเช็คสต๊อกหน้าร้าน
            </h3>
            <p className="text-xs text-slate-500">
              ระบุสินค้า จำนวนคงเหลือ และโอกาสการสั่งซื้อในแต่ละร้านค้า
            </p>
          </div>
        </div>

        {/* Per Store Stock List */}
        <div className="space-y-6">
          {storesList.map((storeName, sIdx) => {
            const storeItems = items.filter((i) => i.storeName === storeName);

            return (
              <div
                key={`${storeName}-${sIdx}`}
                className="bg-slate-50/60 rounded-xl p-4 border border-slate-200/80 space-y-4"
              >
                {/* Store Header & Add Product */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="font-bold text-slate-800 text-sm">
                      {storeName}
                    </span>
                    <span className="text-[11px] bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                      {storeItems.length} รายการ
                    </span>
                  </div>

                  <div className="w-full sm:w-125">
                    <ActivityProductSelect
                      products={productOptions as any}
                      value=""
                      onChange={(val) => {
                        if (val) handleAddProductToStore(storeName, val);
                      }}
                      placeholder="+ เพิ่มสินค้าตรวจเช็ก..."
                      id={`prod-select-${storeName}`}
                    />
                  </div>
                </div>

                {/* Items List */}
                {storeItems.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    ยังไม่มีรายการสินค้าตรวจเช็กสำหรับร้านค้านี้
                    (เลือกเพิ่มสินค้าจากเมนูด้านบน)
                  </div>
                ) : (
                  <div className="space-y-3">
                    {storeItems.map((item, itemIdx) => (
                      <div
                        key={item.id || `stock-item-${sIdx}-${itemIdx}`}
                        className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                              {item.productName}
                            </span>
                            {item.productCode && (
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                {item.productCode}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => item.id && handleRemoveItem(item.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Remaining Qty */}
                          <div>
                            <label className="text-[11px] font-medium text-slate-600 block mb-1">
                              จำนวนคงเหลือ{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <ActivityInput
                              type="number"
                              value={String(item.remainingQty ?? "")}
                              onChange={(e) =>
                                item.id &&
                                handleItemChange(
                                  item.id,
                                  "remainingQty",
                                  e.target.value,
                                )
                              }
                              placeholder="เช่น 10 กล่อง, 5 ลิตร"
                              className="h-9 text-xs"
                            />
                          </div>

                          {/*ปิดไว้ก่อนเดียวมาเปิดเอง Stock Status */}
                          {/* <div>
                            <label className="text-[11px] font-medium text-slate-600 block mb-1">
                              สถานะสต็อก
                            </label>
                            <ActivityCombobox
                              value={item.stockStatus || "ปกติ"}
                              onChange={(val) =>
                                item.id &&
                                handleItemChange(item.id, "stockStatus", val)
                              }
                              options={STOCK_STATUS_OPTIONS as any}
                              placeholder="เลือกสถานะสต็อก"
                              triggerClassName="h-9 text-xs"
                            />
                          </div> */}

                          {/* Reorder Opportunity */}
                          <div>
                            <label className="text-[11px] font-medium text-slate-600 block mb-1">
                              โอกาสสั่งซื้อซ้ำ{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <ActivityCombobox
                              value={item.reorderOpportunity || ""}
                              onChange={(val) =>
                                item.id &&
                                handleItemChange(
                                  item.id,
                                  "reorderOpportunity",
                                  val,
                                )
                              }
                              options={REORDER_OPPORTUNITY_OPTIONS as any}
                              placeholder="เลือกโอกาสสั่งซื้อ"
                              triggerClassName="h-9 text-xs"
                            />
                          </div>
                        </div>

                        {/* Remarks */}
                        <div>
                          <label className="text-[11px] font-medium text-slate-600 block mb-1">
                            ข้อสังเกต / บันทึกเพิ่มเติม
                          </label>
                          <ActivityInput
                            type="text"
                            value={item.remarks || ""}
                            onChange={(e) =>
                              item.id &&
                              handleItemChange(
                                item.id,
                                "remarks",
                                e.target.value,
                              )
                            }
                            placeholder="เช่น สินค้าใกล้หมดอายุ, ตำแหน่งวางในร้านเด่นชัด"
                            className="h-8 text-xs"
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

        {/* 3. Next Action / Follow-up Plan */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            สิ่งที่ต้องดำเนินการต่อ / แผนการติดตามสต็อก
          </label>
          <ActivityInput
            type="text"
            value={nextAction}
            onChange={(e) => setNextAction && setNextAction(e.target.value)}
            placeholder="เช่น นำเสนอโปรโมชั่นรอบใหม่สัปดาห์หน้า, ส่งเซลส์เข้าปิดการขายเพิ่ม"
            className="h-10 text-xs"
          />
        </div>

        {/* 4. Stock Photos */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-teal-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-slate-800 text-xs">
                รูปภาพการตรวจเช็คสต๊อกหน้าร้าน
              </h4>
              <p className="text-[11px] text-slate-500">
                ถ่ายภาพชั้นวางสินค้า ป้ายราคา หรือสต็อกคงเหลือในร้าน
              </p>
            </div>
          </div>

          <ActivityPhotoUpload
            images={images as any}
            onImagesChange={setImages as any}
            maxFiles={10}
          />
        </div>
      </div>
    </div>
  );
}

export { Type11ActualForm as ActualType11Stock };
