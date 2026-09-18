"use client";

import React, { useState } from "react";
import { Store, ShoppingBag, ImageIcon, Camera, Eye } from "lucide-react";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";
import { ImageFile } from "@/modules/activity-plans/features/actual-view/types";
import {
  ImageLightboxModal,
  LightboxImage,
} from "@/components/custom/image-lightbox-modal";

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
    imgs: ImageFile[] = [],
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

  const hasMultipleProducts = target.items && target.items.length > 0;

  const effectiveSalesList = hasMultipleProducts
    ? target.items!.map((item, idx) => {
        const saved =
          productSalesDetails?.find(
            (d) =>
              (item.id && d.id === item.id) ||
              d.productName === item.productName,
          ) || productSalesDetails?.[idx];
        return {
          productName: item.productName,
          targetQty: item.quantityCases ? `${item.quantityCases} ลัง` : "-",
          targetSales: item.totalAmount
            ? `฿${item.totalAmount.toLocaleString()}`
            : "-",
          actualQty:
            saved?.actualQuantityCases ?? item.actualQuantityCases ?? "-",
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
            ? [
                {
                  label: "เป้าหมายผู้เข้าร่วม:",
                  value: `${target.targetAttendees} คน`,
                },
              ]
            : []),
        ]}
      />

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mt-4">
          <span className="w-2 h-2 rounded-full bg-teal-500"></span>
          <span>ผลการจัดกิจกรรมส่งเสริมการขายหน้าร้านจริง</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-teal-700 font-medium block">
              ยอดขายจริงรวมทั้งหมด
            </span>
            <span className="text-sm sm:text-base font-extrabold text-teal-950 block">
              {actualSales ? `฿${actualSales} บาท` : "-"}
            </span>
          </div>

          {actualAttendees && (
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-slate-500 font-medium block">
                จำนวนผู้เข้าร่วมจริง
              </span>
              <span className="text-sm sm:text-base font-extrabold text-slate-800 block">
                {actualAttendees} คน
              </span>
            </div>
          )}

          {/* MULTI-PRODUCT SALES DETAILS TABLE (IF ANY) */}
          {effectiveSalesList.length > 0 && (
            <div className="sm:col-span-2 space-y-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-teal-600" />
                รายละเอียดการขายรายสินค้า
              </span>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">ลำดับ</th>
                      <th className="py-2.5 px-3">ชื่อสินค้า</th>
                      <th className="py-2.5 px-3 text-center w-24">
                        เป้าจำนวน
                      </th>
                      <th className="py-2.5 px-3 text-right w-28">
                        เป้ายอดขาย
                      </th>
                      <th className="py-2.5 px-3 text-center w-24 bg-teal-50/30">
                        ขายได้จริง
                      </th>
                      <th className="py-2.5 px-3 text-right w-32 bg-teal-50/30">
                        ยอดขายจริง (บาท)
                      </th>
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
                        <td className="py-2.5 px-3 text-right text-slate-600 font-medium">
                          {item.targetSales}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-teal-900 bg-teal-50/20">
                          {item.actualQty !== "-"
                            ? `${item.actualQty} ลัง`
                            : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-teal-950 bg-teal-50/20">
                          {item.actualSales !== "-"
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

        {/* STORE IMAGES (READ-ONLY LIGHTBOX) */}
        <div className="bg-teal-50/20 border border-teal-200/70 rounded-2xl p-4 sm:p-4.5 space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-teal-100/80 pb-2">
            <span className="text-xs sm:text-sm font-bold text-teal-950 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-teal-600" />
              ภาพถ่ายกิจกรรมส่งเสริมการขายหน้าร้าน
            </span>
            {images && images.length > 0 ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                {images.length} รูป
              </span>
            ) : null}
          </div>

          {images && images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {images.map((img, imgIdx) => (
                <button
                  key={img.id || imgIdx}
                  type="button"
                  onClick={() =>
                    openLightbox(
                      `ภาพถ่ายกิจกรรมส่งเสริมการขายหน้าร้าน - ${target.store || "ร้านค้า"}`,
                      images,
                      imgIdx,
                    )
                  }
                  className="group relative rounded-xl border border-teal-200/80 overflow-hidden bg-slate-100 aspect-video flex items-center justify-center shadow-2xs hover:shadow-md hover:border-teal-400 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  aria-label={`คลิกเพื่อดูภาพถ่ายกิจกรรมที่ ${imgIdx + 1} ขนาดใหญ่`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.name || `ภาพถ่ายกิจกรรม ${imgIdx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-black/60 text-white backdrop-blur-xs shadow-md">
                      <Eye className="w-4 h-4" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
              <ImageIcon className="w-4 h-4 opacity-50 text-slate-400" />
              <span>ไม่มีภาพถ่ายกิจกรรมส่งเสริมการขายหน้าร้าน</span>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Viewer */}
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
