"use client";

import React, { useState, useEffect } from "react";
import { Store, Package, ShoppingBag, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ActualTargetCard } from "../actual-target-card";
import { ImageFile } from "../../types";

export interface Type9TargetProductItem {
  id?: string;
  productName: string;
  quantityCases?: number;
  pricePerCase?: number;
  totalAmount?: number;
  actualQuantityCases?: number | string;
  actualSales?: number | string;
}

export interface Type9ProductSaleDetail {
  id?: string;
  productName: string;
  actualQuantityCases?: string;
  actualSales?: string;
}

interface ActualType9StoreProps {
  isVisible: boolean;
  target: {
    store: string;
    isSubDealer?: boolean;
    subDealerStore?: string;
    product?: string;
    targetSales: string;
    targetAttendees?: string;
    items?: Type9TargetProductItem[];
  };
  formats?: string[];
  setFormats?: (v: string[]) => void;
  actualSales: string;
  setActualSales: (v: string) => void;
  productSalesDetails?: Type9ProductSaleDetail[];
  setProductSalesDetails?: (v: Type9ProductSaleDetail[]) => void;
  actualAttendees?: string;
  setActualAttendees?: (v: string) => void;
  images: ImageFile[];
  onUploadImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
}

export function ActualType9Store({
  isVisible,
  target,
  actualSales,
  setActualSales,
  productSalesDetails,
  setProductSalesDetails,
  images,
  onUploadImages,
  onRemoveImage,
}: ActualType9StoreProps) {
  const [localItems, setLocalItems] = useState<Type9TargetProductItem[]>(
    target.items || [],
  );

  useEffect(() => {
    if (target.items && target.items.length > 0) {
      setLocalItems(
        target.items.map((item, idx) => {
          const saved =
            productSalesDetails?.find(
              (d) =>
                (item.id && d.id === item.id) ||
                d.productName === item.productName,
            ) || productSalesDetails?.[idx];

          return {
            ...item,
            actualQuantityCases:
              saved?.actualQuantityCases ?? item.actualQuantityCases ?? "",
            actualSales: saved?.actualSales ?? item.actualSales ?? "",
          };
        }),
      );
    } else {
      setLocalItems([]);
    }
  }, [target.items, productSalesDetails]);

  if (!isVisible) return null;

  const hasMultipleProducts = localItems && localItems.length > 0;

  const handleItemChange = (
    index: number,
    field: "actualQuantityCases" | "actualSales",
    value: string,
  ) => {
    const updated = [...localItems];
    const currentItem = { ...updated[index], [field]: value };

    // Auto calculate actual sales if quantity is typed and price exists
    if (field === "actualQuantityCases") {
      const qtyNum = parseFloat(value) || 0;
      const priceNum = currentItem.pricePerCase
        ? Number(currentItem.pricePerCase)
        : 0;
      if (priceNum > 0 && value !== "") {
        currentItem.actualSales = String(qtyNum * priceNum);
      }
    }

    updated[index] = currentItem;
    setLocalItems(updated);

    // Sync product sales details to parent
    if (setProductSalesDetails) {
      setProductSalesDetails(
        updated.map((item) => ({
          id: item.id,
          productName: item.productName,
          actualQuantityCases:
            item.actualQuantityCases != null && item.actualQuantityCases !== ""
              ? String(item.actualQuantityCases)
              : "",
          actualSales:
            item.actualSales != null && item.actualSales !== ""
              ? String(item.actualSales)
              : "",
        })),
      );
    }

    // Sum all actual sales and sync to parent
    const totalSalesSum = updated.reduce(
      (sum, item) => sum + (parseFloat(String(item.actualSales)) || 0),
      0,
    );

    const hasAnySalesInput = updated.some(
      (i) => i.actualSales !== "" && i.actualSales != null,
    );
    setActualSales(
      totalSalesSum > 0
        ? String(totalSalesSum)
        : hasAnySalesInput
          ? "0"
          : "",
    );
  };

  const targetCardItems = [
    {
      label: target.isSubDealer ? "ร้านค้าหลัก (Dealer):" : "ร้านค้าจัดกิจกรรม:",
      value: target.store || "-",
    },
    ...(target.isSubDealer && target.subDealerStore
      ? [
          {
            label: "ชื่อร้านค้า Sub Dealer:",
            value: target.subDealerStore,
            highlight: true,
          },
        ]
      : []),
    {
      label: "เป้ายอดขายหน้าร้าน:",
      value: target.targetSales || "-",
      highlight: true,
    },
  ];

  const totalActualSalesSum = localItems.reduce(
    (sum, item) => sum + (parseFloat(String(item.actualSales)) || 0),
    0,
  );

  return (
    <div className="border-2 border-blue-600 rounded-2xl p-4 md:p-6 bg-white space-y-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-blue-100 pb-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-bold text-blue-900 text-base md:text-lg">
            จัดกิจกรรมส่งเสริมการขายหน้าร้าน
          </h2>
        </div>
        {hasMultipleProducts && (
          <span className="text-xs bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            เป้าหมาย {localItems.length} รายการสินค้า
          </span>
        )}
      </div>

      {/* Target Summary Card */}
      <ActualTargetCard
        iconColorClass="text-blue-600"
        badgeColorClass="bg-blue-100 text-blue-800"
        gridColsClass={cn(
          "grid-cols-1 sm:grid-cols-2",
          targetCardItems.length >= 3 && "md:grid-cols-3",
        )}
        items={targetCardItems}
      />

      {/* PER-PRODUCT ACTUAL SALES RECORDING */}
      {hasMultipleProducts ? (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              บันทึกยอดขายที่เกิดขึ้นจริง (แยกตามรายสินค้า) <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              * กรอกจำนวนลังหรือยอดขายแยกตามสินค้าแต่ละตัว
            </span>
          </div>

          <div className="space-y-3">
            {localItems.map((item, idx) => {
              const targetQty = item.quantityCases ?? 0;
              const unitPrice = item.pricePerCase ? Number(item.pricePerCase) : 0;
              const targetLineTotal =
                item.totalAmount != null
                  ? item.totalAmount
                  : targetQty * unitPrice;

              return (
                <div
                  key={item.id || idx}
                  className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 sm:p-4 space-y-3 transition-colors hover:border-blue-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/70 pb-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-semibold">
                        {idx + 1}
                      </span>
                      <span>{item.productName || "สินค้าโปรโมชัน"}</span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>
                        เป้าหมาย:{" "}
                        <strong className="text-slate-700">
                          {targetQty.toLocaleString()} ลัง
                        </strong>
                        {unitPrice > 0 && (
                          <> @ ฿{unitPrice.toLocaleString()}/ลัง</>
                        )}
                      </span>
                      {targetLineTotal > 0 && (
                        <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          เป้า: ฿{targetLineTotal.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        จำนวนที่ขายได้จริง (ลัง)
                      </label>
                      <div className="relative flex items-center">
                        <Input
                          type="number"
                          min="0"
                          value={item.actualQuantityCases ?? ""}
                          onChange={(e) =>
                            handleItemChange(
                              idx,
                              "actualQuantityCases",
                              e.target.value,
                            )
                          }
                          placeholder="0"
                          className="bg-white border-slate-300 pr-12 text-xs font-medium"
                        />
                        <span className="absolute right-3 text-xs text-slate-400 font-medium pointer-events-none">
                          ลัง
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        ยอดขายที่เกิดขึ้นจริง (บาท) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Input
                          type="number"
                          min="0"
                          value={item.actualSales ?? ""}
                          onChange={(e) =>
                            handleItemChange(idx, "actualSales", e.target.value)
                          }
                          placeholder="0.00"
                          className="bg-white border-slate-300 pr-12 text-xs font-bold text-blue-800"
                        />
                        <span className="absolute right-3 text-xs text-slate-400 font-medium pointer-events-none">
                          บาท
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TOTAL ACTUAL SALES SUMMARY BAR */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900">
              รวมยอดขายที่เกิดขึ้นจริงทั้งหมด ({localItems.length} รายการ):
            </span>
            <span className="text-sm font-extrabold text-blue-800">
              ฿{totalActualSalesSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
            </span>
          </div>
        </div>
      ) : (
        /* SINGLE ACTUAL SALES INPUT (WHEN NO PER-PRODUCT ITEMS DEFINED) */
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800">
            ยอดขายที่เกิดขึ้นจริง (บาท) <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center">
            <Input
              type="number"
              min="0"
              value={actualSales}
              onChange={(e) => setActualSales(e.target.value)}
              placeholder="0.00"
              className="bg-white border-slate-300 pr-12 font-bold text-blue-800"
            />
            <span className="absolute right-3 text-xs font-semibold text-slate-500">
              บาท
            </span>
          </div>
        </div>
      )}

      {/* ATMOSPHERE IMAGES */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">
          รูปภาพบรรยากาศ <span className="text-rose-500">*</span>
        </label>
        <div className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/20 hover:bg-blue-50/40 rounded-2xl p-5 text-center transition-colors cursor-pointer relative group">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onUploadImages}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-blue-900">
              คลิกเพื่ออัปโหลด รูปภาพบรรยากาศหน้าร้าน
            </p>
          </div>
        </div>
        {images.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative aspect-square rounded-lg overflow-hidden border border-slate-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage(img.id)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
