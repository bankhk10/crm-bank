"use client";

import React, { useState, useEffect } from "react";
import { Target, ShoppingBag, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActualTargetCard } from "../actual-target-card";

export interface TargetProductItem {
  productName: string;
  qty: string;
  price: string;
  actualQty?: string;
  actualSales?: string;
  unclosedReason?: string;
}

interface ActualType3SalesProps {
  isVisible: boolean;
  target: {
    product: string;
    customer: string;
    targetQty: string;
    targetSales: string;
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
}

export function ActualType3Sales({
  isVisible,
  target,
  soldProducts,
  setSoldProducts,
  actualSales,
  setActualSales,
  actualQuantity,
  setActualQuantity,
  unclosedReason,
  setUnclosedReason,
}: ActualType3SalesProps) {
  // Local state per product item for multi-product support
  const [productItems, setProductItems] = useState<TargetProductItem[]>(
    target.items || []
  );

  // Initialize per-product values when target.items changes or sample data pre-filled
  useEffect(() => {
    if (target.items && target.items.length > 0) {
      setProductItems(
        target.items.map((item, idx) => ({
          ...item,
          actualQty:
            idx === 0
              ? "20 ลัง"
              : idx === 1
              ? "10 ลัง"
              : item.actualQty || "",
          actualSales:
            idx === 0
              ? "10000"
              : idx === 1
              ? "7500"
              : item.actualSales || "",
          unclosedReason:
            item.unclosedReason ||
            "ปิดการขายได้สำเร็จตามเป้าหมาย",
        }))
      );
    }
  }, [target.items]);

  if (!isVisible) return null;

  const hasMultipleProducts = productItems && productItems.length > 0;

  const handleProductChange = (
    index: number,
    field: "actualQty" | "actualSales" | "unclosedReason",
    value: string
  ) => {
    const updated = [...productItems];
    updated[index] = { ...updated[index], [field]: value };
    setProductItems(updated);

    // Sync total sum of actual sales to parent
    const totalSalesSum = updated.reduce(
      (sum, item) => sum + (Number(item.actualSales) || 0),
      0
    );
    setActualSales(totalSalesSum > 0 ? String(totalSalesSum) : "");

    // Sync concatenated quantities
    const concatQty = updated
      .map((item) => `${item.productName}: ${item.actualQty || "0"}`)
      .join(", ");
    setActualQuantity(concatQty);

    // Sync concatenated reasons
    const concatReasons = updated
      .map((item) =>
        item.unclosedReason ? `${item.productName}: ${item.unclosedReason}` : ""
      )
      .filter(Boolean)
      .join(" | ");
    setUnclosedReason(concatReasons);
  };

  return (
    <div className="border-2 border-emerald-600 rounded-2xl p-4 md:p-6 bg-white space-y-5 shadow-xs">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm shadow-2xs">
            3
          </span>
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
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-600" />
              เป้าหมายที่ตั้งไว้ตอนสร้างแผน ({productItems.length} รายการ):
            </span>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-md">
              เป้ายอดขายรวม {target.targetSales}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {productItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs space-y-1"
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    {item.productName}
                  </span>
                  <span className="text-emerald-700 font-bold">
                    {item.price}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-100 pt-1">
                  <span>เป้าหมายปริมาณ:</span>
                  <span className="font-bold text-slate-800">{item.qty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ActualTargetCard
          iconColorClass="text-emerald-600"
          badgeColorClass="bg-emerald-100 text-emerald-800"
          items={[
            { label: "สินค้าเสนอขาย:", value: target.product },
            { label: "เป้าหมายปริมาณ:", value: target.targetQty },
            { label: "เป้ายอดขาย:", value: target.targetSales, highlight: true },
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
            {productItems.map((prod, idx) => (
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
                    เป้าหมาย: {prod.qty} ({prod.price})
                  </span>
                </div>

                {/* Per-Product Inputs: ปริมาณขายจริง + ยอดขายจริง (บาท) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      ปริมาณขายจริง (สินค้าที่ {idx + 1}){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={prod.actualQty || ""}
                      onChange={(e) =>
                        handleProductChange(idx, "actualQty", e.target.value)
                      }
                      placeholder="เช่น 20 ลัง"
                      className="bg-white border-slate-300"
                    />
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
                          handleProductChange(idx, "actualSales", e.target.value)
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
                    เหตุผล (กรณีไม่สามารถปิดการขายสินค้าตัวนี้ได้ตามเป้า)
                  </label>
                  <Textarea
                    rows={2}
                    value={prod.unclosedReason || ""}
                    onChange={(e) =>
                      handleProductChange(idx, "unclosedReason", e.target.value)
                    }
                    placeholder={`ระบุเหตุผลสำหรับ ${prod.productName} เช่น ติดปัญหาเครดิตเทอม หรือคู่แข่งเสนอส่วนลดสูงกว่า`}
                    className="bg-white border-slate-300 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* TOTAL SUMMARY FOOTER FOR TYPE 3 */}
          <div className="bg-emerald-100/60 border border-emerald-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs md:text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>สรุปรวมผลการเสนอขายจริงทั้งหมด ({productItems.length} สินค้า):</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="bg-white text-slate-800 font-bold px-3 py-1 rounded-lg border border-emerald-200">
                ยอดขายรวมจริง:{" "}
                <span className="text-emerald-700 font-extrabold text-sm">
                  {productItems
                    .reduce(
                      (sum, item) => sum + (Number(item.actualSales) || 0),
                      0
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
