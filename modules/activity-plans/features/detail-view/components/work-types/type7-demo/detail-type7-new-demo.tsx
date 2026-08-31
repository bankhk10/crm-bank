"use client";

import React, { useState } from "react";
import {
  Sprout,
  AlertTriangle,
  ImageIcon,
  Eye,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  plannedProduct?: { id: string; name: string; productCode?: string | null } | null;
  actualProduct?: { id: string; name: string; productCode?: string | null } | null;
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
  plannedProductName?: string | null;
  actualProductName?: string | null;
  changeReason?: string | null;
  plotName?: string;
  usageMethod?: string;
  plantingDate?: string;
  plantingAreaCondition?: string;
  cropImages?: ImageFile[];
  plotImages?: ImageFile[];
}

export function DetailType7NewDemo({
  target,
  demoResults = [],
  plannedProductId,
  actualProductId,
  plannedProductName,
  actualProductName,
  changeReason,
  plotName,
  usageMethod,
  plantingDate,
  plantingAreaCondition,
  cropImages = [],
  plotImages = [],
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
            plannedProduct: plannedProductName
              ? { id: plannedProductId || "", name: plannedProductName }
              : null,
            actualProduct: actualProductName
              ? { id: actualProductId || "", name: actualProductName }
              : null,
          },
        ];

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
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

        <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs bg-emerald-100 text-emerald-800 border border-emerald-300">
          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>ประเภท: ทำแปลงสาธิต (เริ่มทำแปลงใหม่)</span>
        </span>
      </div>

      {/* PLANNED TARGET CARD */}
      <ActualTargetCard
        iconColorClass="text-emerald-700"
        badgeColorClass="bg-emerald-50 text-emerald-800 border border-emerald-200"
        gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
        items={[
          { label: "ประเภทงาน:", value: "ทำแปลงสาธิต (เริ่มทำแปลงใหม่)" },
          { label: "เกษตรกร/เจ้าของแปลง:", value: target.owner || "-" },
          { label: "พืชที่ทดสอบ:", value: target.crop || "-" },
          { label: "สินค้าที่วางแผน:", value: target.product || "-" },
          { label: "จำนวนแปลง/พื้นที่:", value: target.plots || "-" },
          {
            label: "จำนวนสินค้าที่ใช้:",
            value: target.demoProductQuantity
              ? `${target.demoProductQuantity}`
              : "-",
          },
          {
            label: "สภาพแปลงเป้าหมาย:",
            value: target.targetCondition || target.objective || "-",
          },
          {
            label: "รายละเอียดการทดลอง:",
            value: target.experimentDetail || target.detail || "-",
          },
        ]}
      />

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span>ผลการจัดทำแปลงสาธิตเริ่มต้น</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              ชื่อแปลงสาธิต / รหัสแปลง
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 block">
              {plotName || target.owner || "-"}
            </span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
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

          {/* Actual Demonstration Product with Change Tracking */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5 sm:col-span-2 md:col-span-3">
            <span className="text-xs text-slate-500 font-medium block">
              สินค้าที่ใช้สาธิตจริง (Actual Product)
            </span>

            <div className="space-y-2">
              {effectiveDemoResults.map((resItem, idx) => {
                const itemPlannedId = resItem.plannedProductId;
                const itemActualId = resItem.actualProductId;
                // Change detection rule: STRICTLY based on product ID (plannedProductId !== actualProductId)
                const isItemChanged = Boolean(
                  itemPlannedId &&
                    itemActualId &&
                    itemPlannedId !== itemActualId,
                );
                const itemActualName =
                  resItem.actualProduct?.name ||
                  actualProductName ||
                  target.product ||
                  "-";
                const itemPlannedName =
                  resItem.plannedProduct?.name ||
                  plannedProductName ||
                  target.product ||
                  "-";
                const itemReason =
                  resItem.changeReason || (isItemChanged ? changeReason : null);

                return (
                  <div
                    key={resItem.id || idx}
                    className={cn(
                      "p-3 rounded-lg border transition-all space-y-1.5",
                      isItemChanged
                        ? "bg-amber-50/60 border-amber-200/90 shadow-2xs"
                        : "bg-white border-slate-200/70 shadow-2xs",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          {itemActualName}
                        </span>
                        {isItemChanged && (
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-900 border-amber-300 font-bold gap-1 text-[11px]"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            ⚠️ เปลี่ยนสินค้าหน้างาน
                          </Badge>
                        )}
                      </div>
                    </div>

                    {isItemChanged && (
                      <div className="text-xs text-slate-500">
                        สินค้าตามแผน:{" "}
                        <span className="font-semibold text-slate-700">
                          {itemPlannedName}
                        </span>
                      </div>
                    )}

                    {isItemChanged && itemReason && (
                      <div className="mt-1.5 text-xs bg-amber-100/70 border border-amber-200/80 rounded-md p-2 text-amber-950 space-y-0.5">
                        <span className="font-bold text-amber-900 block">
                          เหตุผลที่เปลี่ยนหน้างาน:
                        </span>
                        <p className="text-amber-900 leading-relaxed font-medium">
                          {itemReason}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

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
