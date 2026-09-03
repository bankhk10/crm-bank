"use client";

import React, { useState } from "react";
import { Target, ShoppingBag, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActualTargetCard } from "../actual-target-card";

export interface TargetProductItem {
  id?: string;
  productName: string;
  customer?: string;
  qty: string;
  unitPrice?: string;
  detail?: string;
  unit?: string;
  price?: string;
  actualQty?: string;
  actualSales?: string;
  unclosedReason?: string;
}

export interface Type3ProductSaleDetail {
  id?: string;
  productName: string;
  customer?: string;
  qty?: string;
  unitPrice?: string;
  price?: string;
  actualQty?: string;
  actualSales?: string;
  unclosedReason?: string;
}

function extractUnit(qtyStr?: string): string {
  if (!qtyStr) return "ชิ้น";
  const match = qtyStr.match(/([^\d\s]+)$/);
  return match ? match[1] : "ชิ้น";
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

interface ActualType3SalesProps {
  isVisible: boolean;
  target: {
    product: string;
    customer: string;
    targetQty: string;
    targetSales: string;
    unitPrice?: string;
    detail?: string;
    items?: TargetProductItem[];
  };
  soldProducts: string;
  setSoldProducts: (v: string) => void;
  actualSales: string;
  setActualSales: (v: string) => void;
  actualQuantity: string;
  setActualQuantity: (v: string) => void;
  unclosedReason: string;
  setUnclosedReason: (v: string) => void;
  productSalesDetails?: Type3ProductSaleDetail[];
  setProductSalesDetails?: (v: Type3ProductSaleDetail[]) => void;
}

export function ActualType3Sales({
  isVisible,
  target,
  setSoldProducts,
  actualSales,
  setActualSales,
  actualQuantity,
  setActualQuantity,
  unclosedReason,
  setUnclosedReason,
  productSalesDetails,
  setProductSalesDetails,
}: ActualType3SalesProps) {
  // Local state per product item for multi-product support
  const [productItems, setProductItems] = useState<TargetProductItem[]>(() => {
    if (!target.items || target.items.length === 0) return [];
    return target.items.map((item, idx) => {
      const saved =
        productSalesDetails?.find(
          (d) =>
            (item.id && d.id === item.id) ||
            d.productName === item.productName,
        ) || productSalesDetails?.[idx];

      const fallbackQty = parseProductQty(actualQuantity, item.productName);
      const fallbackReason = parseProductReason(
        unclosedReason,
        item.productName,
      );

      return {
        ...item,
        actualQty:
          saved?.actualQty ?? (fallbackQty || item.actualQty || ""),
        actualSales:
          saved?.actualSales ??
          (target.items!.length === 1 && actualSales
            ? actualSales
            : item.actualSales || ""),
        unclosedReason:
          saved?.unclosedReason ??
          (fallbackReason || item.unclosedReason || ""),
      };
    });
  });

  if (!isVisible) return null;

  const hasMultipleProducts = productItems && productItems.length > 0;

  const handleProductChange = (
    index: number,
    field: "actualQty" | "actualSales" | "unclosedReason",
    value: string,
  ) => {
    const updated = [...productItems];
    updated[index] = { ...updated[index], [field]: value };
    setProductItems(updated);

    if (setProductSalesDetails) {
      setProductSalesDetails(
        updated.map((item) => ({
          id: item.id,
          productName: item.productName,
          customer: item.customer,
          qty: item.qty,
          unitPrice: item.unitPrice,
          price: item.price,
          actualQty: item.actualQty,
          actualSales: item.actualSales,
          unclosedReason: item.unclosedReason,
        })),
      );
    }

    // Sync total sum of actual sales to parent
    const totalSalesSum = updated.reduce(
      (sum, item) => sum + (Number(item.actualSales) || 0),
      0,
    );
    setActualSales(totalSalesSum > 0 ? String(totalSalesSum) : "");

    // Sync concatenated quantities with unit
    const concatQty = updated
      .map(
        (item) =>
          `${item.productName}: ${item.actualQty || "0"} ${
            item.unit || extractUnit(item.qty)
          }`,
      )
      .join(", ");
    setActualQuantity(concatQty);

    // Sync concatenated reasons
    const concatReasons = updated
      .map((item) =>
        item.unclosedReason
          ? `${item.productName}: ${item.unclosedReason}`
          : "",
      )
      .filter(Boolean)
      .join(" | ");
    setUnclosedReason(concatReasons);

    // Sync sold products
    const soldList = updated
      .filter(
        (item) =>
          Number(item.actualQty) > 0 || Number(item.actualSales) > 0,
      )
      .map(
        (item) =>
          `${item.productName} (${item.actualQty || "0"} ${
            item.unit || extractUnit(item.qty)
          })`,
      )
      .join(", ");
    setSoldProducts(soldList);
  };

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-bold text-emerald-900 text-base md:text-lg">
            เสนอขายสินค้า
          </h2>
        </div>
        {hasMultipleProducts && (
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            เป้าหมาย {productItems.length} รายการสินค้า
          </span>
        )}
      </div>

      {/* TARGET SUMMARY CARD */}
      {hasMultipleProducts ? (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-b border-slate-200/60 pb-2.5">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-500">
                ชื่อร้านค้า / Key Farmer:
              </span>
              <p className="font-bold text-slate-900">{target.customer || "-"}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-500">
                รายละเอียดเพิ่มเติม:
              </span>
              <p className="font-medium text-slate-800">
                {target.detail || "-"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-600" />
                รายการสินค้าที่จะเสนอขาย ({productItems.length} รายการ):
              </span>
              {target.targetSales && (
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-md">
                  เป้ายอดขายรวม {target.targetSales}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {productItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      สินค้าที่จะเสนอขาย: {item.productName}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">จำนวน:</span>
                      <span className="font-bold text-slate-800">
                        {item.qty || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">
                        ราคา (บาท):
                      </span>
                      <span className="font-bold text-emerald-700">
                        {item.unitPrice || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <ActualTargetCard
          iconColorClass="text-emerald-600"
          badgeColorClass="bg-emerald-100 text-emerald-800"
          gridColsClass="grid-cols-1 sm:grid-cols-3"
          items={[
            { label: "สินค้าที่จะเสนอขาย:", value: target.product || "-" },
            { label: "ชื่อร้านค้า / Key Farmer:", value: target.customer || "-" },
            { label: "จำนวน:", value: target.targetQty || "-" },
            {
              label: "ราคา (บาท):",
              value: target.unitPrice || "-",
            },
            { label: "รายละเอียดเพิ่มเติม:", value: target.detail || "-" },
          ]}
        />
      )}

      {/* MULTI-PRODUCT ACTUAL RECORDING FORM */}
      {hasMultipleProducts ? (
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              บันทึกผลการเสนอขายจริง (แยกตามสินค้าคนละตัว)
            </label>
            <span className="text-xs text-slate-500 font-medium">
              * กรอกข้อมูลแยกตามสินค้าแต่ละตัว
            </span>
          </div>

          <div className="space-y-3">
            {productItems.map((prod, idx) => {
              const unitName = prod.unit || extractUnit(prod.qty);

              return (
                <div
                  key={idx}
                  className="bg-emerald-50/30 border border-emerald-200/80 rounded-2xl p-4 space-y-3 shadow-2xs"
                >
                  {/* Product Section Title Header */}
                  <div className="flex items-center justify-between border-b border-emerald-100/80 pb-2.5">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-950">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-xs">
                        {idx + 1}
                      </span>
                      <span>สินค้า: {prod.productName}</span>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-md">
                      เป้าหมาย: {prod.qty || "-"} {prod.price ? `(${prod.price})` : ""}
                    </span>
                  </div>

                  {/* Per-Product Inputs: ปริมาณขายจริง (ดึงหน่วยมาใช้อัตโนมัติ) + ยอดขายจริง (บาท) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800">
                        ปริมาณขายจริง (สินค้าที่ {idx + 1}){" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Input
                          type="number"
                          min="0"
                          value={prod.actualQty || ""}
                          onChange={(e) =>
                            handleProductChange(
                              idx,
                              "actualQty",
                              e.target.value,
                            )
                          }
                          placeholder="0"
                          className="bg-white border-slate-300 pr-12"
                        />
                        <span className="absolute right-3 text-xs font-semibold text-slate-500">
                          {unitName}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800">
                        ยอดขายจริง (บาท) (สินค้าที่ {idx + 1}){" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <Input
                          type="number"
                          min="0"
                          value={prod.actualSales || ""}
                          onChange={(e) =>
                            handleProductChange(
                              idx,
                              "actualSales",
                              e.target.value,
                            )
                          }
                          placeholder="0.00"
                          className="bg-white border-slate-300 pr-12"
                        />
                        <span className="absolute right-3 text-xs font-semibold text-slate-500">
                          บาท
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Per-Product Reason: เหตุผล (กรณีไม่สามารถปิดการขายได้ตามเป้า) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      รายละเอียด
                    </label>
                    <Textarea
                      rows={2}
                      value={prod.unclosedReason || ""}
                      onChange={(e) =>
                        handleProductChange(
                          idx,
                          "unclosedReason",
                          e.target.value,
                        )
                      }
                      placeholder={`ระบุเหตุผลสำหรับ ${prod.productName} เช่น ติดปัญหาเครดิตเทอม หรือคู่แข่งเสนอส่วนลดสูงกว่า`}
                      className="bg-white border-slate-300 text-xs"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* TOTAL SUMMARY FOOTER FOR TYPE 3 */}
          <div className="bg-emerald-100/60 border border-emerald-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs md:text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                สรุปรวมผลการเสนอขายจริงทั้งหมด ({productItems.length} สินค้า):
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="bg-white text-slate-800 font-bold px-3 py-1 rounded-lg border border-emerald-200">
                ยอดขายรวมจริง:{" "}
                <span className="text-emerald-700 font-extrabold text-sm">
                  {productItems
                    .reduce(
                      (sum, item) => sum + (Number(item.actualSales) || 0),
                      0,
                    )
                    .toLocaleString()}{" "}
                  บาท
                </span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* SINGLE PRODUCT FALLBACK INPUTS */
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                ปริมาณขายจริง <span className="text-rose-500">*</span>
              </label>
              <Input
                value={actualQuantity}
                onChange={(e) => setActualQuantity(e.target.value)}
                placeholder="เช่น 10 ลัง"
                className="bg-white border-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                ยอดขายจริง (บาท) <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Input
                  type="number"
                  min="0"
                  value={actualSales}
                  onChange={(e) => setActualSales(e.target.value)}
                  placeholder="0.00"
                  className="bg-white border-slate-300 pr-12"
                />
                <span className="absolute right-3 text-xs font-semibold text-slate-500">
                  บาท
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-800">
              เหตุผล (กรณีไม่สามารถปิดการขายได้ตามเป้า)
            </label>
            <Textarea
              rows={2}
              value={unclosedReason}
              onChange={(e) => setUnclosedReason(e.target.value)}
              placeholder="ระบุเหตุผล เช่น ติดปัญหาเครดิตเทอม หรือคู่แข่งเสนอส่วนลดสูงกว่า"
              className="bg-white border-slate-300"
            />
          </div>
        </div>
      )}
    </div>
  );
}
