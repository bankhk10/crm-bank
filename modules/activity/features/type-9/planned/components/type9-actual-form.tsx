"use client";

import React, { useState } from "react";
import { Store, Package, ShoppingBag, Users } from "lucide-react";
import { ActivityPhotoUpload, ActivityInput } from "@/modules/activity/ui";
import { Type9PlanCard } from "./type9-plan-card";
import type {
  Type9ActualFormProps,
  ActualType9StoreProps,
} from "../types/actual.types";
import type {
  Type9TargetProductItem,
  Type9ProductSaleDetail,
} from "../../shared/types";

export type {
  Type9ActualFormProps,
  ActualType9StoreProps,
  Type9TargetProductItem,
  Type9ProductSaleDetail,
};

export function Type9ActualForm({
  isVisible = true,
  planType,
  target,
  targets,
  actualSales,
  setActualSales,
  productSalesDetails,
  setProductSalesDetails,
  actualAttendees,
  setActualAttendees,
  images = [],
  setImages,
}: Type9ActualFormProps) {
  const itemsSource =
    targets && targets.length > 0
      ? targets.flatMap((t) => t.items || [])
      : target?.items || [];

  const [localItems, setLocalItems] = useState<Type9TargetProductItem[]>(() => {
    if (itemsSource.length > 0) {
      return itemsSource.map((item, idx) => {
        const saved =
          productSalesDetails?.find(
            (d) =>
              (item.id && d.id === item.id) ||
              (item.productId &&
                (d.productId === item.productId || d.id === item.productId)) ||
              d.productName === item.productName,
          ) || productSalesDetails?.[idx];

        return {
          ...item,
          actualQuantityCases:
            saved?.actualQuantityCases ?? item.actualQuantityCases ?? "",
          actualSales: saved?.actualSales ?? item.actualSales ?? "",
        };
      });
    }
    return [];
  });

  if (!isVisible) return null;

  const hasMultipleProducts = localItems && localItems.length > 0;

  const handleItemChange = (
    index: number,
    field: "actualQuantityCases" | "actualSales",
    value: string,
  ) => {
    const updated = [...localItems];
    const currentItem = { ...updated[index], [field]: value };

    // Auto-calculate actualSales when actualQuantityCases changes and pricePerCase exists
    if (field === "actualQuantityCases") {
      const sanitized = value.replace(/,/g, "").trim();
      const qtyNum = parseFloat(sanitized);
      const price = currentItem.pricePerCase || 0;
      if (value === "") {
        currentItem.actualSales = "";
      } else if (price > 0 && !isNaN(qtyNum)) {
        currentItem.actualSales = (qtyNum * price).toLocaleString();
      }
    }

    updated[index] = currentItem;
    setLocalItems(updated);

    // Sync to parent
    if (setProductSalesDetails) {
      setProductSalesDetails(
        updated.map((item) => ({
          id: item.id,
          productId: item.productId || item.id,
          storeId: item.storeId,
          productName: item.productName,
          pricePerCase: item.pricePerCase,
          quantityCases: item.quantityCases,
          totalAmount: item.totalAmount,
          actualQuantityCases: item.actualQuantityCases,
          actualSales: item.actualSales,
        })),
      );
    }

    // Auto-calculate total actual sales across all items
    if (setActualSales) {
      const total = updated.reduce((sum, item) => {
        const valStr = String(item.actualSales || "").replace(/,/g, "").trim();
        const num = parseFloat(valStr);
        return sum + (isNaN(num) ? 0 : num);
      }, 0);

      if (total > 0) {
        setActualSales(total.toLocaleString());
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. PLANNED TARGET CARD */}
      {targets && targets.length > 0 ? (
        <div className="space-y-4">
          {targets.map((t, idx) => (
            <Type9PlanCard
              key={t.id || idx}
              target={t}
              planType={planType}
              hideItemsTable
            />
          ))}
        </div>
      ) : (
        <Type9PlanCard
          target={target}
          planType={planType}
          hideItemsTable
        />
      )}

      {/* 2. ACTUAL RESULT CARD */}
      <div className="bg-white border border-teal-200/80 rounded-2xl p-4 sm:p-5 md:p-6 space-y-4 shadow-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-teal-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-200">
              <Store className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-teal-950 text-sm sm:text-base">
              บันทึกผลการจัดกิจกรรมส่งเสริมการขายหน้าร้าน (Type 9)
            </h4>
          </div>
        </div>

        {/* Product Sales Details Table */}
        {hasMultipleProducts && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
              <Package className="w-4 h-4 text-teal-600" />
              <span>บันทึกยอดขายแยกตามรายการสินค้าหน้าร้าน</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-teal-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-teal-50/50 border-b border-teal-100 text-teal-900 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">ชื่อสินค้า</th>
                    <th className="py-2.5 px-3 text-center">เป้าหมาย (ลัง)</th>
                    <th className="py-2.5 px-3 text-center">ราคา/ลัง</th>
                    <th className="py-2.5 px-3 min-w-[130px]">ขายได้จริง (ลัง)</th>
                    <th className="py-2.5 px-3 min-w-[140px] text-right">
                      ยอดขายจริง (บาท)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-50">
                  {localItems.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      className="hover:bg-teal-50/20 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {item.productName}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500">
                        {item.quantityCases ?? "-"}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500">
                        {item.pricePerCase
                          ? `${Number(item.pricePerCase).toLocaleString()} ฿`
                          : "-"}
                      </td>
                      <td className="py-2 px-3">
                        <ActivityInput
                          id={`t9-item-qty-${idx}`}
                          type="number"
                          placeholder="0"
                          value={String(item.actualQuantityCases ?? "")}
                          onChange={(e) =>
                            handleItemChange(idx, "actualQuantityCases", e.target.value)
                          }
                          className="h-9 text-xs text-center font-bold text-teal-900 focus:ring-teal-500"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <ActivityInput
                          id={`t9-item-sales-${idx}`}
                          type="text"
                          placeholder="0.00"
                          value={String(item.actualSales ?? "")}
                          onChange={(e) =>
                            handleItemChange(idx, "actualSales", e.target.value)
                          }
                          className="h-9 text-xs text-right font-bold text-emerald-800 focus:ring-emerald-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Header Fields: Total Sales & Attendees */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ยอดขายหน้าร้านจริงรวม (บาท){" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
                ฿
              </span>
              <ActivityInput
                id="t9-actual-sales-input"
                type="text"
                placeholder="ระบุยอดขายหน้าร้านจริง..."
                value={actualSales || ""}
                onChange={(e) => setActualSales && setActualSales(e.target.value)}
                className="h-10 pl-7 text-xs font-bold text-teal-800 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ผู้เข้าร่วมกิจกรรมจริง (คน)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Users className="w-4 h-4" />
              </span>
              <ActivityInput
                id="t9-actual-attendees-input"
                type="number"
                placeholder="ระบุจำนวนผู้เข้าร่วม..."
                value={actualAttendees || ""}
                onChange={(e) => setActualAttendees && setActualAttendees(e.target.value)}
                className="h-10 pl-9 text-xs font-bold text-slate-800 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Photo Upload: Store Event Atmosphere */}
        <div className="pt-2 border-t border-slate-100">
          <ActivityPhotoUpload
            title="ภาพถ่ายบรรยากาศการจัดกิจกรรมหน้าร้าน"
            images={images as any}
            onImagesChange={(imgs) => setImages && setImages(imgs as any)}
            maxFiles={10}
            accentColor="emerald"
          />
        </div>
      </div>
    </div>
  );
}

// Backward-compatible alias
export const ActualType9Store = Type9ActualForm;
