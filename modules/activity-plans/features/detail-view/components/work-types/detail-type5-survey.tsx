"use client";

import React, { useMemo, useState } from "react";
import { BarChart2, ImageIcon, Store, Package, Camera, Eye } from "lucide-react";
import { ImageFile, Type5SurveyRecord } from "@/modules/activity-plans/features/actual-view/types";
import {
  ImageLightboxModal,
  LightboxImage,
} from "@/components/custom/image-lightbox-modal";

export interface TargetSurveyItem {
  id?: string;
  store: string;
  product: string;
  detail: string;
}

interface DetailType5SurveyProps {
  isVisible: boolean;
  target: {
    store: string;
    product: string;
    detail: string;
    items?: TargetSurveyItem[];
  };
  surveyDetails?: Type5SurveyRecord[];
  competitorBrand?: string;
  competitorProduct?: string;
  competitorPrice?: string;
  competitorUnit?: string;
  promotionDetail?: string;
  priceTagImages?: ImageFile[];
}

export function DetailType5Survey({
  isVisible,
  target,
  surveyDetails,
  competitorBrand,
  competitorProduct,
  competitorPrice,
  competitorUnit,
  promotionDetail,
  priceTagImages = [],
}: DetailType5SurveyProps) {
  // Lightbox Modal State
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
    images: ImageFile[] = [],
    initialIndex: number = 0,
  ) => {
    if (!images || images.length === 0) return;
    setLightboxState({
      isOpen: true,
      title,
      images: images.map((img) => ({
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

  // Normalized records to display: prefer surveyDetails if available, otherwise construct from target or fallback
  const recordsToRender: { record: Type5SurveyRecord; index: number }[] =
    useMemo(() => {
      if (surveyDetails && surveyDetails.length > 0) {
        return surveyDetails.map((rec, idx) => ({ record: rec, index: idx }));
      }
      if (target.items && target.items.length > 0) {
        return target.items.map((item, idx) => ({
          record: {
            id: item.id,
            store: item.store || target.store || "",
            product: item.product || target.product || "",
            detail: item.detail || target.detail || "",
            competitorBrand: idx === 0 ? competitorBrand || "" : "",
            competitorProduct: idx === 0 ? competitorProduct || "" : "",
            competitorPrice: idx === 0 ? competitorPrice || "" : "",
            competitorUnit: idx === 0 ? competitorUnit || "ขวด" : "ขวด",
            promotionDetail: idx === 0 ? promotionDetail || "" : "",
            priceTagImages: idx === 0 ? priceTagImages : [],
            shelfImages: [],
          },
          index: idx,
        }));
      }
      return [
        {
          record: {
            store: target.store || "",
            product: target.product || "",
            detail: target.detail || "",
            competitorBrand: competitorBrand || "",
            competitorProduct: competitorProduct || "",
            competitorPrice: competitorPrice || "",
            competitorUnit: competitorUnit || "ขวด",
            promotionDetail: promotionDetail || "",
            priceTagImages,
            shelfImages: [],
          },
          index: 0,
        },
      ];
    }, [
      surveyDetails,
      target,
      competitorBrand,
      competitorProduct,
      competitorPrice,
      competitorUnit,
      promotionDetail,
      priceTagImages,
    ]);

  // Group records by Store Name
  const groupedByStore = useMemo(() => {
    const map = new Map<
      string,
      {
        storeName: string;
        items: { record: Type5SurveyRecord; index: number }[];
      }
    >();

    recordsToRender.forEach(({ record, index }) => {
      const storeKey = record.store?.trim() || "ร้านค้าที่สำรวจ";
      if (!map.has(storeKey)) {
        map.set(storeKey, { storeName: storeKey, items: [] });
      }
      map.get(storeKey)!.items.push({ record, index });
    });

    return Array.from(map.values());
  }, [recordsToRender]);

  if (!isVisible) return null;

  return (
    <div className="border border-amber-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-amber-900 text-base md:text-lg">
              สำรวจตลาดของคู่แข่ง
            </h2>
            <p className="text-xs text-amber-700/80">
              ผลการสำรวจตลาดแยกตามร้านค้าและสินค้าเปรียบเทียบ
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
          ทั้งหมด {recordsToRender.length} รายการสำรวจ
        </span>
      </div>

      {/* Grouped by Store List */}
      <div className="space-y-6">
        {groupedByStore.map((storeGroup, sIdx) => (
          <div
            key={storeGroup.storeName || sIdx}
            className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-slate-50/40 space-y-4 shadow-xs"
          >
            {/* Store Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>ร้านค้า: {storeGroup.storeName}</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    รายการสำรวจจำนวน {storeGroup.items.length} สินค้า
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                ร้านค้าลำดับที่ {sIdx + 1}
              </span>
            </div>

            {/* List of Products under this Store */}
            <div className="space-y-4">
              {storeGroup.items.map(({ record }, pIdx) => (
                <div
                  key={
                    record.id ||
                    `${storeGroup.storeName}-${record.product}-${pIdx}`
                  }
                  className="bg-white rounded-xl border border-slate-200 p-4 sm:p-4.5 shadow-2xs space-y-3.5"
                >
                  {/* Product Header & Target Info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">
                        {pIdx + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-amber-600" />
                        สินค้าเปรียบเทียบ:{" "}
                        <span className="text-amber-900 font-extrabold">
                          {record.product || "-"}
                        </span>
                      </span>
                    </div>

                    {record.detail && (
                      <span className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/80">
                        <span className="font-semibold text-slate-500">
                          รายละเอียดจากแผน:
                        </span>{" "}
                        {record.detail}
                      </span>
                    )}
                  </div>

                  {/* Read-Only Result Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1">
                      <span className="text-xs text-slate-500 font-medium block">
                        แบรนด์คู่แข่ง
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
                        {record.competitorBrand || "-"}
                      </span>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1">
                      <span className="text-xs text-slate-500 font-medium block">
                        ชื่อสินค้าคู่แข่ง
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
                        {record.competitorProduct || "-"}
                      </span>
                    </div>

                    <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 space-y-1">
                      <span className="text-xs text-amber-700 font-medium block">
                        ราคาขายของคู่แข่ง
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-amber-900 block">
                        {record.competitorPrice
                          ? `฿${Number(record.competitorPrice).toLocaleString()} / ${record.competitorUnit || "หน่วย"}`
                          : "-"}
                      </span>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1 sm:col-span-2 md:col-span-3">
                      <span className="text-xs text-slate-500 font-medium block">
                        รายละเอียดโปรโมชั่นของคู่แข่ง
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {record.promotionDetail || "-"}
                      </p>
                    </div>
                  </div>

                  {/* Images Display with Lightbox Zoom/Pan Support */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Price Tag Images */}
                    <div className="bg-amber-50/20 border border-amber-200/70 rounded-2xl p-4 sm:p-4.5 space-y-3">
                      <div className="flex items-center justify-between border-b border-amber-100/80 pb-2">
                        <span className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-amber-600" />
                          รูปถ่ายป้ายราคาคู่แข่ง
                        </span>
                        {record.priceTagImages &&
                        record.priceTagImages.length > 0 ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            {record.priceTagImages.length} รูป
                          </span>
                        ) : null}
                      </div>

                      {record.priceTagImages &&
                      record.priceTagImages.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {record.priceTagImages.map((img, imgIdx) => (
                            <button
                              key={img.id || imgIdx}
                              type="button"
                              onClick={() =>
                                openLightbox(
                                  `รูปถ่ายป้ายราคาคู่แข่ง - ${record.product || record.store}`,
                                  record.priceTagImages,
                                  imgIdx,
                                )
                              }
                              className="group relative rounded-xl border border-amber-200/80 overflow-hidden bg-slate-100 aspect-video flex items-center justify-center shadow-2xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                              aria-label={`คลิกเพื่อดูรูปถ่ายป้ายราคาที่ ${imgIdx + 1} ขนาดใหญ่`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.url}
                                alt={img.name || `ป้ายราคา ${imgIdx + 1}`}
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
                          <span>ไม่มีรูปถ่ายป้ายราคา</span>
                        </div>
                      )}
                    </div>

                    {/* Shelf Images */}
                    <div className="bg-indigo-50/20 border border-indigo-200/70 rounded-2xl p-4 sm:p-4.5 space-y-3">
                      <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
                        <span className="text-xs sm:text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-indigo-600" />
                          รูปถ่ายชั้นวางสินค้า
                        </span>
                        {record.shelfImages &&
                        record.shelfImages.length > 0 ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                            {record.shelfImages.length} รูป
                          </span>
                        ) : null}
                      </div>

                      {record.shelfImages &&
                      record.shelfImages.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {record.shelfImages.map((img, imgIdx) => (
                            <button
                              key={img.id || imgIdx}
                              type="button"
                              onClick={() =>
                                openLightbox(
                                  `รูปถ่ายชั้นวางสินค้า - ${record.product || record.store}`,
                                  record.shelfImages,
                                  imgIdx,
                                )
                              }
                              className="group relative rounded-xl border border-indigo-200/80 overflow-hidden bg-slate-100 aspect-video flex items-center justify-center shadow-2xs hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                              aria-label={`คลิกเพื่อดูรูปถ่ายชั้นวางสินค้าที่ ${imgIdx + 1} ขนาดใหญ่`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.url}
                                alt={img.name || `ชั้นวางสินค้า ${imgIdx + 1}`}
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
                          <span>ไม่มีรูปถ่ายชั้นวางสินค้า</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Image Lightbox Viewer Modal */}
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
