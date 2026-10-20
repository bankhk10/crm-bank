"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Target,
  ShoppingBag,
  CheckCircle2,
  Plus,
  Trash2,
  Package,
  Sparkles,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import {
  ActivityInput,
  ActivityProductSelect,
  type ActivityProductItem,
} from "@/modules/activity/ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Type3PlanCard } from "./type3-plan-card";
import { NOT_CLOSED_REASONS } from "../../shared/constants";
import type {
  Type3ProductSaleDetail,
  Type3ActualFormProps,
} from "../types/actual.types";
import type { TargetProductItem } from "../types/planned.types";

export type { Type3ActualFormProps };

export function Type3ActualForm({
  isVisible,
  planType,
  target,
  targets,
  products = [],
  setSoldProducts,
  actualSales,
  setActualSales,
  actualQuantity,
  setActualQuantity,
  unclosedReason,
  setUnclosedReason,
  productSalesDetails = [],
  setProductSalesDetails,
}: Type3ActualFormProps) {
  if (!isVisible) return null;

  const effectiveTargets = useMemo(() => {
    return targets && targets.length > 0 ? targets : target ? [target] : [];
  }, [targets, target]);

  // Extract planned items from targets
  const initialPlannedItems: TargetProductItem[] = useMemo(() => {
    if (effectiveTargets.length === 0) return [];
    const allItems: TargetProductItem[] = [];

    effectiveTargets.forEach((t) => {
      if (t.items && t.items.length > 0) {
        t.items.forEach((item, idx) => {
          const saved =
            productSalesDetails?.find(
              (d) =>
                !d.isAdditional &&
                ((item.id && d.id === item.id) ||
                  (item.productId && d.productId === item.productId) ||
                  (d.productName === item.productName &&
                    (!item.storeId || d.storeId === item.storeId))),
            ) || productSalesDetails?.filter((d) => !d.isAdditional)?.[idx];

          allItems.push({
            ...item,
            productId: item.productId,
            actualQty: saved?.actualQty ?? item.actualQty ?? item.qty ?? "",
            unitPrice: saved?.unitPrice ?? item.unitPrice ?? 0,
            actualSales: saved?.actualSales ?? item.actualSales ?? "",
            unclosedReason: saved?.unclosedReason ?? item.unclosedReason ?? "",
            isAdditional: false,
          });
        });
      } else if (t.product) {
        const saved =
          productSalesDetails?.find(
            (d) => !d.isAdditional && d.productName === t.product,
          ) || productSalesDetails?.[0];

        allItems.push({
          id: t.id || "planned-single",
          productName: t.product,
          customer: t.customer,
          storeId: t.storeId,
          isSubDealer: t.isSubDealer,
          subDealerStore: t.subDealerStore,
          dealerName: t.dealerName,
          qty: t.targetQty,
          unitPrice: t.unitPrice ?? 0,
          detail: t.detail,
          actualQty: saved?.actualQty ?? t.targetQty ?? "",
          actualSales: saved?.actualSales ?? "",
          unclosedReason: saved?.unclosedReason ?? "",
          isAdditional: false,
        });
      }
    });

    return allItems;
  }, [effectiveTargets, productSalesDetails]);

  // State: Planned items
  const [plannedItems, setPlannedItems] = useState<TargetProductItem[]>(() => {
    if (initialPlannedItems.length > 0) {
      return initialPlannedItems;
    }
    return [];
  });

  // State: Additional products on site
  const [additionalItems, setAdditionalItems] = useState<TargetProductItem[]>(
    () => {
      const fromSaved = (productSalesDetails || []).filter(
        (d) => d.isAdditional,
      );
      return fromSaved.map((item, idx) => ({
        id: item.id || `additional-${idx}`,
        productId: item.productId,
        productName: item.productName || "",
        qty: "",
        unitPrice: item.unitPrice ?? 0,
        actualQty: item.actualQty ?? 1,
        actualSales: item.actualSales ?? "",
        unclosedReason: item.unclosedReason || "",
        isAdditional: true,
      }));
    },
  );

  // Sync to parent hooks
  const syncToParent = useCallback(
    (planned: TargetProductItem[], additional: TargetProductItem[]) => {
      const all: Type3ProductSaleDetail[] = [
        ...planned.map((p) => {
          const qty = Number(p.actualQty ?? 0);
          const uPrice = Number(p.unitPrice ?? 0);
          const total = p.actualSales != null && p.actualSales !== ""
            ? Number(p.actualSales)
            : qty * uPrice;

          return {
            id: p.id,
            productId: p.productId,
            productName: p.productName,
            customer: p.customer,
            storeId: p.storeId,
            qty: p.qty,
            unitPrice: uPrice,
            price: p.price,
            actualQty: qty,
            actualSales: total,
            unclosedReason: p.unclosedReason || "",
            isAdditional: false,
          };
        }),
        ...additional.map((a) => {
          const qty = Number(a.actualQty ?? 0);
          const uPrice = Number(a.unitPrice ?? 0);
          const total = a.actualSales != null && a.actualSales !== ""
            ? Number(a.actualSales)
            : qty * uPrice;

          return {
            id: a.id,
            productId: a.productId,
            productName: a.productName,
            customer: a.customer,
            storeId: a.storeId,
            unitPrice: uPrice,
            actualQty: qty,
            actualSales: total,
            unclosedReason: a.unclosedReason || "",
            isAdditional: true,
          };
        }),
      ];

      if (setProductSalesDetails) {
        setProductSalesDetails(all);
      }

      const totalQty = all.reduce((sum, item) => sum + (Number(item.actualQty) || 0), 0);
      const totalAmount = all.reduce((sum, item) => sum + (Number(item.actualSales) || 0), 0);
      const productNames = all
        .filter((item) => Number(item.actualQty) > 0)
        .map((item) => item.productName)
        .filter(Boolean)
        .join(", ");
      const reasons = all
        .map((item) => item.unclosedReason)
        .filter(Boolean)
        .join(" | ");

      setActualQuantity(String(totalQty));
      setActualSales(String(totalAmount));
      setSoldProducts(productNames);
      setUnclosedReason(reasons);
    },
    [setProductSalesDetails, setActualQuantity, setActualSales, setSoldProducts, setUnclosedReason],
  );

  const updatePlannedItem = (
    index: number,
    field: keyof TargetProductItem,
    val: any,
  ) => {
    const updated = [...plannedItems];
    const item = { ...updated[index], [field]: val };

    if (field === "actualQty" || field === "unitPrice") {
      const q = Number(field === "actualQty" ? val : item.actualQty) || 0;
      const u = Number(field === "unitPrice" ? val : item.unitPrice) || 0;
      item.actualSales = String(q * u);
    }

    updated[index] = item;
    setPlannedItems(updated);
    syncToParent(updated, additionalItems);
  };

  const addAdditionalRow = () => {
    const newItem: TargetProductItem = {
      id: `add-${Date.now()}`,
      productName: "",
      actualQty: 1,
      unitPrice: 0,
      actualSales: "0",
      unclosedReason: "",
      isAdditional: true,
    };
    const updated = [...additionalItems, newItem];
    setAdditionalItems(updated);
    syncToParent(plannedItems, updated);
  };

  const updateAdditionalItem = (
    index: number,
    field: keyof TargetProductItem,
    val: any,
    productItem?: ActivityProductItem,
  ) => {
    const updated = [...additionalItems];
    const item = { ...updated[index], [field]: val };

    if (field === "productName" && val) {
      const found =
        productItem ||
        products.find((p) => p.name === val || p.id === val);
      if (found) {
        item.productId = found.id;
        item.productName = found.name;
        if ((found as any).price != null) {
          item.unitPrice = Number((found as any).price);
        }
      }
    }

    if (field === "actualQty" || field === "unitPrice") {
      const q = Number(field === "actualQty" ? val : item.actualQty) || 0;
      const u = Number(field === "unitPrice" ? val : item.unitPrice) || 0;
      item.actualSales = String(q * u);
    }

    updated[index] = item;
    setAdditionalItems(updated);
    syncToParent(plannedItems, updated);
  };

  const deleteAdditionalRow = (index: number) => {
    const updated = additionalItems.filter((_, idx) => idx !== index);
    setAdditionalItems(updated);
    syncToParent(plannedItems, updated);
  };

  // Compute total sales across planned + additional
  const allCurrentDetails = useMemo(() => {
    return [
      ...plannedItems.map((p) => ({
        qty: Number(p.actualQty) || 0,
        amount: Number(p.actualSales) || (Number(p.actualQty) || 0) * (Number(p.unitPrice) || 0),
      })),
      ...additionalItems.map((a) => ({
        qty: Number(a.actualQty) || 0,
        amount: Number(a.actualSales) || (Number(a.actualQty) || 0) * (Number(a.unitPrice) || 0),
      })),
    ];
  }, [plannedItems, additionalItems]);

  const totalSoldQty = allCurrentDetails.reduce((s, i) => s + i.qty, 0);
  const totalSoldAmount = allCurrentDetails.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-4">
      {/* 1. Target Plan Card Reference */}
      {effectiveTargets.map((t, idx) => (
        <Type3PlanCard
          key={t.id || `type3-actual-ref-${idx}`}
          planType={planType}
          target={t}
        />
      ))}

      {/* 2. Actual Sales Outcome Form */}
      <div className="border border-emerald-200/90 rounded-2xl p-4 sm:p-5 bg-white space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-950 text-sm sm:text-base">
                บันทึกผลการเสนอขายสินค้าจริง (Actual Sales Outcome)
              </h4>
              <p className="text-xs text-slate-500">
                ระบุจำนวนที่สามารถปิดการขายได้จริง และเหตุผลในกรณีที่ปิดไม่ได้ตามเป้าหมาย
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border-emerald-200"
          >
            TYPE_3
          </Badge>
        </div>

        {/* Planned Items Section */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            ผลการเสนอขายสินค้าตามแผน
          </label>

          {plannedItems.length === 0 ? (
            <div className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl">
              ไม่มีสินค้าในแผนงาน
            </div>
          ) : (
            <div className="space-y-3">
              {plannedItems.map((item, idx) => {
                const targetQty = Number(item.qty || 0);
                const actualQty = Number(item.actualQty ?? 0);
                const isUnderTarget = targetQty > 0 && actualQty < targetQty;
                const isClosed = targetQty > 0 && actualQty >= targetQty;

                return (
                  <div
                    key={item.id || idx}
                    className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/90 shadow-2xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 text-xs sm:text-sm">
                          {item.productName}
                        </span>
                        {item.customer && (
                          <span className="text-[11px] text-slate-500">
                            ({item.customer})
                          </span>
                        )}
                      </div>

                      <div>
                        {isClosed ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold"
                          >
                            ปิดการขายสำเร็จตามเป้า
                          </Badge>
                        ) : isUnderTarget ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-bold"
                          >
                            ปิดได้ไม่ครบตามเป้า
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-slate-100 text-slate-700 border-slate-200 text-xs"
                          >
                            ยังไม่ได้ระบุ
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs">
                      {/* Target Info */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-0.5">
                        <span className="text-slate-400 font-medium block">
                          เป้าหมายตามแผน
                        </span>
                        <strong className="text-slate-800 text-sm">
                          {targetQty.toLocaleString()} หน่วย
                        </strong>
                      </div>

                      {/* Actual Qty Input */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          จำนวนที่ขายได้จริง <span className="text-rose-500">*</span>
                        </label>
                        <ActivityInput
                          type="number"
                          min={0}
                          value={item.actualQty ?? ""}
                          onChange={(e) =>
                            updatePlannedItem(idx, "actualQty", e.target.value)
                          }
                          className="font-bold text-emerald-900 bg-white"
                          placeholder="ระบุจำนวน..."
                          required
                        />
                      </div>

                      {/* Unit Price */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          ราคา/หน่วย (บาท)
                        </label>
                        <ActivityInput
                          type="number"
                          min={0}
                          value={item.unitPrice ?? 0}
                          onChange={(e) =>
                            updatePlannedItem(idx, "unitPrice", e.target.value)
                          }
                          className="bg-white font-medium"
                          placeholder="ราคา..."
                        />
                      </div>

                      {/* Line Actual Sales */}
                      <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200 flex flex-col justify-between">
                        <span className="text-emerald-800 font-medium text-[11px]">
                          ยอดขายจริงที่ปิดได้
                        </span>
                        <strong className="text-emerald-900 text-sm font-extrabold text-right">
                          ฿{(Number(item.actualSales) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>

                    {/* Reason input if under target */}
                    {isUnderTarget && (
                      <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-2.5 space-y-1.5">
                        <span className="text-amber-800 font-bold text-xs flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          เหตุผลที่ไม่สามารถปิดการขายได้ / ปิดได้ไม่ครบตามเป้า <span className="text-rose-500">*</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <select
                            value={item.unclosedReason || ""}
                            onChange={(e) =>
                              updatePlannedItem(idx, "unclosedReason", e.target.value)
                            }
                            className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          >
                            <option value="">-- เลือกเหตุผลหลัก --</option>
                            {NOT_CLOSED_REASONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                          <ActivityInput
                            type="text"
                            value={item.unclosedReason || ""}
                            onChange={(e) =>
                              updatePlannedItem(idx, "unclosedReason", e.target.value)
                            }
                            placeholder="หรือพิมพ์ระบุเหตุผล/คู่แข่งเพิ่มเติม..."
                            className="bg-white text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Additional Products on Site */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              สินค้าที่เสนอขายเพิ่มเติมหน้างาน (Additional Products)
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addAdditionalRow}
              className="h-7 text-xs px-2.5 border-purple-300 text-purple-700 bg-white hover:bg-purple-50 shadow-2xs cursor-pointer"
            >
              <Plus className="h-3 w-3 mr-1 text-purple-600" />
              เพิ่มสินค้าหน้างาน
            </Button>
          </div>

          {additionalItems.length > 0 && (
            <div className="space-y-2.5">
              {additionalItems.map((addItem, aIdx) => {
                return (
                  <div
                    key={addItem.id || aIdx}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end bg-purple-50/20 p-3 rounded-lg border border-purple-200/70 shadow-2xs"
                  >
                    <div className="md:col-span-4">
                      <ActivityProductSelect
                        id={`additional-prod-${addItem.id}`}
                        label="สินค้าเพิ่มเติม"
                        labelClassName="block text-[11px] font-semibold text-slate-600 mb-1 mx-0"
                        triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-purple-500"
                        value={addItem.productName}
                        valueKey="name"
                        unitFilter="box"
                        onChange={(val, prod) =>
                          updateAdditionalItem(aIdx, "productName", val, prod)
                        }
                        products={products}
                        placeholder="เลือกสินค้าหน้างาน..."
                        searchPlaceholder="ค้นหาสินค้า..."
                        emptyText="ไม่พบสินค้า"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        จำนวนที่ขายได้
                      </label>
                      <ActivityInput
                        type="number"
                        min={1}
                        value={addItem.actualQty}
                        onChange={(e) =>
                          updateAdditionalItem(aIdx, "actualQty", e.target.value)
                        }
                        className="text-center font-bold text-purple-900 bg-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        ราคา/หน่วย (บาท)
                      </label>
                      <ActivityInput
                        type="number"
                        min={0}
                        value={addItem.unitPrice ?? 0}
                        onChange={(e) =>
                          updateAdditionalItem(aIdx, "unitPrice", e.target.value)
                        }
                        className="bg-white font-medium text-right"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        ยอดขายจริง
                      </label>
                      <div className="h-9 px-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs font-bold text-purple-800">
                        <span>฿</span>
                        <span>
                          {(Number(addItem.actualSales) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-1 flex items-center justify-end md:justify-center">
                      <button
                        type="button"
                        onClick={() => deleteAdditionalRow(aIdx)}
                        className="h-9 w-9 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                        title="ลบรายการนี้"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Total Outcome Bar */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-emerald-950 font-bold">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>ยอดขายจริงที่สรุปได้รวมทั้งหมด</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-600">
              จำนวนขายได้: <strong className="text-slate-900 font-bold">{totalSoldQty.toLocaleString()} หน่วย</strong>
            </span>
            <span className="text-emerald-900 font-extrabold text-sm sm:text-base">
              ยอดขายรวม: ฿{totalSoldAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ActualType3Sales = Type3ActualForm;
