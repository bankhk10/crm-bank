"use client";

import React, { useState } from "react";
import { Store, ShoppingBag, ImageIcon, Camera, Eye, Users, Package } from "lucide-react";
import {
  ImageLightboxModal,
  LightboxImage,
} from "@/components/custom/image-lightbox-modal";
import { Type9PlanCard } from "./type9-plan-card";
import type { Type9ImageFile } from "../../shared/types";
import type {
  DetailType9StoreProps,
  Type9DetailViewProps,
} from "../types/actual.types";

export type {
  DetailType9StoreProps,
  Type9DetailViewProps,
};

export function Type9DetailView({
  isVisible = true,
  target,
  targets,
  actualSales,
  actualAttendees,
  productSalesDetails = [],
  images = [],
}: DetailType9StoreProps) {
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    title: string;
    images: LightboxImage[];
    initialIndex: number;
  }>({
    isOpen: false,
    title: "",
    images: [],
    initialIndex: 0,
  });

  const openLightbox = (
    title: string,
    imgs: Type9ImageFile[] = [],
    initialIndex: number = 0,
  ) => {
    if (!imgs || imgs.length === 0) return;
    setLightboxState({
      isOpen: true,
      title,
      images: imgs.map((img) => ({
        id: img.id,
        url: img.url,
        name: img.name,
      })),
      initialIndex,
    });
  };

  const closeLightbox = () => {
    setLightboxState((prev) => ({ ...prev, isOpen: false }));
  };

  if (!isVisible) return null;

  const allItems =
    targets && targets.length > 0
      ? targets.flatMap((t) => t.items || [])
      : target?.items || [];
  const hasMultipleProducts = allItems.length > 0;

  const effectiveSalesList = hasMultipleProducts
    ? allItems.map((item, idx) => {
        const saved =
          productSalesDetails.find(
            (d) =>
              (item.id && d.id === item.id) ||
              (item.productId &&
                (d.productId === item.productId || d.id === item.productId)) ||
              d.productName === item.productName,
          ) || productSalesDetails[idx];

        return {
          ...item,
          actualQuantityCases:
            saved?.actualQuantityCases ?? item.actualQuantityCases ?? "-",
          actualSales: saved?.actualSales ?? item.actualSales ?? "-",
        };
      })
    : productSalesDetails;

  return (
    <div className="border border-teal-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-teal-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
            <Store className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-teal-900 text-base md:text-lg">
            จัดกิจกรรมส่งเสริมการขายหน้าร้าน (Type 9)
          </h2>
        </div>
      </div>

      {/* PLANNED TARGET CARD */}
      {targets && targets.length > 0 ? (
        <div className="space-y-4">
          {targets.map((t, idx) => (
            <Type9PlanCard key={t.id || idx} target={t} hideItemsTable />
          ))}
        </div>
      ) : (
        <Type9PlanCard target={target} hideItemsTable />
      )}

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-4 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-teal-500"></span>
          <span>ผลการจัดกิจกรรมส่งเสริมการขายจริง</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              ยอดขายหน้าร้านจริงรวม
            </span>
            <span className="text-sm sm:text-base font-extrabold text-teal-900 block">
              {actualSales ? `${Number(String(actualSales).replace(/,/g, "")).toLocaleString()} บาท` : "-"}
            </span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              ผู้เข้าร่วมกิจกรรมจริง
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-800 block">
              {actualAttendees ? `${actualAttendees} คน` : "-"}
            </span>
          </div>
        </div>

        {/* Product Sales Details Table (Read-Only) */}
        {effectiveSalesList && effectiveSalesList.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Package className="w-3.5 h-3.5 text-teal-600" />
              <span>ผลการขายแยกตามรายการสินค้า</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                  <tr>
                    <th className="py-2 px-3">สินค้า</th>
                    <th className="py-2 px-3 text-center">เป้าหมาย (ลัง)</th>
                    <th className="py-2 px-3 text-center">ขายได้จริง (ลัง)</th>
                    <th className="py-2 px-3 text-right">ยอดขายจริง (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {effectiveSalesList.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-medium text-slate-800">
                        {item.productName}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-500">
                        {item.quantityCases != null ? `${item.quantityCases}` : "-"}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-teal-800">
                        {item.actualQuantityCases != null && item.actualQuantityCases !== ""
                          ? `${item.actualQuantityCases}`
                          : "-"}
                      </td>
                      <td className="py-2 px-3 text-right font-extrabold text-emerald-700">
                        {item.actualSales != null && item.actualSales !== ""
                          ? `${Number(String(item.actualSales).replace(/,/g, "")).toLocaleString()} ฿`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Images Gallery */}
        {images && images.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Camera className="w-3.5 h-3.5 text-teal-600" />
              <span>ภาพถ่ายบรรยากาศการจัดกิจกรรมหน้าร้าน ({images.length} ภาพ)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {images.map((img, idx) => (
                <div
                  key={img.id || idx}
                  onClick={() => openLightbox("ภาพถ่ายบรรยากาศการจัดกิจกรรมหน้าร้าน", images, idx)}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer hover:shadow-md transition-all"
                >
                  <img
                    src={img.url}
                    alt={img.name || `ภาพที่ ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white drop-shadow-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ImageLightboxModal
        isOpen={lightboxState.isOpen}
        onClose={closeLightbox}
        title={lightboxState.title}
        images={lightboxState.images}
        initialIndex={lightboxState.initialIndex}
      />
    </div>
  );
}

// Backward-compatible alias
export const DetailType9Store = Type9DetailView;
