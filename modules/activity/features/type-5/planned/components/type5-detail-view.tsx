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
import type { Type5ImageFile } from "../../shared/types";
import type {
  Type5SurveyRecord,
  Type5DetailViewProps,
  DetailType5SurveyProps,
} from "../types/actual.types";
import type { TargetSurveyItem, Type5TargetItem } from "../types/planned.types";
import {
  ImageLightboxModal,
  type LightboxImage,
} from "@/components/custom/image-lightbox-modal";

export type {
  TargetSurveyItem,
  DetailType5SurveyProps,
  Type5TargetItem,
  Type5DetailViewProps,
};

export function Type5DetailView({
  isVisible,
  target,
  targets,
  surveyDetails,
  competitorBrand,
  competitorProduct,
}: Type5DetailViewProps) {
  const resolvedTarget: Type5TargetItem | undefined = useMemo(() => {
    if (target && target.items && target.items.length > 0) return target;
    if (targets && targets.length > 0) {
      const allItems: TargetSurveyItem[] = targets.flatMap((t, idx) =>
        t.items && t.items.length > 0
          ? t.items
          : [
              {
                id: t.id || `t5-item-${idx}`,
                storeId: t.storeId,
                store: t.store || t.storeName || "",
                storeName: t.store || t.storeName || "",
                productId: t.productId,
                product: t.product || t.productName || "",
                productName: t.product || t.productName || "",
                detail: t.detail || t.notes || "",
                notes: t.detail || t.notes || "",
              },
            ],
      );
      return {
        ...targets[0],
        store: targets
          .map((t) => t.store || t.storeName)
          .filter(Boolean)
          .join(", "),
        product: targets
          .map((t) => t.product || t.productName)
          .filter(Boolean)
          .join(", "),
        detail: targets
          .map((t) => t.detail || t.notes)
          .filter(Boolean)
          .join(" | "),
        items: allItems,
      };
    }
    return target;
  }, [target, targets]);

  const recordsToRender: Type5SurveyRecord[] = useMemo(() => {
    if (surveyDetails && surveyDetails.length > 0) {
      return surveyDetails;
    }
    if (resolvedTarget?.items && resolvedTarget.items.length > 0) {
      return resolvedTarget.items.map((item: TargetSurveyItem, idx: number) => ({
        id: item.id,
        store: item.store || resolvedTarget?.store || "",
        product: item.product || resolvedTarget?.product || "",
        detail: item.detail || resolvedTarget?.detail || "",
        competitorBrand: idx === 0 ? competitorBrand || "" : "",
        competitorProduct: idx === 0 ? competitorProduct || "" : "",
        posPrice: "",
        dealerPrice: "",
        subdealerPrice: "",
        farmerPrice: "",
        sellingPoints: "",
        bottleImages: [],
        promotionalImages: [],
      }));
    }
    return [
      {
        store: resolvedTarget?.store || "",
        product: resolvedTarget?.product || "",
        detail: resolvedTarget?.detail || "",
        competitorBrand: competitorBrand || "",
        competitorProduct: competitorProduct || "",
        posPrice: "",
        dealerPrice: "",
        subdealerPrice: "",
        farmerPrice: "",
        sellingPoints: "",
        bottleImages: [],
        promotionalImages: [],
      },
    ];
  }, [surveyDetails, resolvedTarget, competitorBrand, competitorProduct]);

  // Group records by Store Name
  const groupedByStore = useMemo(() => {
    const map = new Map<
      string,
      { storeName: string; items: Type5SurveyRecord[] }
    >();

    recordsToRender.forEach((record) => {
      const storeKey = record.store?.trim() || "ร้านค้าที่สำรวจ";
      if (!map.has(storeKey)) {
        map.set(storeKey, { storeName: storeKey, items: [] });
      }
      map.get(storeKey)!.items.push(record);
    });

    return Array.from(map.values());
  }, [recordsToRender]);

  // Lightbox State
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    images: LightboxImage[];
    initialIndex: number;
    title: string;
  }>({
    isOpen: false,
    images: [],
    initialIndex: 0,
    title: "",
  });

  const openLightbox = (
    images: Type5ImageFile[],
    initialIndex = 0,
    title = "ดูรูปภาพ",
  ) => {
    if (!images || images.length === 0) return;
    const lightboxImages: LightboxImage[] = images.map((img) => ({
      url: img.url,
      name: img.name,
      description: img.category === "SURVEY_BOTTLE" ? "รูปถ่ายขวดผลิตภัณฑ์" : "รูปภาพสื่อส่งเสริมการขาย",
    }));

    setLightboxState({
      isOpen: true,
      images: lightboxImages,
      initialIndex,
      title,
    });
  };

  const closeLightbox = () => {
    setLightboxState((prev) => ({ ...prev, isOpen: false }));
  };

  if (!isVisible) return null;

  return (
    <div className="border border-purple-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-purple-900 text-base md:text-lg">
              สำรวจตลาดของคู่แข่ง
            </h2>
            <p className="text-xs text-purple-700/80">
              ผลการสำรวจแยกตามร้านค้าและสินค้าเปรียบเทียบตามแผนงาน
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
          ทั้งหมด {recordsToRender.length} รายการสำรวจ
        </span>
      </div>

      {/* Grouped by Store List */}
      <div className="space-y-6">
        {groupedByStore.map((storeGroup, sIdx) => (
          <div
            key={storeGroup.storeName || sIdx}
            className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-slate-50/40 space-y-5 shadow-xs"
          >
            {/* Store Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>ร้านค้า: {storeGroup.storeName}</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    เป้าหมายสำรวจจำนวน {storeGroup.items.length} สินค้า
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                ร้านค้าลำดับที่ {sIdx + 1}
              </span>
            </div>

            {/* List of Products under this Store */}
            <div className="space-y-5">
              {storeGroup.items.map((record, pIdx) => (
                <div
                  key={
                    record.id ||
                    `${storeGroup.storeName}-${record.product}-${pIdx}`
                  }
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4 transition-all hover:border-purple-300"
                >
                  {/* Product Header & Target Info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-bold">
                        {pIdx + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-purple-600" />
                        สินค้าเปรียบเทียบ:{" "}
                        <span className="text-purple-900 font-extrabold">
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
                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        แบรนด์คู่แข่งที่พบหน้างาน
                      </span>
                      <span className="text-sm font-bold text-slate-900 block break-words">
                        {record.competitorBrand || "-"}
                      </span>
                    </div>

                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        สินค้าคู่แข่ง
                      </span>
                      <span className="text-sm font-bold text-slate-900 block break-words">
                        {record.competitorProduct || "-"}
                      </span>
                    </div>
                  </div>

                  {/* Normalized 4-Tier Pricing Display */}
                  <div className="bg-purple-50/30 border border-purple-100 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        ราคาขายแต่ละระดับ (บาท)
                      </span>
                      <span className="text-[11px] text-purple-700/70">
                        ข้อมูลราคาที่สำรวจได้
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="bg-white p-2.5 rounded-lg border border-purple-100 space-y-0.5">
                        <span className="text-[11px] text-slate-500 font-medium block">
                          ณ จุดขาย (POS)
                        </span>
                        <span className="text-sm font-extrabold text-purple-800 block">
                          {record.posPrice
                            ? `฿ ${Number(record.posPrice).toLocaleString()}`
                            : "-"}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-purple-100 space-y-0.5">
                        <span className="text-[11px] text-slate-500 font-medium block">
                          ราคา Dealer
                        </span>
                        <span className="text-sm font-extrabold text-purple-800 block">
                          {record.dealerPrice
                            ? `฿ ${Number(record.dealerPrice).toLocaleString()}`
                            : "-"}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-purple-100 space-y-0.5">
                        <span className="text-[11px] text-slate-500 font-medium block">
                          ราคา Subdealer
                        </span>
                        <span className="text-sm font-extrabold text-purple-800 block">
                          {record.subdealerPrice
                            ? `฿ ${Number(record.subdealerPrice).toLocaleString()}`
                            : "-"}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-purple-100 space-y-0.5">
                        <span className="text-[11px] text-slate-500 font-medium block">
                          ราคา Farmers
                        </span>
                        <span className="text-sm font-extrabold text-purple-800 block">
                          {record.farmerPrice
                            ? `฿ ${Number(record.farmerPrice).toLocaleString()}`
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Product Selling Points / Highlights */}
                  {record.sellingPoints && (
                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        จุดขาย / จุดเด่นของสินค้า
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                        {record.sellingPoints}
                      </p>
                    </div>
                  )}

                  {/* 2 Separate Upload Preview Sections */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                    {/* Bottle Photos */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-purple-600" />
                          รูปถ่ายขวดผลิตภัณฑ์ (
                          {record.bottleImages?.length || 0}/2)
                        </span>
                      </div>

                      {record.bottleImages && record.bottleImages.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2.5">
                          {record.bottleImages.map((img, imgIdx) => (
                            <button
                              key={img.id || imgIdx}
                              type="button"
                              onClick={() =>
                                openLightbox(
                                  record.bottleImages || [],
                                  imgIdx,
                                  `รูปถ่ายขวด - ${record.competitorProduct || record.product}`,
                                )
                              }
                              className="group relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500 transition-all cursor-pointer"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.url}
                                alt={img.name || `ขวดสินค้า ${imgIdx + 1}`}
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
                          <span>ไม่มีรูปภาพขวดผลิตภัณฑ์</span>
                        </div>
                      )}
                    </div>

                    {/* Promotional Materials Photos */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-blue-600" />
                          รูปภาพสื่อส่งเสริมการขาย (
                          {record.promotionalImages?.length || 0}/3)
                        </span>
                      </div>

                      {record.promotionalImages &&
                      record.promotionalImages.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2.5">
                          {record.promotionalImages.map((img, imgIdx) => (
                            <button
                              key={img.id || imgIdx}
                              type="button"
                              onClick={() =>
                                openLightbox(
                                  record.promotionalImages || [],
                                  imgIdx,
                                  `สื่อส่งเสริมการขาย - ${record.competitorProduct || record.product}`,
                                )
                              }
                              className="group relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.url}
                                alt={
                                  img.name || `สื่อส่งเสริมการขาย ${imgIdx + 1}`
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

// Backward-compatible alias
export const DetailType5Survey = Type5DetailView;
