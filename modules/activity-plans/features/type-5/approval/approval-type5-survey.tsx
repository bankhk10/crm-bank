"use client";

import React, { useState } from "react";
import {
  Search,
  Store,
  Package,
  Camera,
  Eye,
  Sparkles,
  ImageIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  ActualTargetsState,
  ImageFile,
  Type5SurveyRecord,
} from "@/modules/activity-plans/features/shared/actual-view/types";
import {
  ImageLightboxModal,
  LightboxImage,
} from "@/components/custom/image-lightbox-modal";

interface ApprovalType5SurveyProps {
  isVisible: boolean;
  target: ActualTargetsState["t5"];
  surveyDetails?: Type5SurveyRecord[];
  competitorBrand?: string;
  competitorProduct?: string;
}

export function ApprovalType5Survey({
  isVisible,
  target,
  surveyDetails,
  competitorBrand,
  competitorProduct,
}: ApprovalType5SurveyProps) {
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

  const formatPrice = (val?: string | number | null) => {
    if (val === null || val === undefined || val === "" || isNaN(Number(val))) {
      return "-";
    }
    return `฿${Number(val).toLocaleString()}`;
  };

  if (!isVisible) return null;

  const hasSurveyResults = Boolean(
    surveyDetails &&
    surveyDetails.length > 0 &&
    surveyDetails.some(
      (s) =>
        s.competitorBrand ||
        s.competitorProduct ||
        s.posPrice ||
        s.dealerPrice ||
        s.subdealerPrice ||
        s.farmerPrice ||
        s.sellingPoints ||
        (s.bottleImages && s.bottleImages.length > 0) ||
        (s.promotionalImages && s.promotionalImages.length > 0),
    ),
  );

  return (
    <div className="border border-purple-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-4 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-purple-900 text-sm sm:text-base">
              สำรวจตลาดของคู่แข่ง
            </h4>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-bold bg-purple-50 text-purple-800 border-purple-200"
        >
          TYPE_5
        </Badge>
      </div>

      {/* Plan Targets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-purple-50/40 p-3 rounded-xl border border-purple-100/80 sm:col-span-1">
          <span className="text-purple-700 block text-[11px] font-bold mb-1">
            วัตถุประสงค์ของประเภทงาน
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            สำรวจตลาดและเปรียบเทียบราคาสินค้าคู่แข่ง
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            ร้านค้าที่สำรวจ (เป้าหมาย)
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.store || "-"}
          </span>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
          <span className="text-slate-500 block text-[11px] font-medium mb-1">
            สินค้าคู่แข่งที่เปรียบเทียบ (เป้าหมาย)
          </span>
          <span className="font-bold text-slate-800 block text-xs sm:text-sm">
            {target.product || "-"}
          </span>
        </div>

        {target.detail && (
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-3">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              รายละเอียดจากแผน
            </span>
            <span className="text-slate-700 block text-xs whitespace-pre-line">
              {target.detail}
            </span>
          </div>
        )}
      </div>

      {/* Actual Survey Results Section (if available) */}
      {hasSurveyResults && (
        <div className="mt-4 pt-4 border-t border-purple-100 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-purple-600" />
              ผลการสำรวจจริง (Actual Survey Results)
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              {surveyDetails?.length || 0} รายการ
            </span>
          </div>

          <div className="space-y-4">
            {surveyDetails?.map((record, rIdx) => (
              <div
                key={record.id || rIdx}
                className="bg-slate-50/60 rounded-xl border border-slate-200 p-3.5 sm:p-4 space-y-3.5"
              >
                {/* Product / Store Title */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-bold">
                      {rIdx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-purple-600" />
                      ร้านค้า:{" "}
                      <span className="text-purple-950 font-extrabold">
                        {record.store || target.store || "-"}
                      </span>
                    </span>
                  </div>
                  {record.product && (
                    <span className="text-xs text-slate-600 bg-white px-2.5 py-0.5 rounded-md border border-slate-200 font-medium">
                      สินค้าเปรียบเทียบ: {record.product}
                    </span>
                  )}
                </div>

                {/* Brand & Product */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 space-y-0.5">
                    <span className="text-[11px] text-slate-500 font-medium block">
                      แบรนด์คู่แข่ง
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                      {record.competitorBrand || competitorBrand || "-"}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 space-y-0.5">
                    <span className="text-[11px] text-slate-500 font-medium block">
                      ชื่อสินค้าคู่แข่ง
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                      {record.competitorProduct || competitorProduct || "-"}
                    </span>
                  </div>
                </div>

                {/* 4-Tier Price Breakdown */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    โครงสร้างราคา 4 ระดับ
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-2 text-center">
                      <span className="text-[10px] text-amber-800 font-semibold block">
                        ราคา ณ จุดขาย (POS)
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-amber-950 block">
                        {formatPrice(record.posPrice)}
                      </span>
                    </div>

                    <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-2 text-center">
                      <span className="text-[10px] text-blue-800 font-semibold block">
                        ราคา Dealer
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-blue-950 block">
                        {formatPrice(record.dealerPrice)}
                      </span>
                    </div>

                    <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-2 text-center">
                      <span className="text-[10px] text-indigo-800 font-semibold block">
                        ราคา Subdealer
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-indigo-950 block">
                        {formatPrice(record.subdealerPrice)}
                      </span>
                    </div>

                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-2 text-center">
                      <span className="text-[10px] text-emerald-800 font-semibold block">
                        ราคา Farmers
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-emerald-950 block">
                        {formatPrice(record.farmerPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Selling Points */}
                {record.sellingPoints ? (
                  <div className="bg-amber-50/30 border border-amber-200/70 rounded-xl p-3 space-y-1">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      จุดขาย / จุดเด่นของสินค้า:
                    </span>
                    <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                      {record.sellingPoints}
                    </p>
                  </div>
                ) : null}

                {/* Images (Bottle max 2, Promo max 3) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Bottle Images */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-amber-600" />
                        รูปถ่ายขวดผลิตภัณฑ์ (สูงสุด 2 รูป)
                      </span>
                      {record.bottleImages &&
                        record.bottleImages.length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            {record.bottleImages.length} / 2 รูป
                          </span>
                        )}
                    </div>

                    {record.bottleImages && record.bottleImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {record.bottleImages.slice(0, 2).map((img, imgIdx) => (
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
                            className="group relative rounded-lg border border-slate-200 overflow-hidden bg-slate-100 aspect-video flex items-center justify-center hover:border-amber-400 transition-all cursor-pointer"
                            aria-label={`คลิกเพื่อดูรูปถ่ายขวดผลิตภัณฑ์ที่ ${imgIdx + 1}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              alt={img.name || `ขวดผลิตภัณฑ์ ${imgIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-black/60 text-white shadow-xs">
                                <Eye className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                        <ImageIcon className="w-3.5 h-3.5 opacity-50 text-slate-400" />
                        <span>ไม่มีรูปถ่ายขวดผลิตภัณฑ์</span>
                      </div>
                    )}
                  </div>

                  {/* Promo Images */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-blue-600" />
                        รูปภาพสื่อส่งเสริมการขาย (สูงสุด 3 รูป)
                      </span>
                      {record.promotionalImages &&
                        record.promotionalImages.length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                            {record.promotionalImages.length} / 3 รูป
                          </span>
                        )}
                    </div>

                    {record.promotionalImages &&
                    record.promotionalImages.length > 0 ? (
                      <div className="grid grid-cols-3 gap-1.5">
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
                              className="group relative rounded-lg border border-slate-200 overflow-hidden bg-slate-100 aspect-video flex items-center justify-center hover:border-blue-400 transition-all cursor-pointer"
                              aria-label={`คลิกเพื่อดูรูปภาพสื่อส่งเสริมการขายที่ ${imgIdx + 1}`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.url}
                                alt={
                                  img.name || `สื่อส่งเสริมการขาย ${imgIdx + 1}`
                                }
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-black/60 text-white shadow-xs">
                                  <Eye className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </button>
                          ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                        <ImageIcon className="w-3.5 h-3.5 opacity-50 text-slate-400" />
                        <span>ไม่มีรูปภาพสื่อส่งเสริมการขาย</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
