"use client";

import React, { useMemo, useState } from "react";
import {
  BarChart2,
  ImageIcon,
  Store,
  Package,
  Camera,
  Eye,
  Sparkles,
} from "lucide-react";
import {
  ImageFile,
  Type5SurveyRecord,
} from "@/modules/activity-plans/features/actual-view/types";
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
}

export function DetailType5Survey({
  isVisible,
  target,
  surveyDetails,
  competitorBrand,
  competitorProduct,
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

  // Normalized records to display: prefer surveyDetails if available, otherwise construct from target
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
            posPrice: null,
            dealerPrice: null,
            subdealerPrice: null,
            farmerPrice: null,
            sellingPoints: "",
            bottleImages: [],
            promotionalImages: [],
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
            posPrice: null,
            dealerPrice: null,
            subdealerPrice: null,
            farmerPrice: null,
            sellingPoints: "",
            bottleImages: [],
            promotionalImages: [],
          },
          index: 0,
        },
      ];
    }, [surveyDetails, target, competitorBrand, competitorProduct]);

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

  const formatPrice = (val?: string | number | null) => {
    if (val === null || val === undefined || val === "" || isNaN(Number(val))) {
      return "-";
    }
    return `฿${Number(val).toLocaleString()}`;
  };

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
              ผลการสำรวจตลาดเปรียบเทียบแบรนด์ โครงสร้างราคา 4 ระดับ
              และสื่อส่งเสริมการขาย
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
                  className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4"
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

                  {/* Brand & Product Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1">
                      <span className="text-xs text-slate-500 font-medium block">
                        แบรนด์คู่แข่ง
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                        {record.competitorBrand || "-"}
                      </span>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1">
                      <span className="text-xs text-slate-500 font-medium block">
                        ชื่อสินค้าคู่แข่ง
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                        {record.competitorProduct || "-"}
                      </span>
                    </div>
                  </div>

                  {/* Normalized 4-Tier Pricing Grid */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">
                      โครงสร้างราคา 4 ระดับ
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-2.5 sm:p-3 space-y-1 text-center">
                        <span className="text-[11px] text-amber-800 font-semibold block">
                          ราคา ณ จุดขาย (POS)
                        </span>
                        <span className="text-sm sm:text-base font-extrabold text-amber-950 block">
                          {formatPrice(record.posPrice)}
                        </span>
                      </div>

                      <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-2.5 sm:p-3 space-y-1 text-center">
                        <span className="text-[11px] text-blue-800 font-semibold block">
                          ราคา Dealer
                        </span>
                        <span className="text-sm sm:text-base font-extrabold text-blue-950 block">
                          {formatPrice(record.dealerPrice)}
                        </span>
                      </div>

                      <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-2.5 sm:p-3 space-y-1 text-center">
                        <span className="text-[11px] text-indigo-800 font-semibold block">
                          ราคา Subdealer
                        </span>
                        <span className="text-sm sm:text-base font-extrabold text-indigo-950 block">
                          {formatPrice(record.subdealerPrice)}
                        </span>
                      </div>

                      <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-2.5 sm:p-3 space-y-1 text-center">
                        <span className="text-[11px] text-emerald-800 font-semibold block">
                          ราคา Farmers
                        </span>
                        <span className="text-sm sm:text-base font-extrabold text-emerald-950 block">
                          {formatPrice(record.farmerPrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Selling Points / Highlights */}
                  {record.sellingPoints ? (
                    <div className="bg-amber-50/20 border border-amber-200/70 rounded-xl p-3.5 space-y-1.5">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        จุดขาย / จุดเด่นของสินค้า:
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {record.sellingPoints}
                      </p>
                    </div>
                  ) : null}

                  {/* Images Display: Bottle Photos (Max 2) and Promotional Materials (Max 3) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Bottle Photos */}
                    <div className="bg-amber-50/20 border border-amber-200/70 rounded-2xl p-4 sm:p-4.5 space-y-3">
                      <div className="flex items-center justify-between border-b border-amber-100/80 pb-2">
                        <span className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-amber-600" />
                          รูปถ่ายขวดผลิตภัณฑ์ (สูงสุด 2 รูป)
                        </span>
                        {record.bottleImages &&
                        record.bottleImages.length > 0 ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            {record.bottleImages.length} / 2 รูป
                          </span>
                        ) : null}
                      </div>

                      {record.bottleImages && record.bottleImages.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2.5">
                          {record.bottleImages
                            .slice(0, 2)
                            .map((img, imgIdx) => (
                              <button
                                key={img.id || imgIdx}
                                type="button"
                                onClick={() =>
                                  openLightbox(
                                    `รูปถ่ายขวดผลิตภัณฑ์ - ${record.competitorProduct || record.product}`,
                                    record.bottleImages?.slice(0, 2),
                                    imgIdx,
                                  )
                                }
                                className="group relative rounded-xl border border-amber-200/80 overflow-hidden bg-slate-100 aspect-video flex items-center justify-center shadow-2xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                                aria-label={`คลิกเพื่อดูรูปถ่ายขวดผลิตภัณฑ์ที่ ${imgIdx + 1} ขนาดใหญ่`}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={img.url}
                                  alt={img.name || `ขวดผลิตภัณฑ์ ${imgIdx + 1}`}
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
                          <span>ไม่มีรูปถ่ายขวดผลิตภัณฑ์</span>
                        </div>
                      )}
                    </div>

                    {/* Promotional Materials Photos */}
                    <div className="bg-blue-50/20 border border-blue-200/70 rounded-2xl p-4 sm:p-4.5 space-y-3">
                      <div className="flex items-center justify-between border-b border-blue-100/80 pb-2">
                        <span className="text-xs sm:text-sm font-bold text-blue-950 flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-blue-600" />
                          รูปภาพสื่อส่งเสริมการขาย (สูงสุด 3 รูป)
                        </span>
                        {record.promotionalImages &&
                        record.promotionalImages.length > 0 ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            {record.promotionalImages.length} / 3 รูป
                          </span>
                        ) : null}
                      </div>

                      {record.promotionalImages &&
                      record.promotionalImages.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {record.promotionalImages
                            .slice(0, 3)
                            .map((img, imgIdx) => (
                              <button
                                key={img.id || imgIdx}
                                type="button"
                                onClick={() =>
                                  openLightbox(
                                    `สื่อส่งเสริมการขาย - ${record.competitorProduct || record.product}`,
                                    record.promotionalImages?.slice(0, 3),
                                    imgIdx,
                                  )
                                }
                                className="group relative rounded-xl border border-blue-200/80 overflow-hidden bg-slate-100 aspect-video flex items-center justify-center shadow-2xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                                aria-label={`คลิกเพื่อดูรูปภาพสื่อส่งเสริมการขายที่ ${imgIdx + 1} ขนาดใหญ่`}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={img.url}
                                  alt={
                                    img.name ||
                                    `สื่อส่งเสริมการขาย ${imgIdx + 1}`
                                  }
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
                          <span>ไม่มีรูปภาพสื่อส่งเสริมการขาย</span>
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
