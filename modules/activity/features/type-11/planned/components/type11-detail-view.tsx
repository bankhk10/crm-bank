"use client";

import React, { useState, useMemo } from "react";
import { Package, ArrowRight, Camera, Eye, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ImageLightboxModal,
  LightboxImage,
} from "@/components/custom/image-lightbox-modal";
import { Type11PlanCard } from "./type11-plan-card";
import type { Type11StockItem, Type11ImageFile } from "../../shared/types";
import type {
  DetailType11StockProps,
  Type11DetailViewProps,
} from "../types/actual.types";

export type { DetailType11StockProps, Type11DetailViewProps };

export function Type11DetailView({
  isVisible = true,
  target,
  targets,
  productList = "",
  remainingQty = "",
  remarks = "",
  stockItems = [],
  nextAction,
  images = [],
}: DetailType11StockProps) {
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
    imgs: Type11ImageFile[] = [],
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

  const groupedByStore = useMemo(() => {
    if (!stockItems || stockItems.length === 0) return null;
    const groups: Array<{
      storeId?: string | null;
      storeName: string;
      items: Type11StockItem[];
    }> = [];
    const map = new Map<
      string,
      { storeId?: string | null; storeName: string; items: Type11StockItem[] }
    >();

    stockItems.forEach((item) => {
      const key = item.storeId || item.storeName || "default";
      const sName = item.storeName || "ร้านค้า";
      if (!map.has(key)) {
        const groupObj = {
          storeId: item.storeId,
          storeName: sName,
          items: [] as Type11StockItem[],
        };
        map.set(key, groupObj);
        groups.push(groupObj);
      }
      map.get(key)!.items.push(item);
    });

    return groups;
  }, [stockItems]);

  if (!isVisible) return null;

  return (
    <div className="border border-slate-300 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
            <Package className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-slate-900 text-base md:text-lg">
            ตรวจเช็คสต๊อกหน้าร้าน
          </h2>
        </div>
      </div>

      {/* PLANNED TARGET CARDS */}
      {targets && targets.length > 0 ? (
        <div className="space-y-4">
          {targets.map((t, idx) => (
            <Type11PlanCard key={t.id || idx} target={t} />
          ))}
        </div>
      ) : target ? (
        <Type11PlanCard target={target} />
      ) : null}

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-4 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-teal-600"></span>
          <span>ผลการตรวจเช็คสต๊อกจริง</span>
        </div>

        {/* STOCK TABLE OR FALLBACK */}
        {groupedByStore && groupedByStore.length > 0 ? (
          <div className="space-y-4">
            {groupedByStore.map((group, gIdx) => (
              <div
                key={`${group.storeId || group.storeName}-${gIdx}`}
                className="space-y-2 rounded-xl border border-slate-200 p-3.5 bg-slate-50/50"
              >
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-teal-600" />
                    ร้าน: {group.storeName} ({group.items.length} รายการ)
                  </span>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10">ลำดับ</th>
                        <th className="py-2.5 px-3">ชื่อสินค้า</th>
                        <th className="py-2.5 px-3 text-center w-28">
                          จำนวนคงเหลือ
                        </th>
                        <th className="py-2.5 px-3 text-center w-28">
                          สถานะสต็อก
                        </th>
                        <th className="py-2.5 px-3 text-center w-36">
                          โอกาสสั่งซื้อรอบใหม่
                        </th>
                        <th className="py-2.5 px-3">ข้อสังเกต / หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.items.map((item, idx) => (
                        <tr
                          key={item.id || idx}
                          className="hover:bg-slate-50/40"
                        >
                          <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {item.productName}
                            {item.productCode && (
                              <span className="ml-2 text-[10px] text-slate-500 font-normal">
                                ({item.productCode})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                            {item.remainingQty ?? "-"}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {item.stockStatus ? (
                              <Badge
                                variant="outline"
                                className={
                                  item.stockStatus === "ขาดสต็อก"
                                    ? "bg-red-50 text-red-800 border-red-300 font-bold text-[11px]"
                                    : item.stockStatus === "ใกล้หมด"
                                      ? "bg-amber-50 text-amber-800 border-amber-300 font-bold text-[11px]"
                                      : "bg-teal-50 text-teal-800 border-teal-300 font-bold text-[11px]"
                                }
                              >
                                {item.stockStatus}
                              </Badge>
                            ) : (
                              <span className="text-slate-400 font-normal">
                                -
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {item.reorderOpportunity ? (
                              <Badge
                                variant="outline"
                                className={
                                  item.reorderOpportunity === "สูง"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-[11px]"
                                    : item.reorderOpportunity === "ยังไม่แน่ใจ"
                                      ? "bg-amber-50 text-amber-800 border-amber-300 font-bold text-[11px]"
                                      : "bg-slate-100 text-slate-800 border-slate-300 font-bold text-[11px]"
                                }
                              >
                                {item.reorderOpportunity}
                              </Badge>
                            ) : (
                              <span className="text-slate-400 font-normal">
                                -
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {item.remarks || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : productList ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-slate-500 font-medium block">
                สินค้าที่ตรวจสต็อก
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
                {productList}
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-slate-500 font-medium block">
                จำนวนคงเหลือ
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                {remainingQty || "-"}
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-slate-500 font-medium block">
                หมายเหตุ
              </span>
              <span className="text-xs sm:text-sm text-slate-700 block">
                {remarks || "-"}
              </span>
            </div>
          </div>
        ) : null}

        {/* NEXT ACTION */}
        {nextAction ? (
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-slate-400" />
              สิ่งที่ต้องดำเนินการต่อ
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {nextAction}
            </span>
          </div>
        ) : null}

        {/* PHOTOS GALLERY */}
        {images && images.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-teal-600" />
              <span>รูปภาพการตรวจเช็คสต๊อกหน้าร้าน ({images.length} รูป)</span>
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {images.map((img, idx) => (
                <div
                  key={img.id || idx}
                  onClick={() =>
                    openLightbox("รูปภาพการตรวจเช็คสต๊อกหน้าร้าน", images, idx)
                  }
                  className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-xs transition-all"
                >
                  <img
                    src={img.url}
                    alt={img.name || "ภาพสต็อกสินค้า"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
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

export { Type11DetailView as DetailType11Stock };
