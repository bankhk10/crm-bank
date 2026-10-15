"use client";

import React, { useState } from "react";
import {
  Calendar,
  ArrowRight,
  Tag,
  MapPin,
  Camera,
  Navigation,
  ExternalLink,
  Eye,
  ImageIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Type1ImageFile } from "../../shared/types";
import type { Type1DetailViewProps } from "../types/planned.types";
import {
  ImageLightboxModal,
  type LightboxImage,
} from "@/components/custom/image-lightbox-modal";

/**
 * Extracts target-specific text from composite strings like "TargetA: notes | TargetB: notes"
 */
function parseTargetField(
  text: string | undefined,
  targetName: string,
  fallback: string = "-",
): string {
  if (!text) return fallback;
  const escaped = targetName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `(?:^|\\||\\n)\\s*(?:\\d+\\.\\s*)?${escaped}:\\s*([^|\\n]+)`,
    "i",
  );
  const match = text.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return fallback;
}

export function Type1DetailView({
  isVisible,
  target,
  targets,
  productAdvice,
  discussionResult,
  salesOpportunity,
  nextAction,
  nextMeetingDate,
  farmerHomeAddress,
  plotLatitude,
  plotLongitude,
  plotImages = [],
}: Type1DetailViewProps) {
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

  const effectiveTargets =
    targets && targets.length > 0 ? targets : target ? [target] : [];
  const count = effectiveTargets.length;

  const openLightbox = (
    title: string,
    imgs: Type1ImageFile[] = [],
    initialIndex: number = 0,
  ) => {
    if (!imgs || imgs.length === 0) return;
    setLightboxState({
      isOpen: true,
      title,
      images: imgs.map((img) => ({
        url: img.url,
        caption: img.name,
      })),
      initialIndex,
    });
  };

  const closeLightbox = () => {
    setLightboxState((prev) => ({ ...prev, isOpen: false }));
  };

  const isAdviceTopic =
    target?.topic?.trim() === "ให้คำแนะนำการใช้สินค้า" ||
    effectiveTargets.some(
      (t) => t.topic?.trim() === "ให้คำแนะนำการใช้สินค้า",
    ) ||
    !!productAdvice ||
    !!salesOpportunity;

  const selectedProducts = productAdvice
    ? productAdvice
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const formatThaiDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return dateStr.replace(/\b(19\d\d|20\d\d)\b/g, (match) =>
      String(parseInt(match, 10) + 543),
    );
  };

  const isStore = target?.visitPurpose === "STORE";
  const hasFarmerTarget =
    effectiveTargets.some((t) => t.visitPurpose !== "STORE") || !isStore;
  const isUnregistered = Boolean(target?.isUnregisteredFarmer);
  const farmerDisplayName = isUnregistered
    ? target?.unregisteredFarmerName || target?.customer || "-"
    : target?.customer || "-";

  const effectivePlotLatitude =
    target?.plotLatitude != null && String(target.plotLatitude).trim() !== ""
      ? String(target.plotLatitude)
      : plotLatitude != null && String(plotLatitude).trim() !== ""
        ? String(plotLatitude)
        : null;

  const effectivePlotLongitude =
    target?.plotLongitude != null && String(target.plotLongitude).trim() !== ""
      ? String(target.plotLongitude)
      : plotLongitude != null && String(plotLongitude).trim() !== ""
        ? String(plotLongitude)
        : null;

  const hasCoords =
    effectivePlotLatitude != null &&
    effectivePlotLongitude != null;

  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${effectivePlotLatitude},${effectivePlotLongitude}`
    : null;

  const showFarmerSection =
    hasFarmerTarget ||
    Boolean(
      farmerHomeAddress || hasCoords || (plotImages && plotImages.length > 0),
    );

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-5 shadow-xs">
      {/* READ-ONLY ACTUAL RESULT DISPLAY */}
      {count > 1 ? (
        /* MULTI-TARGET READ-ONLY ACTUAL DISPLAY */
        <div className="space-y-4 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2 pb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <h3 className="text-sm font-bold text-slate-800">
              ผลการปฏิบัติงานจริง (แยกตามเป้าหมาย {count} เป้าหมาย)
            </h3>
          </div>

          <div className="space-y-3.5">
            {effectiveTargets.map((item, idx) => {
              const itemIsStore = item.visitPurpose === "STORE";
              const name = item.isUnregisteredFarmer
                ? item.unregisteredFarmerName ||
                  item.customer ||
                  `เป้าหมายที่ ${idx + 1}`
                : item.customer || `เป้าหมายที่ ${idx + 1}`;

              const itemDiscussion =
                item.discussionResult ||
                parseTargetField(
                  discussionResult,
                  name,
                  idx === 0 && !discussionResult?.includes(":")
                    ? discussionResult || "-"
                    : "-",
                );

              const itemNextAction =
                item.nextAction ||
                parseTargetField(
                  nextAction,
                  name,
                  idx === 0 && !nextAction?.includes(":")
                    ? nextAction || "-"
                    : "-",
                );

              const itemAddress =
                item.farmerHomeAddress ||
                parseTargetField(
                  farmerHomeAddress,
                  name,
                  idx === 0 && !farmerHomeAddress?.includes(":")
                    ? farmerHomeAddress || "-"
                    : "-",
                );

              const itemMeetingDate =
                item.nextMeetingDate || item.nextDate || nextMeetingDate;

              return (
                <div
                  key={item.id || idx}
                  className="bg-emerald-50/20 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        เป้าหมายที่ {idx + 1}: {name}
                      </span>
                      {item.province && (
                        <span className="text-xs text-slate-500">
                          (จังหวัด {item.province})
                        </span>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-md",
                        itemIsStore
                          ? "bg-sky-50 text-sky-800 border-sky-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200",
                      )}
                    >
                      {itemIsStore ? "เข้าพบร้านค้า" : "เข้าพบเกษตรกร"}
                    </Badge>
                  </div>

                  {/* Farmer Details */}
                  {!itemIsStore && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                        <span className="text-slate-400 font-medium block flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          ที่อยู่บ้านเกษตรกร
                        </span>
                        <p className="font-semibold text-slate-800 whitespace-pre-wrap">
                          {itemAddress}
                        </p>
                      </div>

                      {(() => {
                        const itemLat =
                          item.plotLatitude != null && String(item.plotLatitude).trim() !== ""
                            ? String(item.plotLatitude)
                            : effectivePlotLatitude;
                        const itemLng =
                          item.plotLongitude != null && String(item.plotLongitude).trim() !== ""
                            ? String(item.plotLongitude)
                            : effectivePlotLongitude;
                        const itemHasCoords = itemLat != null && itemLng != null;
                        const itemMapsUrl = itemHasCoords
                          ? `https://www.google.com/maps/search/?api=1&query=${itemLat},${itemLng}`
                          : null;

                        return (
                          <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium block flex items-center gap-1">
                                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                                พิกัดแปลง (Latitude, Longitude)
                              </span>
                              {itemMapsUrl && (
                                <a
                                  href={itemMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  เปิดแผนที่
                                </a>
                              )}
                            </div>
                            {itemHasCoords ? (
                              <div className="flex items-center gap-2 font-mono font-bold text-slate-800">
                                <span>Lat: {itemLat}</span>
                                <span className="text-slate-300">|</span>
                                <span>Lng: {itemLng}</span>
                              </div>
                            ) : (
                              <span className="text-slate-700 font-semibold">
                                -
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Discussion Result */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-1 text-xs sm:text-sm">
                    <span className="text-slate-400 text-xs font-medium block">
                      ผลการพูดคุย
                    </span>
                    <p className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                      {itemDiscussion}
                    </p>
                  </div>

                  {/* Next Action & Meeting Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                      <span className="text-slate-400 font-medium block flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        สิ่งที่ต้องดำเนินการต่อ
                      </span>
                      <span className="font-semibold text-slate-800 block">
                        {itemNextAction}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                      <span className="text-slate-400 font-medium block flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        วันที่นัดหมายครั้งถัดไป
                      </span>
                      <span className="font-semibold text-slate-800 block">
                        {formatThaiDate(itemMeetingDate)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Photos & Products summary */}
            {(isAdviceTopic || (plotImages && plotImages.length > 0)) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {isAdviceTopic && (
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                    <span className="text-xs text-slate-500 font-medium block">
                      สินค้าที่ให้คำแนะนำ & โอกาสการขาย
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedProducts.map((prod, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-emerald-900 border border-emerald-200 shadow-2xs"
                        >
                          <Tag className="w-3 h-3 text-emerald-600" />
                          {prod}
                        </span>
                      ))}
                      {salesOpportunity && (
                        <Badge
                          variant="outline"
                          className={
                            salesOpportunity === "สูง"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs"
                              : "bg-rose-50 text-rose-800 border-rose-300 font-bold text-xs"
                          }
                        >
                          โอกาสการขาย: {salesOpportunity}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {plotImages && plotImages.length > 0 && (
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      รูปแปลงเกษตรกร ({plotImages.length} รูป)
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {plotImages.map((img, imgIdx) => (
                        <button
                          key={img.id || imgIdx}
                          type="button"
                          onClick={() =>
                            openLightbox("รูปแปลงเกษตรกร", plotImages, imgIdx)
                          }
                          className="group relative rounded-lg border border-emerald-200 overflow-hidden bg-slate-100 aspect-video flex items-center justify-center cursor-pointer"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt={img.name || `รูปแปลง ${imgIdx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SINGLE TARGET READ-ONLY ACTUAL DISPLAY */
        <div className="space-y-4 pt-1 border-t border-slate-100">
          {/* Farmer-Specific Actual Displays */}
          {showFarmerSection && (
            <>
              {/* ที่อยู่บ้านเกษตรกร & พิกัดแปลง */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* ที่อยู่บ้านเกษตรกร */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    ที่อยู่บ้านเกษตรกร
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 font-semibold whitespace-pre-wrap">
                    {farmerHomeAddress || "-"}
                  </p>
                </div>

                {/* พิกัดแปลง (Plot Location) */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                      พิกัดแปลง (Latitude, Longitude)
                    </span>
                    {googleMapsUrl && (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        เปิดใน Google Maps
                      </a>
                    )}
                  </div>
                  {hasCoords ? (
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold text-slate-800">
                      <span>Lat: {effectivePlotLatitude}</span>
                      <span className="text-slate-300">|</span>
                      <span>Lng: {effectivePlotLongitude}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-700 font-semibold">
                      -
                    </span>
                  )}
                </div>
              </div>

              {/* รูปแปลงเกษตรกร (Plot Photos) */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-700 font-bold flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    รูปแปลงเกษตรกร
                  </span>
                  {plotImages && plotImages.length > 0 ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {plotImages.length} รูป
                    </span>
                  ) : null}
                </div>

                {plotImages && plotImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                    {plotImages.map((img, imgIdx) => (
                      <button
                        key={img.id || imgIdx}
                        type="button"
                        onClick={() =>
                          openLightbox(
                            `รูปแปลงเกษตรกร - ${farmerDisplayName}`,
                            plotImages,
                            imgIdx,
                          )
                        }
                        className="group relative rounded-xl border border-emerald-200/80 overflow-hidden bg-slate-100 aspect-video flex items-center justify-center shadow-2xs hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        aria-label={`คลิกเพื่อดูรูปแปลงที่ ${imgIdx + 1} ขนาดใหญ่`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.name || `รูปแปลง ${imgIdx + 1}`}
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
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-white border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                    <ImageIcon className="w-4 h-4 opacity-50 text-slate-400" />
                    <span>ไม่มีรูปภาพแปลงเกษตรกร</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* สินค้าที่ให้คำแนะนำ & โอกาสการขาย */}
          {isAdviceTopic && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
                <span className="text-xs text-slate-500 font-medium block">
                  สินค้าที่ให้คำแนะนำ
                </span>
                {selectedProducts.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {selectedProducts.map((prod, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-emerald-900 border border-emerald-200 shadow-2xs"
                      >
                        <Tag className="w-3 h-3 text-emerald-600" />
                        {prod}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-700 font-semibold">
                    -
                  </span>
                )}
              </div>

              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
                <span className="text-xs text-slate-500 font-medium block">
                  ประเมินโอกาสการขาย
                </span>
                {(target?.salesOpportunity || salesOpportunity) ? (
                  <Badge
                    variant="outline"
                    className={
                      (target?.salesOpportunity || salesOpportunity) === "สูง"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs px-3 py-1"
                        : "bg-rose-50 text-rose-800 border-rose-300 font-bold text-xs px-3 py-1"
                    }
                  >
                    {target?.salesOpportunity || salesOpportunity}
                  </Badge>
                ) : (
                  <span className="text-xs text-slate-700 font-semibold">
                    -
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ผลการพูดคุย */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              ผลการพูดคุย
            </span>
            <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
              {target?.discussionResult || discussionResult || "-"}
            </p>
          </div>

          {/* สิ่งที่ต้องดำเนินการต่อ & วันที่นัดหมายครั้งถัดไป */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-slate-500 font-medium block flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-slate-400" />
                สิ่งที่ต้องดำเนินการต่อ
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
                {target?.nextAction || nextAction || "-"}
              </span>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
              <span className="text-xs text-slate-500 font-medium block flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                วันที่นัดหมายครั้งถัดไป
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
                {formatThaiDate(target?.nextMeetingDate || nextMeetingDate)}
              </span>
            </div>
          </div>
        </div>
      )}

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

export const DetailType1Visit = Type1DetailView;
