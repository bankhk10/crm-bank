"use client";

import React from "react";
import { ShoppingBag, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";

export interface TargetProductItem {
  id?: string;
  productId?: string;
  productName: string;
  customer?: string;
  isSubDealer?: boolean;
  subDealerStore?: string;
  dealerName?: string;
  qty: string;
  detail?: string;
  notes?: string;
  unit?: string;
  unitPrice?: string;
  price?: string;
  targetSales?: string;
  actualQty?: string;
  actualSales?: string;
  unclosedReason?: string;
  isAdditional?: boolean;
}

export interface Type3ProductSaleDetail {
  id?: string;
  productId?: string;
  productName: string;
  customer?: string;
  storeId?: string;
  qty?: string;
  unitPrice?: string;
  price?: string;
  actualQty?: string;
  actualSales?: string;
  unclosedReason?: string;
  isAdditional?: boolean;
}

function parseProductQty(
  actualQuantityText: string | undefined,
  productName: string,
): string {
  if (!actualQuantityText) return "";
  const escaped = productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `(?:^|,\\s*)${escaped}:\\s*(\\d+(?:\\.\\d+)?)[^,]*`,
    "i",
  );
  const match = actualQuantityText.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  if (!actualQuantityText.includes(":") && !actualQuantityText.includes(",")) {
    const numMatch = actualQuantityText.match(/\d+(?:\.\d+)?/);
    return numMatch ? numMatch[0] : "";
  }
  return "";
}

function parseProductReason(
  unclosedReasonText: string | undefined,
  productName: string,
): string {
  if (!unclosedReasonText) return "";
  const escaped = productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?:^|\\|\\s*)${escaped}:\\s*([^|]+)`, "i");
  const match = unclosedReasonText.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  if (!unclosedReasonText.includes(":") && !unclosedReasonText.includes("|")) {
    return unclosedReasonText.trim();
  }
  return "";
}

interface DetailType3SalesProps {
  isVisible: boolean;
  target: {
    product: string;
    customer: string;
    isSubDealer?: boolean;
    subDealerStore?: string;
    dealerName?: string;
    targetQty: string;
    targetSales?: string;
    unitPrice?: string;
    detail?: string;
    items?: TargetProductItem[];
  };
  soldProducts?: string;
  actualSales?: string;
  actualQuantity?: string;
  unclosedReason?: string;
  productSalesDetails?: Type3ProductSaleDetail[];
}

export function DetailType3Sales({
  isVisible,
  target,
  soldProducts,
  actualSales,
  actualQuantity,
  unclosedReason,
  productSalesDetails,
}: DetailType3SalesProps) {
  if (!isVisible) return null;

  // Planned items from plan target (or single target fallback)
  const plannedItems: TargetProductItem[] =
    target.items && target.items.length > 0
      ? target.items
      : target.product
        ? [
            {
              id: "planned-single",
              productName: target.product,
              customer: target.customer,
              isSubDealer: target.isSubDealer,
              subDealerStore: target.subDealerStore,
              dealerName: target.dealerName,
              qty: target.targetQty,
              unitPrice: target.unitPrice,
              detail: target.detail,
              isAdditional: false,
            },
          ]
        : [];

  // Additional items (สินค้านอกแผน)
  const additionalItems: Type3ProductSaleDetail[] =
    productSalesDetails?.filter((d) => d.isAdditional) || [];

  const hasTableItems = plannedItems.length > 0 || additionalItems.length > 0;

  // Target Qty Sum (only planned items have target qty)
  const totalTargetQtySum = plannedItems.reduce(
    (sum, i) =>
      sum + (Number(String(i.qty || "").replace(/[^0-9.-]+/g, "")) || 0),
    0,
  );

  // Calculate actual quantities and sales
  let totalActualQtySum = 0;
  let totalActualSalesSum = 0;

  // 1. Process planned items
  const processedPlanned = plannedItems.map((item, idx) => {
    const saved =
      productSalesDetails?.find(
        (d) =>
          !d.isAdditional &&
          ((item.id && d.id === item.id) ||
            (item.productId && d.productId === item.productId) ||
            d.productName === item.productName),
      ) || productSalesDetails?.filter((d) => !d.isAdditional)?.[idx];

    const fallbackQty = parseProductQty(actualQuantity, item.productName);
    const fallbackReason = parseProductReason(unclosedReason, item.productName);

    const rawActualQty =
      saved?.actualQty ?? (fallbackQty !== "" ? fallbackQty : item.actualQty);
    const rawActualSales = saved?.actualSales ?? item.actualSales;
    const displayReason =
      saved?.unclosedReason ??
      (fallbackReason || item.unclosedReason || "-");

    const qtyNum =
      rawActualQty !== undefined && rawActualQty !== ""
        ? Number(String(rawActualQty).replace(/[^0-9.-]+/g, ""))
        : 0;
    if (!isNaN(qtyNum)) totalActualQtySum += qtyNum;

    const salesNum =
      rawActualSales !== undefined && rawActualSales !== ""
        ? Number(String(rawActualSales).replace(/[^0-9.-]+/g, ""))
        : 0;
    if (!isNaN(salesNum)) totalActualSalesSum += salesNum;

    return {
      item,
      rawActualQty,
      rawActualSales,
      displayReason,
    };
  });

  // 2. Process additional items
  const processedAdditional = additionalItems.map((item) => {
    const qtyNum =
      item.actualQty !== undefined && item.actualQty !== ""
        ? Number(String(item.actualQty).replace(/[^0-9.-]+/g, ""))
        : 0;
    if (!isNaN(qtyNum)) totalActualQtySum += qtyNum;

    const salesNum =
      item.actualSales !== undefined && item.actualSales !== ""
        ? Number(String(item.actualSales).replace(/[^0-9.-]+/g, ""))
        : 0;
    if (!isNaN(salesNum)) totalActualSalesSum += salesNum;

    return {
      item,
      rawActualQty: item.actualQty,
      rawActualSales: item.actualSales,
      displayReason: item.unclosedReason || "-",
    };
  });

  // If actualSales prop was passed and totalActualSalesSum is still 0
  if (totalActualSalesSum === 0 && actualSales) {
    const parsedSales = Number(String(actualSales).replace(/[^0-9.-]+/g, ""));
    if (!isNaN(parsedSales) && parsedSales > 0) {
      totalActualSalesSum = parsedSales;
    }
  }

  const hasActualRecord = Boolean(
    (productSalesDetails && productSalesDetails.length > 0) ||
      actualQuantity ||
      actualSales ||
      unclosedReason,
  );

  return (
    <div className="border border-blue-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-blue-900 text-base md:text-lg">
              เสนอขายสินค้า
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              รายละเอียดแผนงานและผลการปฏิบัติงานจริง
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {plannedItems.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
              เป้าหมายตามแผน {plannedItems.length} รายการ
            </span>
          )}
          {additionalItems.length > 0 && (
            <span className="text-xs bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-purple-200">
              + สินค้านอกแผน {additionalItems.length} รายการ
            </span>
          )}
        </div>
      </div>

      {/* TABLE OF PRODUCTS (PLANNED & ADDITIONAL SEPARATED) */}
      {hasTableItems ? (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                  <th className="py-2.5 px-3 w-28">ประเภท</th>
                  <th className="py-2.5 px-3">สินค้า</th>
                  <th className="py-2.5 px-3">ร้านค้า (Dealer / Subdealer)</th>
                  <th className="py-2.5 px-3 text-center">เป้าจำนวน</th>
                  <th className="py-2.5 px-3">รายละเอียด</th>
                  <th className="py-2.5 px-3 text-center bg-blue-50/50">
                    ขายได้จริง (จำนวน)
                  </th>
                  <th className="py-2.5 px-3">เหตุผล / ข้อเสนอ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* 1. PLANNED ITEMS */}
                {processedPlanned.map(({ item, rawActualQty, displayReason }, idx) => {
                  const targetQtyVal =
                    item.qty !== "" && item.qty != null ? `${item.qty} หน่วย` : "-";
                  const detailVal = item.notes || item.detail || "-";
                  const displayActualQty =
                    rawActualQty !== undefined && rawActualQty !== ""
                      ? `${rawActualQty} หน่วย`
                      : "-";

                  const isSub = Boolean(item.isSubDealer || item.subDealerStore);

                  return (
                    <tr key={item.id || `plan-${idx}`} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold"
                        >
                          ตามแผน
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {item.productName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {isSub ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                              <Badge
                                variant="outline"
                                className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold"
                              >
                                Subdealer
                              </Badge>
                              <span>{item.subDealerStore}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Dealer: {item.dealerName || item.customer || "-"}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 font-medium text-slate-800">
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-800 border-blue-300 text-[10px] font-bold"
                            >
                              Dealer
                            </Badge>
                            <span>{item.customer || target.customer || "-"}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium text-slate-800">
                        {targetQtyVal}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium whitespace-pre-wrap max-w-xs">
                        {detailVal}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-blue-900 bg-blue-50/30">
                        {displayActualQty}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 whitespace-pre-wrap">
                        {displayReason}
                      </td>
                    </tr>
                  );
                })}

                {/* 2. ADDITIONAL ITEMS (สินค้านอกแผน) */}
                {processedAdditional.map(({ item, rawActualQty, displayReason }, idx) => {
                  const displayActualQty =
                    rawActualQty !== undefined && rawActualQty !== ""
                      ? `${rawActualQty} หน่วย`
                      : "-";

                  return (
                    <tr
                      key={item.id || `add-${idx}`}
                      className="bg-purple-50/20 hover:bg-purple-50/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center text-purple-700 font-bold">
                        +{idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant="outline"
                          className="bg-purple-100 text-purple-800 border-purple-300 text-[10px] font-bold"
                        >
                          + สินค้านอกแผน
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-purple-950">
                        {item.productName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <span className="text-slate-600">
                          {item.customer || target.customer || "-"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                        -
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-medium">
                        -
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-purple-900 bg-purple-50/40">
                        {displayActualQty}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-pre-wrap">
                        {displayReason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50/95 border-t-2 border-slate-200 text-xs font-bold">
                <tr>
                  <td
                    colSpan={4}
                    className="py-2.5 px-3 text-left text-slate-700 font-bold"
                  >
                    รวมทั้งสิ้น ({plannedItems.length + additionalItems.length} รายการ):
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-900 font-bold">
                    {totalTargetQtySum > 0
                      ? `${totalTargetQtySum.toLocaleString()} หน่วย`
                      : "-"}
                  </td>
                  <td></td>
                  <td className="py-2.5 px-3 text-center text-blue-900 font-extrabold bg-blue-50/60">
                    {hasActualRecord ? `${totalActualQtySum.toLocaleString()} หน่วย` : "-"}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* SUMMARY STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold block">
                เป้าจำนวนรวม (ตามแผน)
              </span>
              <span className="text-sm font-bold text-slate-900 block">
                {totalTargetQtySum > 0
                  ? `${totalTargetQtySum.toLocaleString()} หน่วย`
                  : "-"}
              </span>
            </div>

            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-blue-700 font-semibold block">
                  ขายได้จริงรวม (จำนวน)
                </span>
                {additionalItems.length > 0 && (
                  <span className="text-[10px] text-purple-700 font-bold bg-purple-100/80 px-1.5 py-0.5 rounded">
                    +นอกแผน {additionalItems.length}
                  </span>
                )}
              </div>
              <span className="text-sm font-bold text-blue-900 block">
                {hasActualRecord
                  ? `${totalActualQtySum.toLocaleString()} หน่วย`
                  : "-"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* SIMPLE FALLBACK VIEW */
        <div className="space-y-3 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ผลการปฏิบัติงานจริง</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-slate-500 font-medium block">
                รายการสินค้าที่ขายได้
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
                {soldProducts || target.product || "-"}
              </span>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-slate-500 font-medium block">
                จำนวนที่ขายได้จริง
              </span>
              <span className="text-xs sm:text-sm font-bold text-blue-700 block">
                {actualQuantity ? `${actualQuantity} หน่วย` : "-"}
              </span>
            </div>

            {unclosedReason && (
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-1 sm:col-span-2">
                <span className="text-xs text-amber-700 font-medium block flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  เหตุผล / ข้อเสนอที่ไม่สามารถปิดการขายได้
                </span>
                <p className="text-xs sm:text-sm text-amber-900 font-semibold whitespace-pre-wrap leading-relaxed">
                  {unclosedReason}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
