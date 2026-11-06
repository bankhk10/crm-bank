"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Store, Package, Users } from "lucide-react";
import { ActivityPhotoUpload, ActivityInput, ActivityNumberInput } from "@/modules/activity/ui";
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

function cleanNumberString(val: any): string {
  if (val == null || val === "") return "";
  return String(val).replace(/,/g, "").trim();
}

export function Type9ActualForm({
  isVisible = true,
  planType,
  target,
  targets,
  products = [],
  actualSales,
  setActualSales,
  productSalesDetails,
  setProductSalesDetails,
  actualAttendees,
  setActualAttendees,
  images = [],
  setImages,
}: Type9ActualFormProps) {
  const itemsSource = useMemo(() => {
    const rawList =
      targets && targets.length > 0 ? targets : target ? [target] : [];

    return rawList.flatMap((t: any) => {
      const sourceList =
        t.items && t.items.length > 0
          ? t.items
          : t.products && t.products.length > 0
            ? t.products
            : [];

      return sourceList.map((p: any) => {
        const matchedProduct = products?.find(
          (prod) =>
            (p.productId && prod.id === p.productId) ||
            (p.productName && prod.name === p.productName),
        );

        const qty =
          p.quantityCases != null
            ? Number(p.quantityCases)
            : p.targetQuantity != null
              ? Number(p.targetQuantity)
              : 0;

        const pkgSize =
          p.packageSizePerBox != null
            ? Number(p.packageSizePerBox)
            : p.product?.packageSizePerBox != null
              ? Number(p.product.packageSizePerBox)
              : matchedProduct?.packageSizePerBox != null
                ? Number(matchedProduct.packageSizePerBox)
                : 1;

        const bottlePrice =
          p.pricePerBottle != null
            ? Number(p.pricePerBottle)
            : p.targetUnitPrice != null && Number(p.targetUnitPrice) > 0
              ? Number(p.targetUnitPrice)
              : p.product?.price != null
                ? Number(p.product.price)
                : matchedProduct?.price != null
                  ? Number(matchedProduct.price)
                  : 0;

        const price =
          p.pricePerCase != null &&
          Number(p.pricePerCase) > 0 &&
          Number(p.pricePerCase) !== bottlePrice
            ? Number(p.pricePerCase)
            : bottlePrice * pkgSize;

        const total =
          p.totalAmount != null
            ? Number(p.totalAmount)
            : p.targetAmount != null
              ? Number(p.targetAmount)
              : qty * price;

        const actualQty =
          p.actualQuantityCases != null
            ? cleanNumberString(p.actualQuantityCases)
            : p.actualQuantity != null
              ? cleanNumberString(p.actualQuantity)
              : "";

        const actualBottles =
          p.actualBottleQuantity != null
            ? cleanNumberString(p.actualBottleQuantity)
            : p.actualQuantityBottles != null
              ? cleanNumberString(p.actualQuantityBottles)
              : "0";

        const actualTotal =
          p.actualSales != null
            ? cleanNumberString(p.actualSales)
            : p.actualTotal != null
              ? cleanNumberString(p.actualTotal)
              : "";

        return {
          id: p.id,
          targetId: p.targetId || t.id,
          productId: p.productId || p.id,
          storeId: p.storeId || t.subdealerId || t.dealerId || null,
          productName:
            p.productName || p.product?.name || matchedProduct?.name || "",
          productRole: p.productRole || "TARGET",
          packageSizePerBox: pkgSize,
          pricePerBottle: bottlePrice,
          quantityCases: qty,
          pricePerCase: price,
          totalAmount: total,
          actualQuantityCases: actualQty,
          actualBottleQuantity: actualBottles,
          actualSales: actualTotal,
          actualNotes: p.actualNotes || undefined,
        };
      });
    });
  }, [targets, target, products]);

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
            cleanNumberString(saved?.actualQuantityCases) ||
            cleanNumberString(item.actualQuantityCases),
          actualBottleQuantity:
            cleanNumberString(saved?.actualBottleQuantity) ||
            cleanNumberString((saved as any)?.actualQuantityBottles) ||
            cleanNumberString(item.actualBottleQuantity) ||
            "0",
          actualSales:
            cleanNumberString(saved?.actualSales) ||
            cleanNumberString(item.actualSales),
        };
      });
    }
    return [];
  });

  // Sync state whenever external productSalesDetails or itemsSource changes
  useEffect(() => {
    if (itemsSource.length > 0) {
      setLocalItems((prev) => {
        return itemsSource.map((item, idx) => {
          const existing =
            prev.find(
              (p) =>
                (item.id && p.id === item.id) ||
                (item.productId &&
                  (p.productId === item.productId ||
                    p.id === item.productId)) ||
                p.productName === item.productName,
            ) || prev[idx];

          const saved =
            productSalesDetails?.find(
              (d) =>
                (item.id && d.id === item.id) ||
                (item.productId &&
                  (d.productId === item.productId ||
                    d.id === item.productId)) ||
                d.productName === item.productName,
            ) || productSalesDetails?.[idx];

          const actualQty =
            existing?.actualQuantityCases !== undefined &&
            existing?.actualQuantityCases !== ""
              ? cleanNumberString(existing.actualQuantityCases)
              : cleanNumberString(saved?.actualQuantityCases) ||
                cleanNumberString(item.actualQuantityCases);

          const actualBottles =
            existing?.actualBottleQuantity !== undefined &&
            existing?.actualBottleQuantity !== ""
              ? cleanNumberString(existing.actualBottleQuantity)
              : cleanNumberString(saved?.actualBottleQuantity) ||
                cleanNumberString((saved as any)?.actualQuantityBottles) ||
                cleanNumberString(item.actualBottleQuantity) ||
                "0";

          const actualTot =
            existing?.actualSales !== undefined && existing?.actualSales !== ""
              ? cleanNumberString(existing.actualSales)
              : cleanNumberString(saved?.actualSales) ||
                cleanNumberString(item.actualSales);

          return {
            ...item,
            actualQuantityCases: actualQty,
            actualBottleQuantity: actualBottles,
            actualSales: actualTot,
          };
        });
      });
    }
  }, [itemsSource, productSalesDetails]);

  // Sync loaded actuals to parent form state if parent is unpopulated
  useEffect(() => {
    if (
      setProductSalesDetails &&
      localItems.length > 0 &&
      (!productSalesDetails || productSalesDetails.length === 0)
    ) {
      const hasActuals = localItems.some(
        (it) =>
          (it.actualQuantityCases != null && it.actualQuantityCases !== "") ||
          (it.actualBottleQuantity != null &&
            it.actualBottleQuantity !== "" &&
            it.actualBottleQuantity !== "0") ||
          (it.actualSales != null && it.actualSales !== ""),
      );
      if (hasActuals) {
        setProductSalesDetails(
          localItems.map((item) => ({
            id: item.id,
            targetId: item.targetId,
            productId: item.productId || item.id,
            storeId: item.storeId,
            productName: item.productName,
            packageSizePerBox: item.packageSizePerBox,
            pricePerBottle: item.pricePerBottle,
            pricePerCase: item.pricePerCase,
            quantityCases: item.quantityCases,
            totalAmount: item.totalAmount,
            actualQuantityCases: item.actualQuantityCases,
            actualBottleQuantity: item.actualBottleQuantity,
            actualSales: item.actualSales,
          })),
        );
      }
    }
  }, [localItems, productSalesDetails, setProductSalesDetails]);

  // Fallback hydration for actualSales and actualAttendees from target or target.result
  useEffect(() => {
    const primaryTarget = targets?.[0] || target;
    const targetResult = primaryTarget?.result;

    if ((!actualSales || actualSales === "") && setActualSales) {
      if (targetResult?.actualTotalSales != null) {
        const num = Number(
          String(targetResult.actualTotalSales).replace(/,/g, ""),
        );
        setActualSales(
          !isNaN(num)
            ? String(num)
            : cleanNumberString(targetResult.actualTotalSales),
        );
      } else if (
        primaryTarget?.actualSales != null &&
        primaryTarget.actualSales !== ""
      ) {
        const num = Number(
          String(primaryTarget.actualSales).replace(/,/g, ""),
        );
        setActualSales(
          !isNaN(num)
            ? String(num)
            : cleanNumberString(primaryTarget.actualSales),
        );
      }
    }

    if ((!actualAttendees || actualAttendees === "") && setActualAttendees) {
      if (
        targetResult?.actualAttendeesCount != null &&
        Number(targetResult.actualAttendeesCount) > 0
      ) {
        setActualAttendees(String(targetResult.actualAttendeesCount));
      } else if (
        primaryTarget?.actualAttendees != null &&
        primaryTarget.actualAttendees !== ""
      ) {
        setActualAttendees(cleanNumberString(primaryTarget.actualAttendees));
      }
    }
  }, [
    targets,
    target,
    actualSales,
    actualAttendees,
    setActualSales,
    setActualAttendees,
  ]);

  if (!isVisible) return null;

  const hasMultipleProducts = localItems && localItems.length > 0;

  const handleItemChange = (
    index: number,
    field: "actualQuantityCases" | "actualBottleQuantity" | "actualSales",
    value: string,
  ) => {
    const updated = [...localItems];
    const currentItem = { ...updated[index] };
    const sanitized = cleanNumberString(value);

    const pkgSize =
      Number(currentItem.packageSizePerBox) > 0
        ? Number(currentItem.packageSizePerBox)
        : 1;
    const bottlePrice =
      currentItem.pricePerBottle != null
        ? Number(currentItem.pricePerBottle)
        : currentItem.pricePerCase != null && pkgSize > 0
          ? Number(currentItem.pricePerCase) / pkgSize
          : 0;
    const casePrice =
      currentItem.pricePerCase != null &&
      Number(currentItem.pricePerCase) > 0 &&
      Number(currentItem.pricePerCase) !== bottlePrice
        ? Number(currentItem.pricePerCase)
        : bottlePrice * pkgSize;

    // Auto-calculate actualSales when actualQuantityCases or actualBottleQuantity changes
    if (field === "actualQuantityCases") {
      currentItem.actualQuantityCases = sanitized;
      const casesNum = parseFloat(sanitized);
      const bottlesNum =
        parseFloat(cleanNumberString(currentItem.actualBottleQuantity)) || 0;

      if (
        sanitized === "" &&
        (!currentItem.actualBottleQuantity ||
          currentItem.actualBottleQuantity === "0" ||
          currentItem.actualBottleQuantity === "")
      ) {
        currentItem.actualSales = "";
      } else {
        const total =
          (isNaN(casesNum) ? 0 : casesNum * casePrice) +
          bottlesNum * bottlePrice;
        currentItem.actualSales = String(total);
      }
    } else if (field === "actualBottleQuantity") {
      currentItem.actualBottleQuantity = sanitized;
      const casesNum =
        parseFloat(cleanNumberString(currentItem.actualQuantityCases)) || 0;
      const bottlesNum = parseFloat(sanitized);

      if (
        sanitized === "" &&
        (!currentItem.actualQuantityCases ||
          currentItem.actualQuantityCases === "")
      ) {
        currentItem.actualSales = "";
      } else {
        const total =
          casesNum * casePrice +
          (isNaN(bottlesNum) ? 0 : bottlesNum * bottlePrice);
        currentItem.actualSales = String(total);
      }
    } else if (field === "actualSales") {
      currentItem.actualSales = sanitized;
    }

    updated[index] = currentItem;
    setLocalItems(updated);

    // Sync to parent
    if (setProductSalesDetails) {
      setProductSalesDetails(
        updated.map((item) => ({
          id: item.id,
          targetId: item.targetId,
          productId: item.productId || item.id,
          storeId: item.storeId,
          productName: item.productName,
          packageSizePerBox: item.packageSizePerBox,
          pricePerBottle: item.pricePerBottle,
          pricePerCase: item.pricePerCase,
          quantityCases: item.quantityCases,
          totalAmount: item.totalAmount,
          actualQuantityCases: item.actualQuantityCases,
          actualBottleQuantity: item.actualBottleQuantity,
          actualSales: item.actualSales,
        })),
      );
    }

    // Auto-calculate total actual sales across all items
    if (setActualSales) {
      const total = updated.reduce((sum, item) => {
        const valStr = cleanNumberString(item.actualSales);
        const num = parseFloat(valStr);
        return sum + (isNaN(num) ? 0 : num);
      }, 0);

      const hasAnyActual = updated.some(
        (it) =>
          (it.actualQuantityCases != null &&
            String(it.actualQuantityCases).trim() !== "") ||
          (it.actualBottleQuantity != null &&
            String(it.actualBottleQuantity).trim() !== "" &&
            String(it.actualBottleQuantity).trim() !== "0") ||
          (it.actualSales != null && String(it.actualSales).trim() !== ""),
      );

      if (hasAnyActual) {
        setActualSales(String(total));
      } else {
        setActualSales("");
      }
    }
  };

  const totalQuantityCases = useMemo(() => {
    return localItems.reduce(
      (sum, it) =>
        sum + (Number(cleanNumberString(it.actualQuantityCases)) || 0),
      0,
    );
  }, [localItems]);

  const totalQuantityBottles = useMemo(() => {
    return localItems.reduce(
      (sum, it) =>
        sum + (Number(cleanNumberString(it.actualBottleQuantity)) || 0),
      0,
    );
  }, [localItems]);

  const totalItemActualSales = useMemo(() => {
    return localItems.reduce(
      (sum, it) => sum + (Number(cleanNumberString(it.actualSales)) || 0),
      0,
    );
  }, [localItems]);

  const totalTargetAmount = useMemo(() => {
    return localItems.reduce((sum, it) => {
      const rowTarget =
        it.totalAmount != null
          ? Number(it.totalAmount)
          : (Number(it.quantityCases) || 0) * (Number(it.pricePerCase) || 0);
      return sum + (isNaN(rowTarget) ? 0 : rowTarget);
    }, 0);
  }, [localItems]);

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
        <Type9PlanCard target={target} planType={planType} hideItemsTable />
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
                    <th className="py-2.5 px-3 text-right">ยอดรวม / ลัง</th>
                    <th className="py-2.5 px-3 text-right">รวมเป้าหมาย</th>
                    <th className="py-2.5 px-3 min-w-[120px] text-center">
                      ขายได้จริง (ลัง)
                    </th>
                    <th className="py-2.5 px-3 min-w-[120px] text-center">
                      ขายได้จริง (ขวด)
                    </th>
                    <th className="py-2.5 px-3 min-w-[140px] text-right">
                      ยอดขายจริง (บาท)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-50">
                  {localItems.map((item, idx) => {
                    const rowTargetTotal =
                      item.totalAmount != null
                        ? Number(item.totalAmount)
                        : (Number(item.quantityCases) || 0) * (Number(item.pricePerCase) || 0);

                    return (
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
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                          {item.pricePerCase
                            ? `${Number(item.pricePerCase).toLocaleString()} ฿`
                            : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-teal-800">
                          {rowTargetTotal > 0
                            ? `${rowTargetTotal.toLocaleString()} ฿`
                            : "-"}
                        </td>
                        <td className="py-2 px-3">
                          <ActivityNumberInput
                            id={`t9-item-qty-${idx}`}
                            min={0}
                            allowDecimals={false}
                            defaultValueOnBlur={0}
                            placeholder="0"
                            value={cleanNumberString(item.actualQuantityCases)}
                            onChangeValue={(val, raw) =>
                              handleItemChange(
                                idx,
                                "actualQuantityCases",
                                raw,
                              )
                            }
                            className="h-9 text-xs text-center font-bold text-teal-900 focus:ring-teal-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <ActivityNumberInput
                            id={`t9-item-bottles-${idx}`}
                            min={0}
                            allowDecimals={false}
                            defaultValueOnBlur={0}
                            placeholder="0"
                            value={cleanNumberString(item.actualBottleQuantity) || "0"}
                            onChangeValue={(val, raw) =>
                              handleItemChange(
                                idx,
                                "actualBottleQuantity",
                                raw,
                              )
                            }
                            className="h-9 text-xs text-center font-bold text-teal-900 focus:ring-teal-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <ActivityNumberInput
                            id={`t9-item-sales-${idx}`}
                            min={0}
                            defaultValueOnBlur={0}
                            placeholder="0.00"
                            value={cleanNumberString(item.actualSales)}
                            onChangeValue={(val, raw) =>
                              handleItemChange(idx, "actualSales", raw)
                            }
                            className="h-9 text-xs text-right font-bold text-emerald-800 focus:ring-emerald-500"
                          />
                          {item.actualSales &&
                            !isNaN(Number(cleanNumberString(item.actualSales))) &&
                            Number(cleanNumberString(item.actualSales)) > 0 && (
                              <div className="text-[10px] text-emerald-600 font-mono text-right mt-0.5">
                                ฿{Number(cleanNumberString(item.actualSales)).toLocaleString()}
                              </div>
                            )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {localItems.length > 0 && (
                  <tfoot className="bg-teal-50/60 border-t border-teal-100 font-semibold text-teal-950">
                    <tr>
                      <td colSpan={3} className="py-2 px-3 text-right text-xs">
                        รวมตามรายการสินค้า:
                      </td>
                      <td className="py-2 px-3 text-right text-xs text-teal-900 font-bold">
                        {totalTargetAmount > 0
                          ? `${totalTargetAmount.toLocaleString()} ฿`
                          : "-"}
                      </td>
                      <td className="py-2 px-3 text-center text-xs text-teal-900 font-bold">
                        {totalQuantityCases.toLocaleString()} ลัง
                      </td>
                      <td className="py-2 px-3 text-center text-xs text-teal-900 font-bold">
                        {totalQuantityBottles.toLocaleString()} ขวด
                      </td>
                      <td className="py-2 px-3 text-right text-xs text-emerald-800 font-bold">
                        {totalItemActualSales.toLocaleString()} ฿
                      </td>
                    </tr>
                  </tfoot>
                )}
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
            <ActivityNumberInput
              id="t9-actual-sales-input"
              prefix="฿"
              min={0}
              placeholder="ระบุยอดขายหน้าร้านจริง..."
              value={cleanNumberString(actualSales)}
              onChangeValue={(val) =>
                setActualSales && setActualSales(String(val))
              }
              className="text-xs font-bold text-teal-800 focus:ring-teal-500"
              required
            />
            {actualSales &&
              !isNaN(Number(cleanNumberString(actualSales))) &&
              Number(cleanNumberString(actualSales)) > 0 && (
                <p className="text-[11px] text-teal-700 font-medium mt-1">
                  ยอดขายรวม: {Number(cleanNumberString(actualSales)).toLocaleString()} บาท
                </p>
              )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ผู้เข้าร่วมกิจกรรมจริง (คน)
            </label>
            <ActivityNumberInput
              id="t9-actual-attendees-input"
              prefix={<Users className="w-4 h-4 text-slate-400" />}
              min={0}
              allowDecimals={false}
              placeholder="ระบุจำนวนผู้เข้าร่วม..."
              value={cleanNumberString(actualAttendees)}
              onChangeValue={(val) =>
                setActualAttendees && setActualAttendees(String(val))
              }
              className="text-xs font-bold text-slate-800 focus:ring-teal-500"
            />
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
