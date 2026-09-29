"use client";

import React, { useState, useRef } from "react";
import {
  MapPin,
  Compass,
  Plus,
  Trash2,
  AlertCircle,
  Package,
  Layers,
  Camera,
  UploadCloud,
  CheckCircle2,
  Beaker,
  AlertTriangle,
  Info,
  Eye,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/hooks/use-file-upload";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/form-components";
import { EXTERNAL_CHEMICAL_FORMULAS } from "../../../constants";
import type {
  useType13ActualState,
  Type13PlotActualState,
} from "./use-type13-actual-state";

export interface Type13ActualProps {
  isVisible?: boolean;
  actualState: ReturnType<typeof useType13ActualState>;
  products: Array<{
    id: string;
    name: string;
    unit?: string | null;
    productCode?: string | null;
  }>;
  readonly?: boolean;
}

const SPRAY_EQUIPMENT_OPTIONS = [
  { value: "เครื่องยนต์พ่นยา", label: "เครื่องยนต์พ่นยา" },
  { value: "โดรนพ่นยา", label: "โดรนพ่นยา" },
  { value: "เครื่องสะพายหลัง", label: "เครื่องสะพายหลัง" },
  { value: "ปั๊มลากสาย", label: "ปั๊มลากสาย" },
  { value: "อื่นๆ ระบุ", label: "อื่นๆ ระบุ" },
];

const PRODUCT_RESPONSE_OPTIONS = [
  { value: "ปกติ", label: "ปกติ" },
  { value: "ใบไหม้", label: "ใบไหม้" },
  { value: "ยอดหงิก", label: "ยอดหงิก" },
  { value: "ตกตะกอน", label: "ตกตะกอน" },
  { value: "ยาไม่ละลาย", label: "ยาไม่ละลาย" },
  { value: "อื่นๆ", label: "อื่นๆ" },
];

const FORMULA_OPTIONS = EXTERNAL_CHEMICAL_FORMULAS.map((f) => ({
  value: f,
  label: f,
}));

interface PlotAfterSpraySectionProps {
  plot: Type13PlotActualState;
  plotIdx: number;
  readonly: boolean;
  addPlotAfterSprayImages: (plotIndex: number, newFiles: File[]) => void;
  removePlotAfterSprayImage: (plotIndex: number, imageIndex: number) => void;
  setPreviewModalUrl: (url: string | null) => void;
}

function PlotAfterSpraySection({
  plot,
  plotIdx,
  readonly,
  addPlotAfterSprayImages,
  removePlotAfterSprayImage,
  setPreviewModalUrl,
}: PlotAfterSpraySectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images = plot.afterSprayImages || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-emerald-600" />
          <h5 className="font-bold text-sm text-slate-800">รูปหลังฉีดพ่น</h5>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            รูป {images.length}/5
          </span>
        </div>

        {!readonly && (
          <div>
            {images.length < 5 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 font-medium transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มรูป</span>
              </button>
            ) : (
              <span className="text-xs text-amber-700 font-medium bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                ครบ 5 รูปแล้ว
              </span>
            )}
          </div>
        )}
      </div>

      {/* Upload Drop Zone (product-form / GalleryUpload style) */}
      {!readonly && images.length < 5 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const filesArray = Array.from(e.dataTransfer.files).filter((f) =>
                f.type.startsWith("image/"),
              );
              if (filesArray.length > 0) {
                addPlotAfterSprayImages(plotIdx, filesArray);
              }
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-4 sm:p-5 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left",
            isDragging
              ? "border-emerald-500 bg-emerald-50/50"
              : "border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวางที่นี่
              </p>
              <p className="text-[11px] text-slate-500">
                รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 20MB (สูงสุด 5 รูปต่อแปลง)
              </p>
            </div>
          </div>

          <span className="h-8 px-3.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 font-medium transition-colors shadow-2xs shrink-0 pointer-events-none">
            <Plus className="w-3.5 h-3.5" />
            <span>เลือกไฟล์รูปภาพ</span>
          </span>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                const filesArray = Array.from(e.target.files);
                addPlotAfterSprayImages(plotIdx, filesArray);
                e.target.value = "";
              }
            }}
            className="hidden"
          />
        </div>
      )}

      {/* Photo List (Stacked vertically, patterned after type7-demo.tsx) */}
      {images.length === 0 ? (
        <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
          ยังไม่มีรูปหลังฉีดพ่นสำหรับแปลงนี้ (สามารถอัปโหลดได้สูงสุด 5 รูป)
        </div>
      ) : (
        <div className="space-y-3">
          {images.map((img, imgIdx) => (
            <div
              key={
                img.id
                  ? `${plot.demoPlotId}-${img.id}`
                  : `${plot.demoPlotId}-after-spray-${imgIdx}`
              }
              className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3 hover:border-emerald-300 transition-all"
            >
              {/* Header bar matching type7-demo */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-800">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold bg-emerald-100 text-emerald-700">
                    {imgIdx + 1}
                  </span>
                  รูปที่ {imgIdx + 1}
                </span>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => removePlotAfterSprayImage(plotIdx, imgIdx)}
                    className="p-1 rounded-md text-red-500 hover:bg-red-50 text-xs font-medium flex items-center gap-1 transition-colors"
                    title="ลบรูปนี้"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>ลบรูป</span>
                  </button>
                )}
              </div>

              {/* Content row: [Preview] [Info] */}
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Thumbnail Preview */}
                <div
                  className="relative group w-24 h-20 sm:w-32 sm:h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 cursor-pointer"
                  onClick={() => setPreviewModalUrl(img.url)}
                  title="คลิกเพื่อดูรูปขนาดเต็ม"
                >
                  <img
                    src={img.url}
                    alt={img.name || `after-spray-${imgIdx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Eye className="w-4 h-4 text-white drop-shadow-md" />
                  </div>
                </div>

                {/* Photo Information & Status */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <p
                    className="text-xs sm:text-sm font-semibold text-slate-800 truncate"
                    title={img.name}
                  >
                    {img.name || `รูปที่ ${imgIdx + 1}`}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    {img.size > 0 && <span>{formatBytes(img.size)}</span>}
                    {img.type && (
                      <span className="uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                        {img.type.replace("image/", "")}
                      </span>
                    )}
                    {img.rawFile ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        พร้อมบันทึก
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        อัปโหลดแล้ว
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Type13Actual({
  isVisible = true,
  actualState,
  products = [],
  readonly = false,
}: Type13ActualProps) {
  const {
    plotsActual,
    addPlot,
    removePlot,
    updatePlotInfo,
    updatePlotCoordinates,
    addSprayingRound,
    removeSprayingRound,
    updateRoundField,
    updateRoundProduct,
    addRoundProduct,
    removeRoundProduct,
    addExternalProduct,
    removeExternalProduct,
    updateExternalProduct,
    addRoundAttachment,
    removeRoundAttachment,
    addPlotAfterSprayImages,
    removePlotAfterSprayImage,
  } = actualState;

  const [gpsLoadingPlotIdx, setGpsLoadingPlotIdx] = useState<number | null>(
    null,
  );
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  if (!isVisible || plotsActual.length === 0) return null;

  // Handler: Add new plot on-the-fly
  const handleAddPlot = () => {
    if (plotsActual.length >= 10 || readonly) return;
    addPlot();
  };

  // Handler: Remove plot (only new plots)
  const handleRemovePlot = (idxToRemove: number) => {
    if (plotsActual.length <= 1 || readonly) return;
    const targetPlot = plotsActual[idxToRemove];
    if (!targetPlot?.isNew) return;
    if (
      !window.confirm(
        `คุณต้องการลบ "${targetPlot.plotName || `แปลงที่ ${idxToRemove + 1}`}" ใช่หรือไม่?`,
      )
    ) {
      return;
    }
    removePlot(idxToRemove);
  };

  // Handler: Get GPS Location
  const handleGetCurrentLocation = (plotIdx: number) => {
    if (!navigator.geolocation) {
      alert("เบราว์เซอร์ของคุณไม่รองรับการดึงพิกัด GPS");
      return;
    }
    setGpsLoadingPlotIdx(plotIdx);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoadingPlotIdx(null);
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        updatePlotCoordinates(plotIdx, lat, lng);
      },
      (error) => {
        setGpsLoadingPlotIdx(null);
        alert(`ไม่สามารถดึงพิกัด GPS ได้: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Handler: Upload photo before spray (max 2)
  const handlePhotoUpload = (
    plotIdx: number,
    roundIdx: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const targetPlot = plotsActual[plotIdx];
    const round = targetPlot?.sprayRounds[roundIdx];
    const currentAttsCount = (round?.attachments || []).length;
    const availableSlots = 2 - currentAttsCount;

    if (availableSlots <= 0) {
      alert("สามารถอัปโหลดรูปภาพก่อนฉีดพ่นได้สูงสุด 2 รูปต่อรอบเท่านั้น");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots);

    filesToUpload.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const base64 = loadEvt.target?.result as string;
        addRoundAttachment(plotIdx, roundIdx, {
          fileUrl: base64,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const productOptions = products.map((p) => ({
    value: p.id,
    label: p.name,
    subLabel: p.unit ? `หน่วย: ${p.unit}` : undefined,
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 space-y-6 shadow-xs">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 font-bold">
            13
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <span>บันทึกผลงานจริง: ฉีดแปลงแฮตแทค (TYPE_13)</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                {plotsActual.length} แปลง
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              กรุณาระบุพิกัด GPS และบันทึกผลการฉีดพ่นในแต่ละแปลง
            </p>
          </div>
        </div>

        {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={handleAddPlot}
            disabled={plotsActual.length >= 10}
            className="h-9 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มแปลงแฮตแทคใหม่ ({plotsActual.length}/10)</span>
          </Button>
        )}
      </div>

      {/* Plots Stacked List (Vertical) */}
      <div className="space-y-6">
        {plotsActual.map((plot, plotIdx) => {
          const plotDisplayName =
            plot.plotName ||
            (plot.isNew
              ? `แปลงแฮตแทค ${plotIdx + 1}`
              : `แปลงที่ ${plotIdx + 1}`);

          return (
            <div
              key={plot.demoPlotId || `plot-${plotIdx}`}
              className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-6 shadow-xs hover:border-emerald-200 transition-colors"
            >
              {/* Plot Info Banner / Form */}
              <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {plotIdx + 1}
                    </div>
                    <span className="font-bold text-slate-800 text-sm">
                      {plot.isNew
                        ? `แปลงพบหน้างาน (สร้างใหม่) #${plotIdx + 1}`
                        : plotDisplayName}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        plot.isNew
                          ? "bg-purple-100 text-purple-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {plot.isNew ? "แปลงใหม่" : "แปลงตามแผน"}
                    </span>
                  </div>

                  {/* Remove button for new plots */}
                  {plot.isNew && !readonly && plotsActual.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePlot(plotIdx)}
                      className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบแปลงนี้</span>
                    </Button>
                  )}
                </div>

                {plot.isNew ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ชื่อแปลง / รายละเอียดแปลง{" "}
                        <span className="text-slate-400 font-normal">
                          (ถ้ามี)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={plot.plotName}
                        onChange={(e) =>
                          updatePlotInfo(plotIdx, "plotName", e.target.value)
                        }
                        placeholder="เช่น แปลงริมคลอง 7, แปลงหญ้าข้างสวนนายเอ"
                        disabled={readonly}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        หมายเหตุ / จุดสังเกต{" "}
                        <span className="text-slate-400 font-normal">
                          (ถ้ามี)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={plot.district || ""}
                        onChange={(e) =>
                          updatePlotInfo(plotIdx, "district", e.target.value)
                        }
                        placeholder="เช่น ใกล้สะพานไม้, จุดสังเกต"
                        disabled={readonly}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {plot.dealerName && (
                      <span>ร้านค้า Dealer: {plot.dealerName}</span>
                    )}
                    {plot.province && (
                      <span>
                        • {plot.district || ""}, {plot.province}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* GPS Section (Required) */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <h6 className="font-bold text-xs text-slate-800">
                      พิกัด GPS ของแปลง{" "}
                      <span className="text-red-500">* (บังคับระบุ)</span>
                    </h6>
                  </div>

                  {!readonly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleGetCurrentLocation(plotIdx)}
                      disabled={gpsLoadingPlotIdx === plotIdx}
                      className="h-8 px-2.5 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-lg flex items-center gap-1.5"
                    >
                      <Compass
                        className={`w-3.5 h-3.5 ${gpsLoadingPlotIdx === plotIdx ? "animate-spin" : ""}`}
                      />
                      <span>
                        {gpsLoadingPlotIdx === plotIdx
                          ? "กำลังดึงพิกัด..."
                          : "ดึงตำแหน่งปัจจุบัน (GPS)"}
                      </span>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      ละติจูด (Latitude) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={plot.latitude}
                      onChange={(e) =>
                        updatePlotCoordinates(
                          plotIdx,
                          e.target.value,
                          plot.longitude,
                        )
                      }
                      disabled={readonly}
                      placeholder="เช่น 13.756331"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      ลองจิจูด (Longitude){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={plot.longitude}
                      onChange={(e) =>
                        updatePlotCoordinates(
                          plotIdx,
                          plot.latitude,
                          e.target.value,
                        )
                      }
                      disabled={readonly}
                      placeholder="เช่น 100.501765"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                </div>

                {!plot.latitude || !plot.longitude ? (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      จำเป็นต้องระบุพิกัด Latitude และ Longitude
                      ให้ครบถ้วนก่อนบันทึกผลงาน
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <a
                      href={`https://maps.google.com/?q=${plot.latitude},${plot.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:text-emerald-700"
                    >
                      ดูตำแหน่งบน Google Maps
                    </a>
                  </div>
                )}
              </div>

              {/* Spraying Rounds Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2">
                      <Beaker className="w-4 h-4 text-emerald-600" />
                      <span>รอบการฉีดพ่น (Spraying Rounds)</span>
                      <span className="text-xs text-slate-500 font-normal">
                        ({plot.sprayRounds.length} รอบ)
                      </span>
                    </h5>
                  </div>

                  {!readonly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addSprayingRound(plotIdx)}
                      className="h-8 px-2.5 text-xs text-emerald-700 border-dashed border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100 rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มรอบฉีดพ่น</span>
                    </Button>
                  )}
                </div>

                {/* Rounds List */}
                <div className="space-y-4">
                  {plot.sprayRounds.map((round, rIdx) => (
                    <div
                      key={rIdx}
                      className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-2xs"
                    >
                      {/* Round Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                            {round.roundNumber}
                          </span>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm">
                            รอบที่ {round.roundNumber}
                          </span>
                        </div>

                        {!readonly && plot.sprayRounds.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeSprayingRound(plotIdx, rIdx)
                            }
                            className="p-1 rounded-md text-red-500 hover:bg-red-50 text-xs font-medium flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบรอบนี้</span>
                          </button>
                        )}
                      </div>

                      {/* Round Metadata Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {/* วันที่ฉีดพ่น */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            วันที่ฉีดพ่น <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={round.sprayDate}
                            onChange={(e) =>
                              updateRoundField(
                                plotIdx,
                                rIdx,
                                "sprayDate",
                                e.target.value,
                              )
                            }
                            disabled={readonly}
                            className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                          />
                        </div>

                        {/* วิธีการฉีดพ่น: SINGLE vs TANK_MIXED */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            วิธีการฉีดพ่น{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2 h-9">
                            <button
                              type="button"
                              onClick={() =>
                                updateRoundField(
                                  plotIdx,
                                  rIdx,
                                  "sprayMethod",
                                  "SINGLE",
                                )
                              }
                              disabled={readonly}
                              className={`rounded-lg text-xs font-semibold transition-all border ${
                                round.sprayMethod === "SINGLE"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              ฉีดเดี่ยว (Single)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateRoundField(
                                  plotIdx,
                                  rIdx,
                                  "sprayMethod",
                                  "TANK_MIXED",
                                )
                              }
                              disabled={readonly}
                              className={`rounded-lg text-xs font-semibold transition-all border ${
                                round.sprayMethod === "TANK_MIXED"
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-300 font-bold"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              ผสมถัง (Tank-mixed)
                            </button>
                          </div>
                        </div>

                        {/* อุปกรณ์ที่ใช้ */}
                        <div>
                          <FormCombobox
                            id={`equipment-${plotIdx}-${rIdx}`}
                            label="อุปกรณ์ที่ใช้"
                            labelClassName="block text-xs font-semibold text-slate-600 mb-1 mx-0"
                            triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            value={round.sprayEquipment || ""}
                            onChange={(val) =>
                              updateRoundField(
                                plotIdx,
                                rIdx,
                                "sprayEquipment",
                                val,
                              )
                            }
                            options={SPRAY_EQUIPMENT_OPTIONS}
                            placeholder="เลือกอุปกรณ์..."
                            disabled={readonly}
                            required
                          />
                        </div>

                        {round.sprayEquipment === "อื่นๆ ระบุ" && (
                          <div className="sm:col-span-2 md:col-span-3">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              ระบุอุปกรณ์อื่นๆ{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={round.otherEquipment || ""}
                              onChange={(e) =>
                                updateRoundField(
                                  plotIdx,
                                  rIdx,
                                  "otherEquipment",
                                  e.target.value,
                                )
                              }
                              disabled={readonly}
                              placeholder="ระบุชื่ออุปกรณ์..."
                              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                            />
                          </div>
                        )}

                        {/* ผลหลังการฉีดพ่น */}
                        <div>
                          <FormCombobox
                            id={`response-${plotIdx}-${rIdx}`}
                            label="ผลหลังการฉีดพ่น"
                            labelClassName="block text-xs font-semibold text-slate-600 mb-1 mx-0"
                            triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                            value={round.productResponse || "ปกติ"}
                            onChange={(val) =>
                              updateRoundField(
                                plotIdx,
                                rIdx,
                                "productResponse",
                                val,
                              )
                            }
                            options={PRODUCT_RESPONSE_OPTIONS}
                            placeholder="เลือกผลการตอบสนอง..."
                            disabled={readonly}
                            required
                          />
                        </div>

                        {round.productResponse !== "ปกติ" && (
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              รายละเอียดปัญหา/ความผิดปกติ{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={round.problemDetail || ""}
                              onChange={(e) =>
                                updateRoundField(
                                  plotIdx,
                                  rIdx,
                                  "problemDetail",
                                  e.target.value,
                                )
                              }
                              disabled={readonly}
                              placeholder="ระบุอาการ เช่น ปลายใบไหม้เล็กน้อย..."
                              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                            />
                          </div>
                        )}
                      </div>

                      {/* Products Used in this Round */}
                      <div className="pt-3 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ยา/สารเคมีที่ใช้ในรอบนี้</span>
                          </label>
                          {!readonly && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addRoundProduct(plotIdx, rIdx)}
                              className="h-7 px-2 text-xs text-emerald-700 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100 rounded-lg flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>เพิ่มรายการยา</span>
                            </Button>
                          )}
                        </div>

                        {/* Products List Table/Cards */}
                        <div className="space-y-2.5">
                          {round.products.map((prod, pIdx) => {
                            const isWithdrawn = !prod.isAdditional;

                            return (
                              <div
                                key={pIdx}
                                className={`p-3 rounded-xl border transition-colors space-y-2.5 ${
                                  isWithdrawn
                                    ? "bg-slate-50/80 border-slate-200"
                                    : "bg-amber-50/30 border-amber-200"
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {isWithdrawn ? (
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-slate-800 text-xs sm:text-sm">
                                          {prod.productName ||
                                            "สินค้าไม่ระบุชื่อ"}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                          จากรายการเบิก
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 flex-1 max-w-md flex-wrap sm:flex-nowrap">
                                        {readonly ? (
                                          <span className="font-bold text-slate-800 text-xs sm:text-sm">
                                            {prod.productName ||
                                              "สินค้าเพิ่มเติม (ไม่ระบุ)"}
                                          </span>
                                        ) : (
                                          <div className="w-full sm:w-64">
                                            <FormCombobox
                                              id={`product-${plotIdx}-${rIdx}-${pIdx}`}
                                              label=""
                                              value={prod.productId || ""}
                                              onChange={(val) => {
                                                const selected = products.find(
                                                  (p) => p.id === val,
                                                );
                                                updateRoundProduct(
                                                  plotIdx,
                                                  rIdx,
                                                  pIdx,
                                                  "productId",
                                                  val,
                                                );
                                                if (selected) {
                                                  updateRoundProduct(
                                                    plotIdx,
                                                    rIdx,
                                                    pIdx,
                                                    "productName",
                                                    selected.name,
                                                  );
                                                  if (selected.unit) {
                                                    updateRoundProduct(
                                                      plotIdx,
                                                      rIdx,
                                                      pIdx,
                                                      "unit",
                                                      selected.unit,
                                                    );
                                                  }
                                                }
                                              }}
                                              options={productOptions}
                                              placeholder="เลือกสินค้าจาก Product Master..."
                                              searchPlaceholder="ค้นหาสินค้า..."
                                              emptyText="ไม่พบสินค้า"
                                              disabled={readonly}
                                              triggerClassName="h-8 min-h-[32px] text-xs bg-white border-amber-300"
                                            />
                                          </div>
                                        )}
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                          เพิ่มเติม / ไม่ได้เบิก
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                    {isWithdrawn &&
                                      prod.withdrawnQuantity != null && (
                                        <span className="text-xs text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                                          จำนวนที่เบิก:{" "}
                                          <strong className="text-emerald-700 font-bold">
                                            {prod.withdrawnQuantity}
                                          </strong>{" "}
                                          {prod.unit || "หน่วย"}
                                        </span>
                                      )}

                                    {!readonly && round.products.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeRoundProduct(
                                            plotIdx,
                                            rIdx,
                                            pIdx,
                                          )
                                        }
                                        className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-white transition-colors"
                                        title="ลบสินค้ารายการนี้ออกจากรอบ"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Inputs Row: จำนวนที่ใช้จริง, อัตราการใช้ */}
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
                                  {/* จำนวนที่ใช้จริง */}
                                  <div className="sm:col-span-3">
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                      จำนวนที่ใช้จริง{" "}
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        min={0}
                                        step="any"
                                        value={prod.quantityUsed ?? ""}
                                        onChange={(e) =>
                                          updateRoundProduct(
                                            plotIdx,
                                            rIdx,
                                            pIdx,
                                            "quantityUsed",
                                            e.target.value === ""
                                              ? ""
                                              : parseFloat(e.target.value) || 0,
                                          )
                                        }
                                        disabled={readonly}
                                        placeholder="ระบุจำนวนจริง"
                                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                                      />
                                      <span className="text-[11px] text-slate-500 whitespace-nowrap min-w-[36px]">
                                        {prod.unit || "หน่วย"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* อัตราการใช้ */}
                                  <div className="sm:col-span-4">
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                      อัตราการใช้{" "}
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={prod.actualRate}
                                      onChange={(e) =>
                                        updateRoundProduct(
                                          plotIdx,
                                          rIdx,
                                          pIdx,
                                          "actualRate",
                                          e.target.value,
                                        )
                                      }
                                      disabled={readonly}
                                      placeholder="เช่น 20 ซีซี/น้ำ 20 ลิตร"
                                      className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tank-mixed External Chemicals Section */}
                      {round.sprayMethod === "TANK_MIXED" && (
                        <div className="pt-3 border-t border-slate-100 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                              <Beaker className="w-3.5 h-3.5 text-indigo-600" />
                              <span>
                                สารเคมีภายนอกที่นำมาผสมถัง (External Chemicals):
                              </span>
                            </label>
                            {!readonly && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  addExternalProduct(plotIdx, rIdx)
                                }
                                className="h-7 px-2 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50 rounded-lg flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>เพิ่มสารเคมีผสม</span>
                              </Button>
                            )}
                          </div>

                          {(round.externalProducts || []).length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic py-1">
                              ยังไม่มีรายการสารเคมีภายนอก
                              กดปุ่มเพิ่มเพื่อระบุสารที่นำมาผสมถัง
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {(round.externalProducts || []).map(
                                (ext, eIdx) => (
                                  <div
                                    key={eIdx}
                                    className="p-2.5 bg-indigo-50/40 rounded-xl border border-indigo-100 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs"
                                  >
                                    <div className="sm:col-span-3">
                                      <input
                                        type="text"
                                        value={ext.company}
                                        onChange={(e) =>
                                          updateExternalProduct(
                                            plotIdx,
                                            rIdx,
                                            eIdx,
                                            "company",
                                            e.target.value,
                                          )
                                        }
                                        disabled={readonly}
                                        placeholder="บริษัทผู้ผลิต"
                                        className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs bg-white"
                                      />
                                    </div>
                                    <div className="sm:col-span-3">
                                      <input
                                        type="text"
                                        value={ext.productName}
                                        onChange={(e) =>
                                          updateExternalProduct(
                                            plotIdx,
                                            rIdx,
                                            eIdx,
                                            "productName",
                                            e.target.value,
                                          )
                                        }
                                        disabled={readonly}
                                        placeholder="ชื่อสารเคมี/ตัวยา"
                                        className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs bg-white font-medium"
                                      />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <FormCombobox
                                        id={`formula-${plotIdx}-${rIdx}-${eIdx}`}
                                        label=""
                                        triggerClassName="h-8 min-h-[32px] py-0.5 text-xs bg-white border-slate-200 rounded-md"
                                        value={ext.formula}
                                        onChange={(val) =>
                                          updateExternalProduct(
                                            plotIdx,
                                            rIdx,
                                            eIdx,
                                            "formula",
                                            val,
                                          )
                                        }
                                        options={FORMULA_OPTIONS}
                                        placeholder="สูตร..."
                                        disabled={readonly}
                                      />
                                    </div>
                                    <div className="sm:col-span-3">
                                      <input
                                        type="text"
                                        value={ext.applicationRate}
                                        onChange={(e) =>
                                          updateExternalProduct(
                                            plotIdx,
                                            rIdx,
                                            eIdx,
                                            "applicationRate",
                                            e.target.value,
                                          )
                                        }
                                        disabled={readonly}
                                        placeholder="อัตราการใช้"
                                        className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs bg-white"
                                      />
                                    </div>
                                    {!readonly && (
                                      <div className="sm:col-span-1 flex justify-center">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeExternalProduct(
                                              plotIdx,
                                              rIdx,
                                              eIdx,
                                            )
                                          }
                                          className="p-1 text-slate-400 hover:text-rose-500 rounded"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Before-spray Photos (Max 2 per round) */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-emerald-600" />
                            <span>รูปภาพก่อนฉีดพ่น (สูงสุด 2 รูปต่อรอบ)</span>
                            <span className="text-[11px] font-semibold text-emerald-600">
                              ({(round.attachments || []).length}/2 รูป)
                            </span>
                          </label>

                          {!readonly &&
                            (round.attachments || []).length < 2 && (
                              <label className="cursor-pointer h-7 px-2.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-1">
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>เพิ่มรูปถ่าย</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) =>
                                    handlePhotoUpload(plotIdx, rIdx, e)
                                  }
                                  className="hidden"
                                />
                              </label>
                            )}
                        </div>

                        {/* Photo Thumbnails */}
                        {(round.attachments || []).length === 0 ? (
                          <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                            ยังไม่มีรูปภาพก่อนฉีดพ่นสำหรับรอบนี้
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {(round.attachments || []).map((att, aIdx) => (
                              <div
                                key={aIdx}
                                className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100"
                              >
                                <img
                                  src={att.fileUrl}
                                  alt={`before-spray-${aIdx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {!readonly && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeRoundAttachment(
                                        plotIdx,
                                        rIdx,
                                        aIdx,
                                      )
                                    }
                                    className="absolute top-1.5 right-1.5 p-1 bg-rose-600 text-white rounded-md opacity-90 hover:opacity-100 transition-opacity shadow-xs"
                                    title="ลบรูปนี้"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: รูปหลังฉีดพ่น (Max 5 photos per plot) */}
              <PlotAfterSpraySection
                plot={plot}
                plotIdx={plotIdx}
                readonly={readonly}
                addPlotAfterSprayImages={addPlotAfterSprayImages}
                removePlotAfterSprayImage={removePlotAfterSprayImage}
                setPreviewModalUrl={setPreviewModalUrl}
              />
            </div>
          );
        })}
      </div>

      {/* Bottom Add Plot Button */}
      {!readonly && plotsActual.length < 10 && (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddPlot}
            disabled={plotsActual.length >= 10}
            className="h-10 px-5 rounded-xl text-xs font-semibold text-emerald-700 border-dashed border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100 flex items-center gap-2 transition-all shadow-2xs disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>+ เพิ่มแปลงแฮตแทคใหม่ ({plotsActual.length}/10)</span>
          </Button>
        </div>
      )}

      {/* Full Preview Modal */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewModalUrl}
              alt="รูปขยาย"
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Type13Actual;
