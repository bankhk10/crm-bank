"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Camera, ShoppingBag, Plus, Trash2, Package, Users, ThumbsUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ActivityInput,
  ActivityPhotoUpload,
  ActivityProductSelect,
  type ActivityProductItem,
} from "@/modules/activity/ui";
import { listProductsAction } from "@/modules/products/server/actions";
import { FARMER_FEEDBACK_OPTIONS, type FarmerFeedback } from "../../shared/constants";
import type { Type10SoldProductItem, Type10ImageFile } from "../../shared/types";
import type {
  ActualType10FieldDayProps,
  Type10ActualFormProps,
} from "../types/actual.types";
import { Type10PlanCard } from "./type10-plan-card";

export type {
  ActualType10FieldDayProps,
  Type10ActualFormProps,
};

const EMPTY_PRODUCTS: any[] = [];

export function Type10ActualForm({
  isVisible = true,
  planType,
  target,
  targets,
  actualAttendees,
  setActualAttendees,
  actualSalesOrBooking,
  setActualSalesOrBooking,
  farmerFeedback,
  setFarmerFeedback,
  images = [],
  setImages,
  hasSales = false,
  setHasSales,
  products = EMPTY_PRODUCTS,
  soldProducts,
  setSoldProducts,
}: Type10ActualFormProps) {
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const hasFetchedProductsRef = useRef(false);

  useEffect(() => {
    if (products && products.length > 0) return;
    if (hasFetchedProductsRef.current) return;
    hasFetchedProductsRef.current = true;

    let isMounted = true;
    listProductsAction({ status: "ACTIVE", perPage: 1000 })
      .then((res: any) => {
        if (isMounted && res?.products && Array.isArray(res.products)) {
          setDbProducts(res.products);
        } else if (isMounted && res?.data && Array.isArray(res.data)) {
          setDbProducts(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load products in Type10ActualForm:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [products]);

  const masterProductList = useMemo(() => {
    const source = products && products.length > 0 ? products : dbProducts;
    return source.map((p: any) => {
      if (typeof p === "string") {
        return { id: p, name: p, price: 0 };
      }
      return {
        id: p.id || p.name,
        name: p.name || "",
        productCode: p.productCode || null,
        price: p.price ?? 0,
      };
    });
  }, [products, dbProducts]);

  if (!isVisible) return null;

  const currentSoldProducts = soldProducts || [];

  const handleAddProduct = () => {
    const newItem: Type10SoldProductItem = {
      id: `sold-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: "",
      productName: "",
      actualQty: 1,
      unitPrice: 0,
      actualSales: 0,
    };
    setSoldProducts?.([...currentSoldProducts, newItem]);
  };

  const handleUpdateProduct = (
    index: number,
    field: keyof Type10SoldProductItem,
    value: any,
  ) => {
    const updated = [...currentSoldProducts];
    const item = { ...updated[index], [field]: value };

    // Auto-calculate sales amount when qty or price changes
    if (field === "actualQty" || field === "unitPrice") {
      const qty = Number(field === "actualQty" ? value : item.actualQty) || 0;
      const price = Number(field === "unitPrice" ? value : item.unitPrice) || 0;
      item.actualSales = qty * price;
    }

    updated[index] = item;
    setSoldProducts?.(updated);

    // Auto-sum total sales into actualSalesOrBooking
    const total = updated.reduce(
      (sum, p) => sum + (Number(p.actualSales) || 0),
      0,
    );
    if (total > 0) {
      setActualSalesOrBooking(String(total));
    }
  };

  const handleRemoveProduct = (index: number) => {
    const updated = currentSoldProducts.filter((_, idx) => idx !== index);
    setSoldProducts?.(updated);

    const total = updated.reduce(
      (sum, p) => sum + (Number(p.actualSales) || 0),
      0,
    );
    if (total > 0) {
      setActualSalesOrBooking(String(total));
    }
  };

  return (
    <div className="space-y-5">
      {/* Target Plan Summary */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
          ข้อมูลแผนงานจัดงาน Field Day
        </label>
        {targets && targets.length > 0 ? (
          targets.map((t, idx) => (
            <Type10PlanCard key={t.id || idx} target={t} planType={planType} />
          ))
        ) : (
          <Type10PlanCard target={target} planType={planType} />
        )}
      </div>

      {/* Actual Execution Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              บันทึกผลการจัดงานจริง (Actual Outcome)
            </h4>
            <p className="text-[11px] text-slate-500">
              กรอกจำนวนผู้เข้าร่วมงานจริง ผลตอบรับ และยอดสั่งจอง/จำหน่ายสินค้า
            </p>
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Actual Attendees */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              จำนวนผู้เข้าร่วมงานจริง (คน) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Users className="w-4 h-4" />
              </span>
              <ActivityInput
                type="number"
                min={0}
                placeholder="ระบุจำนวนผู้เข้าร่วมงานจริง..."
                value={actualAttendees || ""}
                onChange={(e) => setActualAttendees(e.target.value)}
                className="h-10 pl-9 text-xs font-bold text-slate-800 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Actual Sales or Booking */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ยอดขายหรือยอดจองจริง (บาท)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
                ฿
              </span>
              <ActivityInput
                type="text"
                placeholder="0.00"
                value={actualSalesOrBooking || ""}
                onChange={(e) => setActualSalesOrBooking(e.target.value)}
                className="h-10 pl-7 text-xs font-bold text-emerald-800 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Farmer Feedback */}
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5 text-slate-500" />
              <span>ผลตอบรับ / ความสนใจของเกษตรกร</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FARMER_FEEDBACK_OPTIONS.map((opt) => {
                const isSelected = farmerFeedback === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFarmerFeedback(opt.value as FarmerFeedback)}
                    className={cn(
                      "py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center",
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
                    )}
                  >
                    {opt.value}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sold / Booked Products Section */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                id="t10-has-sales-toggle"
                type="checkbox"
                checked={Boolean(hasSales || currentSoldProducts.length > 0)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setHasSales?.(checked);
                  if (checked && currentSoldProducts.length === 0) {
                    handleAddProduct();
                  }
                }}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <label
                htmlFor="t10-has-sales-toggle"
                className="text-xs font-bold text-slate-800 cursor-pointer"
              >
                มียอดสั่งจองหรือจำหน่ายสินค้าภายในงาน
              </label>
            </div>

            {(hasSales || currentSoldProducts.length > 0) && (
              <Button
                type="button"
                size="sm"
                onClick={handleAddProduct}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                เพิ่มสินค้า
              </Button>
            )}
          </div>

          {(hasSales || currentSoldProducts.length > 0) && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2 px-3 text-center w-10">ลำดับ</th>
                    <th className="py-2 px-3 min-w-[180px]">รายการสินค้า</th>
                    <th className="py-2 px-3 w-28 text-center">จำนวน</th>
                    <th className="py-2 px-3 w-32 text-center">ราคาต่อหน่วย</th>
                    <th className="py-2 px-3 w-32 text-right">รวม (บาท)</th>
                    <th className="py-2 px-3 text-center w-12">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentSoldProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400">
                        ยังไม่มีรายการสินค้า กดปุ่ม &quot;เพิ่มสินค้า&quot; ด้านบน
                      </td>
                    </tr>
                  ) : (
                    currentSoldProducts.map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2 px-3 text-center font-medium text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-3">
                          <ActivityProductSelect
                            id={`t10-prod-select-${idx}`}
                            triggerClassName="h-8 min-h-[32px] py-0.5 text-xs bg-white border-slate-200 rounded-md text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            value={p.productName}
                            valueKey="name"
                            onChange={(val, pFound) => {
                              handleUpdateProduct(idx, "productName", pFound?.name || val);
                              if (pFound?.id) {
                                handleUpdateProduct(idx, "productId", pFound.id);
                              }
                              if (pFound?.price) {
                                handleUpdateProduct(idx, "unitPrice", pFound.price);
                              }
                            }}
                            products={masterProductList}
                            placeholder="เลือกสินค้า..."
                            searchPlaceholder="ค้นหาสินค้า..."
                            emptyText="ไม่พบสินค้า"
                          />
                        </td>
                        <td className="py-1.5 px-3">
                          <ActivityInput
                            type="number"
                            min={0}
                            placeholder="0"
                            value={p.actualQty ?? ""}
                            onChange={(e) =>
                              handleUpdateProduct(idx, "actualQty", e.target.value)
                            }
                            className="h-8 text-xs text-center font-bold text-slate-800"
                          />
                        </td>
                        <td className="py-1.5 px-3">
                          <ActivityInput
                            type="number"
                            min={0}
                            placeholder="0.00"
                            value={p.unitPrice ?? ""}
                            onChange={(e) =>
                              handleUpdateProduct(idx, "unitPrice", e.target.value)
                            }
                            className="h-8 text-xs text-center font-bold text-slate-800"
                          />
                        </td>
                        <td className="py-1.5 px-3 text-right font-bold text-emerald-800">
                          {Number(p.actualSales || 0).toLocaleString()} ฿
                        </td>
                        <td className="py-1.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(idx)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Photo Upload: Atmosphere */}
        <div className="pt-2 border-t border-slate-100">
          <ActivityPhotoUpload
            title="ภาพถ่ายบรรยากาศการจัดงาน Field Day"
            description="อัปโหลดภาพถ่ายกิจกรรม เกษตรกรผู้เข้าร่วมงาน และบรรยากาศในแปลงสาธิต"
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

export const ActualType10FieldDay = Type10ActualForm;
