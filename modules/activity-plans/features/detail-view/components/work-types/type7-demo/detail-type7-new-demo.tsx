"use client";

import React, { useState } from "react";
import {
  Sprout,
  AlertTriangle,
  ImageIcon,
  Eye,
  Package,
  MapPin,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";
import { ImageFile } from "@/modules/activity-plans/features/actual-view/types";
import {
  ImageLightboxModal,
  LightboxImage,
} from "@/components/custom/image-lightbox-modal";

export interface DemoResultItemData {
  id?: string;
  plannedProductId?: string | null;
  actualProductId?: string | null;
  changeReason?: string | null;
  plotObjective?: string | null;
  plannedProduct?: {
    id: string;
    name: string;
    productCode?: string | null;
    unit?: string | null;
    packageSizeUnit?: string | null;
  } | null;
  actualProduct?: {
    id: string;
    name: string;
    productCode?: string | null;
    unit?: string | null;
    packageSizeUnit?: string | null;
  } | null;
  demoPlotId?: string | null;
}

export interface DetailType7NewDemoProps {
  target: {
    activityType?: "CREATE" | "FOLLOW_UP" | string;
    owner: string;
    product: string;
    crop: string;
    plots: string;
    targetCondition?: string;
    demoProductQuantity?: string | number | null;
    objective?: string;
    experimentDetail?: string;
    detail?: string;
    items?: any[];
  };
  demoResults?: DemoResultItemData[];
  plannedProductId?: string | null;
  actualProductId?: string | null;
  actualQuantity?: string | number | null;
  plannedProductName?: string | null;
  actualProductName?: string | null;
  changeReason?: string | null;
  plotObjective?: string;
  customPlotDetail?: string | null;
  demoPlotId?: string | null;
  plotName?: string;
  usageMethod?: string;
  plantingDate?: string;
  plantingAreaCondition?: string;
  cropImages?: ImageFile[];
  plotImages?: ImageFile[];
  demoPlotData?: any;
}

export function DetailType7NewDemo({
  target,
  demoResults = [],
  plannedProductId,
  actualProductId,
  actualQuantity,
  plannedProductName,
  actualProductName,
  changeReason,
  plotObjective,
  customPlotDetail,
  demoPlotId,
  plotName,
  usageMethod,
  plantingDate,
  plantingAreaCondition,
  cropImages = [],
  plotImages = [],
  demoPlotData,
}: DetailType7NewDemoProps) {
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

  const formatThaiDate = (d?: string | Date | null) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      return dt.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return String(d);
    }
  };

  const effectiveDemoResults =
    demoResults && demoResults.length > 0
      ? demoResults
      : [
          {
            plannedProductId: plannedProductId || null,
            actualProductId: actualProductId || null,
            changeReason: changeReason || null,
            plotObjective: plotObjective || null,
            plannedProduct: plannedProductName
              ? { id: plannedProductId || "", name: plannedProductName }
              : null,
            actualProduct: actualProductName
              ? { id: actualProductId || "", name: actualProductName }
              : null,
          },
        ];

  const firstResult = effectiveDemoResults[0];

  // Planned Product & Unit resolution
  const effectivePlannedId = firstResult?.plannedProductId || plannedProductId || null;
  const rawPlannedName =
    firstResult?.plannedProduct?.name ||
    plannedProductName ||
    target.product ||
    "-";
  const plannedCode = firstResult?.plannedProduct?.productCode;
  const plannedUnit =
    firstResult?.plannedProduct?.unit ||
    firstResult?.plannedProduct?.packageSizeUnit ||
    "";
  const plannedProductDisplay = plannedCode
    ? `${rawPlannedName} (${plannedCode})`
    : rawPlannedName;

  // Actual Product & Unit resolution
  const effectiveActualId = firstResult?.actualProductId || actualProductId || effectivePlannedId;
  const isProductChanged = Boolean(
    effectivePlannedId &&
      effectiveActualId &&
      effectivePlannedId !== effectiveActualId,
  );

  const rawActualName =
    firstResult?.actualProduct?.name ||
    actualProductName ||
    (isProductChanged ? "-" : rawPlannedName);
  const actualCode = firstResult?.actualProduct?.productCode;
  const actualUnit =
    firstResult?.actualProduct?.unit ||
    firstResult?.actualProduct?.packageSizeUnit ||
    (isProductChanged ? "" : plannedUnit) ||
    "";
  const actualProductDisplay = actualCode
    ? `${rawActualName} (${actualCode})`
    : rawActualName;

  // Actual Quantity resolution
  const resolvedActualQuantity =
    actualQuantity !== undefined && actualQuantity !== null && actualQuantity !== ""
      ? String(actualQuantity)
      : target.demoProductQuantity
        ? String(target.demoProductQuantity)
        : "";
  const actualQuantityDisplay = resolvedActualQuantity
    ? actualUnit
      ? `${resolvedActualQuantity} ${actualUnit}`
      : resolvedActualQuantity
    : "-";

  const resolvedChangeReason =
    firstResult?.changeReason || (isProductChanged ? changeReason : null);

  // Planned Target Items (strictly without 'สภาพแปลงเป้าหมาย' / Target Condition)
  const plannedTargetItems = [
    { label: "ประเภทงาน:", value: "ทำแปลงสาธิต (เริ่มทำแปลงใหม่)" },
    { label: "เกษตรกร / เจ้าของแปลง:", value: target.owner || "-" },
    { label: "พืชที่ทดสอบ:", value: target.crop || "-" },
    { label: "สินค้าที่วางแผน:", value: plannedProductDisplay || "-" },
    { label: "จำนวนแปลง / พื้นที่:", value: target.plots || "-" },
    ...(target.demoProductQuantity
      ? [
          {
            label: "จำนวนสินค้าที่ใช้:",
            value: plannedUnit
              ? `${target.demoProductQuantity} ${plannedUnit}`
              : `${target.demoProductQuantity}`,
          },
        ]
      : []),
    ...(target.experimentDetail || target.detail
      ? [
          {
            label: "รายละเอียดการทดลอง:",
            value: target.experimentDetail || target.detail,
          },
        ]
      : []),
  ];

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <Sprout className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-emerald-950 text-base md:text-lg">
              ทำแปลงสาธิต (เริ่มทำแปลงใหม่)
            </h2>
            <span className="text-xs text-emerald-700 font-medium">
              บันทึกผลการจัดทำแปลงสาธิตใหม่ สินค้าที่ใช้จริง และภาพถ่ายสภาพแปลงเริ่มต้น
            </span>
          </div>
        </div>

        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
        >
          NEW DEMO PLOT
        </Badge>
      </div>

      {/* SECTION 1: PLANNED TARGET CARD (No Target Condition field) */}
      <ActualTargetCard
        iconColorClass="text-emerald-700"
        badgeColorClass="bg-emerald-50 text-emerald-800 border border-emerald-200"
        gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
        items={plannedTargetItems}
      />

      {/* SECTION 2: READ-ONLY RESULT DISPLAY */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span>ผลการจัดทำแปลงสาธิตเริ่มต้น</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {/* แปลงเกษตรของเกษตรกร */}
          {(() => {
            const resolvedDemoPlotId = demoPlotId || firstResult?.demoPlotId;
            const isOtherPlot =
              resolvedDemoPlotId === "OTHER" ||
              resolvedDemoPlotId?.startsWith("OTHER:") ||
              Boolean(customPlotDetail);
            const resolvedCustomDetail =
              customPlotDetail ||
              (resolvedDemoPlotId?.startsWith("OTHER:")
                ? resolvedDemoPlotId.replace("OTHER:", "")
                : "");

            return (
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  แปลงเกษตรของเกษตรกร
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                  {isOtherPlot
                    ? "แปลงอื่นๆ"
                    : demoPlotData?.name ||
                      (resolvedDemoPlotId && resolvedDemoPlotId !== "OTHER"
                        ? `แปลงรหัส ${resolvedDemoPlotId}`
                        : "-")}
                </span>
                {isOtherPlot && resolvedCustomDetail && (
                  <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200 mt-1">
                    <span className="font-semibold text-slate-700 block mb-0.5">
                      รายละเอียดแปลง:
                    </span>
                    <span className="whitespace-pre-wrap">{resolvedCustomDetail}</span>
                  </div>
                )}
                {!isOtherPlot && demoPlotData?.code && (
                  <span className="text-[11px] text-slate-500 font-mono block">
                    รหัสแปลง: {demoPlotData.code}
                  </span>
                )}
              </div>
            );
          })()}

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              วันที่เริ่มปลูกจริง
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {plantingDate ? formatThaiDate(plantingDate) : "-"}
            </span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              สภาพพื้นที่ปลูกตอนเริ่มต้น
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {plantingAreaCondition || "-"}
            </span>
          </div>

          {(firstResult?.plotObjective || plotObjective) && (
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-3">
              <span className="text-xs text-slate-500 font-medium block">
                วัตถุประสงค์ของแปลง
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
                {firstResult?.plotObjective || plotObjective}
              </span>
            </div>
          )}

          {/* Actual Demonstration Product with Change Tracking */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5 sm:col-span-2 md:col-span-3">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-700" />
                สินค้าที่ใช้สาธิตจริง (Actual Demonstration Product)
              </span>
              {isProductChanged && (
                <Badge
                  variant="outline"
                  className="bg-amber-100 text-amber-900 border-amber-300 font-bold gap-1 text-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  ⚠️ มีการเปลี่ยนสินค้าหน้างาน
                </Badge>
              )}
            </div>

            {!isProductChanged ? (
              <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-medium block">
                    สินค้าที่ใช้สาธิตจริง
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {actualProductDisplay}
                    </span>
                    {resolvedActualQuantity && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-slate-100 text-slate-700 font-medium"
                      >
                        จำนวน {actualQuantityDisplay}
                      </Badge>
                    )}
                  </div>
                </div>
                <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ตรงตามแผนที่วางไว้
                </span>
              </div>
            ) : (
              <div className="p-4 bg-amber-50/60 border border-amber-200/90 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 font-medium block">
                      สินค้าที่ใช้จริงหน้างาน
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-950">
                        {actualProductDisplay}
                      </span>
                      {resolvedActualQuantity && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-amber-100 text-amber-900 font-bold border border-amber-200"
                        >
                          จำนวน {actualQuantityDisplay}
                        </Badge>
                      )}
                      <span className="text-xs text-slate-400">
                        (สินค้าตามแผน:{" "}
                        <span className="line-through">{plannedProductDisplay}</span>)
                      </span>
                    </div>
                  </div>
                </div>

                {resolvedChangeReason && (
                  <div className="pt-2.5 border-t border-amber-200/70 text-xs text-amber-950">
                    <span className="font-bold text-amber-900 block mb-0.5">
                      เหตุผลที่เปลี่ยนหน้างาน:
                    </span>
                    <p className="text-amber-900 leading-relaxed font-medium bg-white/70 p-2.5 rounded-lg border border-amber-200/60">
                      {resolvedChangeReason}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* วิธีการใช้สาร / สูตรยา */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-3">
            <span className="text-xs text-slate-500 font-medium block">
              วิธีการใช้สาร / สูตรยา
            </span>
            <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
              {usageMethod || "-"}
            </p>
          </div>
        </div>

        {/* DEMO PHOTOS (CROP & PLOT IMAGES) */}
        {(cropImages.length > 0 || plotImages.length > 0) && (
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-4">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              ภาพถ่ายสภาพแปลงเริ่มต้น (Initial Demonstration Photos)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cropImages.length > 0 && (
                <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200/70">
                  <span className="text-xs font-semibold text-slate-700 block">
                    ภาพถ่ายสภาพพืชเริ่มต้น ({cropImages.length} รูป)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {cropImages.map((img, i) => (
                      <button
                        key={img.id || i}
                        type="button"
                        onClick={() =>
                          openLightbox("ภาพถ่ายสภาพพืชเริ่มต้น", cropImages, i)
                        }
                        className="group relative aspect-video rounded-md overflow-hidden bg-slate-100 border border-slate-200 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.name || `ภาพสภาพพืชที่ ${i + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {plotImages.length > 0 && (
                <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200/70">
                  <span className="text-xs font-semibold text-slate-700 block">
                    ภาพถ่ายสภาพแปลงเริ่มต้น ({plotImages.length} รูป)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {plotImages.map((img, i) => (
                      <button
                        key={img.id || i}
                        type="button"
                        onClick={() =>
                          openLightbox("ภาพถ่ายสภาพแปลงเริ่มต้น", plotImages, i)
                        }
                        className="group relative aspect-video rounded-md overflow-hidden bg-slate-100 border border-slate-200 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.name || `ภาพสภาพแปลงที่ ${i + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <ImageLightboxModal
        isOpen={lightboxState.isOpen}
        onClose={closeLightbox}
        images={lightboxState.images}
        initialIndex={lightboxState.initialIndex}
        title={lightboxState.title}
      />
    </div>
  );
}

