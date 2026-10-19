"use client";

import React, { useState } from "react";
import {
  Layers,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Package,
  Camera,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Type2PlanCard } from "./type2-plan-card";
import {
  ImageLightboxModal,
  LightboxImage,
} from "@/components/custom/image-lightbox-modal";
import type {
  Type2TargetItem,
  FollowupProductItem,
  Type2DetailViewProps,
  DetailType2FollowupProps,
} from "../types/planned.types";
import type { Type2ImageFile } from "../../shared/types";

export type {
  FollowupProductItem,
  Type2TargetItem,
  Type2ImageFile,
  Type2DetailViewProps,
  DetailType2FollowupProps,
};

const getParsedFollowupDetail = (
  text: string | undefined,
  productName: string,
  fallbackItemVal?: string,
): string => {
  if (fallbackItemVal) return fallbackItemVal;
  if (!text) return "";
  const escaped = productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?:^|\\|\\s*)${escaped}:\\s*([^|]+)`, "i");
  const match = text.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  if (!text.includes(":") && !text.includes("|")) {
    return text.trim();
  }
  return "";
};

const getParsedProblemDetail = (
  text: string | undefined,
  productName: string,
  fallbackItemVal?: string,
): string => {
  if (fallbackItemVal) return fallbackItemVal;
  if (!text) return "";
  const escaped = productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?:^|\\|\\s*)${escaped}:\\s*([^|]+)`, "i");
  const match = text.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  if (!text.includes(":") && !text.includes("|")) {
    return text.trim();
  }
  return "";
};

const getParsedUsageResult = (
  text: string | undefined,
  productName: string,
  fallback?: "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | "",
): "ลูกค้าพึงพอใจ" | "พบปัญหา" | "" => {
  if (!text) {
    if (fallback === "พืชตอบสนองดี" || fallback === "ลูกค้าพึงพอใจ")
      return "ลูกค้าพึงพอใจ";
    if (fallback === "พบปัญหา") return "พบปัญหา";
    return "";
  }
  const escaped = productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?:^|\\|\\s*)${escaped}:\\s*([^|]+)`, "i");
  const match = text.match(regex);
  if (match && match[1]) {
    const val = match[1].trim();
    if (
      val === "พืชตอบสนองดี" ||
      val === "ลูกค้าพึงพอใจ" ||
      val === "พบปัญหา"
    ) {
      return val === "พบปัญหา" ? "พบปัญหา" : "ลูกค้าพึงพอใจ";
    }
  }
  if (
    text === "พืชตอบสนองดี" ||
    text === "ลูกค้าพึงพอใจ" ||
    text === "พบปัญหา"
  ) {
    return text === "พบปัญหา" ? "พบปัญหา" : "ลูกค้าพึงพอใจ";
  }
  return "";
};

export function Type2DetailView({
  isVisible,
  target,
  targets,
  followupResults = [],
  customerName,
  detail,
  followupDetail,
  usageResult,
  problemDetail,
  images = [],
}: Type2DetailViewProps) {
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

  if (!isVisible) return null;

  const effectiveTargets: Type2TargetItem[] =
    targets && targets.length > 0 ? targets : target ? [target] : [];
  const primaryTarget = effectiveTargets[0] || {};

  const effectiveFollowupResults: FollowupProductItem[] =
    followupResults && followupResults.length > 0
      ? followupResults
      : primaryTarget.items && primaryTarget.items.length > 0
        ? primaryTarget.items
        : [
            {
              productName: primaryTarget.product || "สินค้าตามแผน",
              customer: primaryTarget.customer || customerName,
              usageResult: usageResult || "พืชตอบสนองดี",
              followupDetail: followupDetail || detail,
              problemDetail,
            },
          ];

  const openLightbox = (
    title: string,
    imgFiles: Type2ImageFile[],
    idx: number,
  ) => {
    setLightboxState({
      isOpen: true,
      title,
      images: imgFiles.map((f) => ({
        url: f.url,
        title: f.name || "รูปภาพการติดตามผล",
      })),
      initialIndex: idx,
    });
  };

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-emerald-950 text-sm sm:text-base">
            ติดตามผลการใช้สินค้า
          </h4>
        </div>
        {effectiveTargets.length > 1 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Layers className="w-3.5 h-3.5" />
            ทั้งหมด {effectiveTargets.length} เป้าหมาย
          </span>
        )}
      </div>

      <div className="space-y-3">
        {effectiveTargets.map((t, idx) => (
          <Type2PlanCard
            key={t.id || `t2-detail-target-${idx}`}
            target={t}
          />
        ))}
      </div>

      {effectiveFollowupResults.length > 0 && (
        <div className="border border-emerald-200/90 rounded-xl p-3.5 sm:p-4 bg-emerald-50/20 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-200/70 pb-2">
            <span className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600" />
              ผลการติดตามการใช้สินค้าจริง (Actual Result)
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {effectiveFollowupResults.length} รายการ
            </span>
          </div>

          <div className="space-y-3">
            {effectiveFollowupResults.map((item, idx) => {
              const pName = item.productName || "สินค้า";
              const itemUsage =
                item.usageResult ||
                getParsedUsageResult(usageResult, pName, usageResult);
              const itemFollowupDetail =
                item.followupDetail ||
                getParsedFollowupDetail(followupDetail, pName, item.detail);
              const itemProblem =
                item.problemDetail ||
                getParsedProblemDetail(problemDetail, pName, item.problemDetail);

              return (
                <div
                  key={item.id || idx}
                  className="bg-white p-3.5 sm:p-4 rounded-xl border border-emerald-200/70 shadow-2xs space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">
                        {pName}
                      </span>
                      {item.isAdditional && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 px-1.5 py-0.5"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          เพิ่มเติม
                        </Badge>
                      )}
                    </div>

                    <div>
                      {itemUsage === "พบปัญหา" ? (
                        <Badge
                          variant="outline"
                          className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-bold flex items-center gap-1 px-2.5 py-1"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          พบปัญหา
                        </Badge>
                      ) : itemUsage === "ลูกค้าพึงพอใจ" ||
                        itemUsage === "พืชตอบสนองดี" ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold flex items-center gap-1 px-2.5 py-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {itemUsage}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-slate-50 text-slate-600 border-slate-200 text-xs"
                        >
                          ไม่ระบุสถานะ
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {itemFollowupDetail && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 space-y-0.5">
                        <span className="text-slate-400 font-medium block">
                          รายละเอียดการติดตาม
                        </span>
                        <p className="text-slate-700 whitespace-pre-wrap">
                          {itemFollowupDetail}
                        </p>
                      </div>
                    )}

                    {itemUsage === "พบปัญหา" && (
                      <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-2.5 space-y-0.5 md:col-span-2">
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          ปัญหาที่พบ
                        </span>
                        <p className="text-rose-900 font-semibold block whitespace-pre-wrap">
                          {itemProblem || "-"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gallery Lightbox */}
      <div className="bg-emerald-50/20 border border-emerald-200/70 rounded-2xl p-4 sm:p-4.5 space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-emerald-100/80 pb-2">
          <span className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-emerald-600" />
            รูปภาพการติดตามผล
          </span>
          {images && images.length > 0 ? (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
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
                    `รูปภาพการติดตามผล - ${primaryTarget.customer || customerName || "ลูกค้า"}`,
                    images,
                    imgIdx,
                  )
                }
                className="group relative rounded-xl border border-emerald-200/80 overflow-hidden bg-slate-100 aspect-video flex items-center justify-center shadow-2xs hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                aria-label={`คลิกเพื่อดูรูปภาพการติดตามผลที่ ${imgIdx + 1} ขนาดใหญ่`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name || `รูปภาพการติดตามผล ${imgIdx + 1}`}
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
          <div className="text-center py-5 bg-white/60 rounded-xl border border-dashed border-emerald-200 text-xs text-slate-400">
            ไม่มีรูปภาพการติดตามผลที่แนบไว้
          </div>
        )}
      </div>

      <ImageLightboxModal
        isOpen={lightboxState.isOpen}
        onClose={() => setLightboxState((prev) => ({ ...prev, isOpen: false }))}
        title={lightboxState.title}
        images={lightboxState.images}
        initialIndex={lightboxState.initialIndex}
      />
    </div>
  );
}

export const DetailType2Followup = Type2DetailView;
