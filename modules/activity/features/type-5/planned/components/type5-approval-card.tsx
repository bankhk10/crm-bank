"use client";

import React, { useState, useMemo } from "react";
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
import type { Type5ImageFile } from "../../shared/types";
import {
  ImageLightboxModal,
  type LightboxImage,
} from "@/components/custom/image-lightbox-modal";
import { Type5PlanCard } from "./type5-plan-card";
import type {
  Type5TargetItem,
  TargetSurveyItem,
} from "../types/planned.types";
import type {
  Type5SurveyRecord,
  ApprovalType5SurveyProps,
  Type5ApprovalCardProps,
} from "../types/actual.types";

export type { ApprovalType5SurveyProps, Type5ApprovalCardProps };

export function Type5ApprovalCard({
  isVisible,
  target,
  targets,
  surveyDetails,
  competitorBrand,
  competitorProduct,
}: Type5ApprovalCardProps) {
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

  const hasActualSurveyData = Boolean(
    (surveyDetails && surveyDetails.length > 0) ||
      competitorBrand ||
      competitorProduct,
  );

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
      description:
        img.category === "SURVEY_BOTTLE"
          ? "รูปถ่ายขวดผลิตภัณฑ์"
          : "รูปภาพสื่อส่งเสริมการขาย",
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
    <div className="space-y-4">
      {/* 1. Planned Target Card */}
      {resolvedTarget && <Type5PlanCard target={resolvedTarget} />}

      {/* 2. Actual Survey Results Card (if has actual results) */}
      {hasActualSurveyData && (
        <div className="rounded-xl border border-purple-200/80 bg-white p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  ผลการสำรวจตลาดของคู่แข่งจริง (Actual Survey Outcome)
                </h4>
                <p className="text-[11px] text-slate-500">
                  ข้อมูลแบรนด์คู่แข่ง ราคา และรูปภาพที่ผู้ปฏิบัติงานบันทึกเข้ามา
                </p>
              </div>
            </div>

            <Badge
              variant="outline"
              className="text-[10px] font-semibold bg-purple-50 text-purple-700 border-purple-200"
            >
              {recordsToRender.length} รายการสำรวจ
            </Badge>
          </div>

          <div className="space-y-4">
            {recordsToRender.map((rec, idx) => (
              <div
                key={rec.id || idx}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
              >
                {/* Header item */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-slate-900">
                      เปรียบเทียบกับ:{" "}
                      <span className="text-purple-900">
                        {rec.product || "-"}
                      </span>
                    </span>
                  </div>

                  {rec.store && (
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Store className="w-3 h-3 text-slate-400" />
                      {rec.store}
                    </span>
                  )}
                </div>

                {/* Brand & Product */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-medium block">
                      แบรนด์คู่แข่ง
                    </span>
                    <span className="font-bold text-slate-900 block break-words">
                      {rec.competitorBrand || "-"}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-medium block">
                      สินค้าคู่แข่ง
                    </span>
                    <span className="font-bold text-slate-900 block break-words">
                      {rec.competitorProduct || "-"}
                    </span>
                  </div>
                </div>

                {/* 4-Tier Pricing */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      ณ จุดขาย (POS)
                    </span>
                    <span className="font-bold text-purple-700 text-xs">
                      {rec.posPrice
                        ? `฿ ${Number(rec.posPrice).toLocaleString()}`
                        : "-"}
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Dealer
                    </span>
                    <span className="font-bold text-purple-700 text-xs">
                      {rec.dealerPrice
                        ? `฿ ${Number(rec.dealerPrice).toLocaleString()}`
                        : "-"}
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Subdealer
                    </span>
                    <span className="font-bold text-purple-700 text-xs">
                      {rec.subdealerPrice
                        ? `฿ ${Number(rec.subdealerPrice).toLocaleString()}`
                        : "-"}
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Farmers
                    </span>
                    <span className="font-bold text-purple-700 text-xs">
                      {rec.farmerPrice
                        ? `฿ ${Number(rec.farmerPrice).toLocaleString()}`
                        : "-"}
                    </span>
                  </div>
                </div>

                {/* Selling Points */}
                {rec.sellingPoints && (
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      จุดขาย / จุดเด่นของสินค้า
                    </span>
                    <p className="text-slate-800 text-[11px] leading-relaxed whitespace-pre-wrap">
                      {rec.sellingPoints}
                    </p>
                  </div>
                )}

                {/* Photos Previews */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Bottle Images */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-purple-600" />
                      รูปถ่ายขวดผลิตภัณฑ์ ({rec.bottleImages?.length || 0}/2)
                    </span>
                    {rec.bottleImages && rec.bottleImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        {rec.bottleImages.map((img, imgIdx) => (
                          <button
                            key={img.id || imgIdx}
                            type="button"
                            onClick={() =>
                              openLightbox(
                                rec.bottleImages || [],
                                imgIdx,
                                `รูปขวด - ${rec.competitorProduct || rec.product}`,
                              )
                            }
                            className="group relative rounded-lg border border-slate-200 overflow-hidden bg-slate-100 aspect-video flex items-center justify-center hover:border-purple-400 transition-all cursor-pointer"
                            aria-label={`คลิกเพื่อดูรูปภาพขวดที่ ${imgIdx + 1}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              alt={img.name || `ขวดสินค้า ${imgIdx + 1}`}
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
                        <span>ไม่มีรูปภาพขวดผลิตภัณฑ์</span>
                      </div>
                    )}
                  </div>

                  {/* Promo Images */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-blue-600" />
                      รูปสื่อส่งเสริมการขาย ({rec.promotionalImages?.length || 0}
                      /3)
                    </span>
                    {rec.promotionalImages &&
                    rec.promotionalImages.length > 0 ? (
                      <div className="grid grid-cols-3 gap-1.5">
                        {rec.promotionalImages.map((img, imgIdx) => (
                          <button
                            key={img.id || imgIdx}
                            type="button"
                            onClick={() =>
                              openLightbox(
                                rec.promotionalImages || [],
                                imgIdx,
                                `สื่อส่งเสริมการขาย - ${rec.competitorProduct || rec.product}`,
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

// Backward-compatible alias
export const ApprovalType5Survey = Type5ApprovalCard;
