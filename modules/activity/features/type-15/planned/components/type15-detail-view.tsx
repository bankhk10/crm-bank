"use client";

import React, { useState, useMemo } from "react";
import { Megaphone, FileText, Camera, Eye, Layers } from "lucide-react";
import { Type15PlanCard } from "./type15-plan-card";
import {
  ImageLightboxModal,
  type LightboxImage,
} from "@/components/custom/image-lightbox-modal";
import type {
  Type15DetailViewProps,
  DetailType15BoomProps,
} from "../types/actual.types";
import type { Type15ImageFile, Type15TargetItem } from "../../shared/types";

export type { Type15DetailViewProps, DetailType15BoomProps, Type15ImageFile };

export function Type15DetailView({
  isVisible = true,
  target,
  targets,
  actual,
  images = [],
  isActualRecorded,
}: Type15DetailViewProps) {
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

  const effectiveTargets: Type15TargetItem[] =
    targets && targets.length > 0 ? targets : target ? [target] : [];
  const primaryTarget = effectiveTargets[0] || {};

  const primaryTargetLabel =
    primaryTarget.storeName ||
    primaryTarget.dealerName ||
    primaryTarget.store?.name ||
    primaryTarget.subDealerStore ||
    primaryTarget.village ||
    "บูมทีม / คาราวาน";

  // รวบรวมรูปภาพจาก props images หรือ actual.images หรือ actual.attachments
  const rawImages = useMemo(() => {
    if (images && images.length > 0) return images;
    if (actual?.images && actual.images.length > 0) return actual.images;
    if (actual?.attachments && actual.attachments.length > 0) {
      return actual.attachments;
    }
    return [];
  }, [images, actual?.images, actual?.attachments]);

  const normalizedImages: Type15ImageFile[] = useMemo(() => {
    return rawImages
      .map((img: any, idx: number) => ({
        id: String(img.id || `type15-img-${idx}`),
        url: img.url || img.fileUrl || "",
        name: img.name || img.fileName || `รูปภาพการปฏิบัติงาน ${idx + 1}`,
        size: img.size || img.fileSize,
        type: img.type || img.mimeType,
      }))
      .filter((img) => Boolean(img.url));
  }, [rawImages]);

  // กรองรูปภาพที่ซ้ำกันออก (Deduplicate images by id or url)
  const uniqueImages = useMemo(() => {
    if (!normalizedImages || normalizedImages.length === 0) return [];
    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();
    return normalizedImages.filter((img) => {
      if (!img) return false;
      if (img.id && seenIds.has(img.id)) return false;
      if (img.url && seenUrls.has(img.url)) return false;
      if (img.id) seenIds.add(img.id);
      if (img.url) seenUrls.add(img.url);
      return true;
    });
  }, [normalizedImages]);

  const openLightbox = (
    title: string,
    imgFiles: Type15ImageFile[],
    idx: number,
  ) => {
    setLightboxState({
      isOpen: true,
      title,
      images: imgFiles.map((f) => ({
        url: f.url,
        name: f.name || "รูปภาพการปฏิบัติงาน",
      })),
      initialIndex: idx,
    });
  };

  const hasActual =
    isActualRecorded !== undefined
      ? isActualRecorded
      : Boolean(actual?.detail || uniqueImages.length > 0);

  return (
    <div className="border border-orange-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-4 shadow-2xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-200">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-orange-950 text-sm sm:text-base">
              รายละเอียดกิจกรรม: บูมทีม / คาราวาน
            </h4>
            <p className="text-xs text-slate-500 font-normal">
              ข้อมูลแผนงานและผลการปฏิบัติงานจริง
            </p>
          </div>
        </div>
        {effectiveTargets.length > 1 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <Layers className="w-3.5 h-3.5" />
            ทั้งหมด {effectiveTargets.length} เป้าหมาย
          </span>
        )}
      </div>

      {/* Plan Target Summary */}
      <Type15PlanCard target={target} targets={targets} />

      {/* Actual Result Section (if recorded) */}
      {(actual?.detail || (hasActual && actual)) && (
        <div className="border border-orange-200/90 rounded-xl p-3.5 sm:p-4 bg-orange-50/20 space-y-3">
          <div className="flex items-center justify-between border-b border-orange-200/70 pb-2">
            <span className="text-xs sm:text-sm font-bold text-orange-950 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-orange-600" />
              ผลการปฏิบัติงานจริง (Actual Outcome)
            </span>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-orange-200/70 shadow-2xs space-y-2">
            <span className="text-slate-400 font-medium block text-xs">
              รายละเอียดผลการปฏิบัติงาน
            </span>
            <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {actual.detail || "ไม่มีรายละเอียดผลการปฏิบัติงานเพิ่มเติม"}
            </p>
          </div>
        </div>
      )}

      {/* Gallery Lightbox */}
      <div className="bg-orange-50/20 border border-orange-200/70 rounded-2xl p-4 sm:p-4.5 space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-orange-100/80 pb-2">
          <span className="text-xs sm:text-sm font-bold text-orange-950 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-orange-600" />
            รูปภาพการปฏิบัติงาน
          </span>
          {uniqueImages && uniqueImages.length > 0 ? (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
              {uniqueImages.length} รูป
            </span>
          ) : null}
        </div>

        {uniqueImages && uniqueImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {uniqueImages.map((img, imgIdx) => (
              <button
                key={img.id || imgIdx}
                type="button"
                onClick={() =>
                  openLightbox(
                    `รูปภาพการปฏิบัติงาน - ${primaryTargetLabel}`,
                    uniqueImages,
                    imgIdx,
                  )
                }
                className="group relative rounded-xl border border-orange-200/80 overflow-hidden bg-slate-100 aspect-video flex items-center justify-center shadow-2xs hover:shadow-md hover:border-orange-400 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                aria-label={`คลิกเพื่อดูรูปภาพการปฏิบัติงานที่ ${imgIdx + 1} ขนาดใหญ่`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name || `รูปภาพการปฏิบัติงาน ${imgIdx + 1}`}
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
          <div className="text-center py-5 bg-white/60 rounded-xl border border-dashed border-orange-200 text-xs text-slate-400">
            ไม่มีรูปภาพการปฏิบัติงานที่แนบไว้
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

export const DetailType15Boom = Type15DetailView;
