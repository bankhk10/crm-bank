"use client";

import React from "react";
import { Store, ShoppingBag, ImageIcon } from "lucide-react";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";
import { ImageFile } from "@/modules/activity-plans/features/actual-view/types";

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

interface DetailType9StoreProps {
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
  actualSales?: string;
  actualAttendees?: string;
  productSalesDetails?: Type9ProductSaleDetail[];
  images?: ImageFile[];
}

export function DetailType9Store({
  isVisible,
  target,
  actualSales,
  actualAttendees,
  productSalesDetails = [],
  images = [],
}: DetailType9StoreProps) {
  if (!isVisible) return null;

  const hasMultipleProducts = target.items && target.items.length > 0;

  const effectiveSalesList =
    hasMultipleProducts
      ? target.items!.map((item, idx) => {
          const saved = productSalesDetails?.find(
            (d) => (item.id && d.id === item.id) || d.productName === item.productName,
          ) || productSalesDetails?.[idx];
          return {
            productName: item.productName,
            targetQty: item.quantityCases ? `${item.quantityCases} ลัง` : "-",
            targetSales: item.totalAmount ? `฿${item.totalAmount.toLocaleString()}` : "-",
            actualQty: saved?.actualQuantityCases ?? item.actualQuantityCases ?? "-",
            actualSales: saved?.actualSales ?? item.actualSales ?? "-",
          };
        })
      : [];

  return (
    <div className="border border-teal-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-teal-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
            <Store className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-teal-900 text-base md:text-lg">
            จัดกิจกรรมส่งเสริมการขายหน้าร้าน
          </h2>
        </div>
      </div>

      {/* PLANNED TARGET CARD */}
      <ActualTargetCard
        iconColorClass="text-teal-600"
        badgeColorClass="bg-teal-50 text-teal-800 border border-teal-200"
        gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
        items={[
          { label: "ร้านค้าเป้าหมาย:", value: target.store || "-" },
          ...(target.subDealerStore
            ? [{ label: "ร้านค้าซับดีลเลอร์:", value: target.subDealerStore }]
            : []),
          { label: "สินค้าเป้าหมาย:", value: target.product || "-" },
          {
            label: "เป้ายอดขาย:",
            value: target.targetSales ? `฿${target.targetSales}` : "-",
            highlight: true,
          },
          ...(target.targetAttendees
            ? [{ label: "เป้าหมายผู้เข้าร่วม:", value: `${target.targetAttendees} คน` }]
            : []),
        ]}
      />

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-teal-500"></span>
          <span>ผลการจัดกิจกรรมหน้าร้านจริง</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-teal-700 font-medium block">
              ยอดขายที่ทำได้จริง
            </span>
            <span className="text-sm sm:text-base font-extrabold text-teal-950 block">
              {actualSales ? `฿${Number(actualSales.replace(/,/g, "")).toLocaleString()} บาท` : "-"}
            </span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              จำนวนผู้เข้าร่วมกิจกรรมจริง
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-800 block">
              {actualAttendees ? `${actualAttendees} คน` : "-"}
            </span>
          </div>

          {/* MULTI PRODUCTS BREAKDOWN TABLE */}
          {hasMultipleProducts && (
            <div className="sm:col-span-2 space-y-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-teal-600" />
                รายละเอียดการขายสินค้าตามเป้าหมาย
              </span>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">ลำดับ</th>
                      <th className="py-2.5 px-3">ชื่อสินค้า</th>
                      <th className="py-2.5 px-3 text-center">เป้าจำนวน</th>
                      <th className="py-2.5 px-3 text-right">เป้ายอดขาย</th>
                      <th className="py-2.5 px-3 text-center bg-teal-50/50">ขายจริง (ลัง)</th>
                      <th className="py-2.5 px-3 text-right bg-teal-50/50">ยอดขายจริง (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {effectiveSalesList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40">
                        <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {item.productName}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600">
                          {item.targetQty}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                          {item.targetSales}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-teal-800 bg-teal-50/30">
                          {item.actualQty || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-teal-900 bg-teal-50/30">
                          {item.actualSales && item.actualSales !== "-"
                            ? `฿${Number(String(item.actualSales).replace(/,/g, "")).toLocaleString()}`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* STORE IMAGES (READ-ONLY) */}
        {images.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
              ภาพถ่ายกิจกรรมส่งเสริมการขายหน้าร้าน
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 aspect-video flex items-center justify-center shadow-2xs"
                >
                  <img
                    src={img.url}
                    alt={img.name || "Store Activity Image"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
