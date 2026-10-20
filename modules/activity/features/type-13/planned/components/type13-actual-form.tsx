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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormCombobox } from "@/components/custom/FormCombobox";
import DatePicker from "@/components/custom/DatePicker";
import { ActivityGpsPicker, ActivityInput } from "@/modules/activity/ui";
import {
  EXTERNAL_CHEMICAL_FORMULAS,
  SPRAY_EQUIPMENT_OPTIONS,
  PRODUCT_RESPONSE_OPTIONS,
  FORMULA_OPTIONS,
} from "../../shared/constants";
import type { useType13Actual } from "../hooks/use-type13-actual";
import type {
  Type13PlotActualState,
  Type13ActualProps,
  Type13ActualFormProps,
} from "../types/actual.types";

export type { Type13ActualProps, Type13ActualFormProps };

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
          <h5 className="font-bold text-sm text-slate-800">รูปหลังฉีดพ่น (ต่อหมู่บ้าน)</h5>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            รูป {images.length}/20
          </span>
        </div>

        {!readonly && (
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  const availableSlots = 20 - images.length;
                  if (availableSlots <= 0) {
                    alert("สามารถอัปโหลดรูปภาพได้สูงสุด 20 รูปต่อหมู่บ้านเท่านั้น");
                    return;
                  }
                  const filesToAdd = Array.from(files).slice(0, availableSlots);
                  addPlotAfterSprayImages(plotIdx, filesToAdd);
                }
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= 20}
              className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>อัปโหลดรูป</span>
            </Button>
          </div>
        )}
      </div>

      {/* Upload Drag & Drop Area */}
      {!readonly && images.length < 20 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
              const imageFiles = Array.from(files).filter((f) =>
                f.type.startsWith("image/"),
              );
              const availableSlots = 20 - images.length;
              if (availableSlots <= 0) {
                alert("สามารถอัปโหลดรูปภาพได้สูงสุด 20 รูปต่อหมู่บ้านเท่านั้น");
                return;
              }
              const filesToAdd = imageFiles.slice(0, availableSlots);
              addPlotAfterSprayImages(plotIdx, filesToAdd);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-4 sm:p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2",
            isDragging
              ? "border-emerald-500 bg-emerald-50/50"
              : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50/50",
          )}
        >
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">
              ลากและวางรูปภาพหลังฉีดพ่น หรือ{" "}
              <span className="text-emerald-600 underline">เลือกไฟล์</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              รองรับไฟล์รูปภาพ PNG, JPG หรือ WEBP (สูงสุด 20 รูปต่อหมู่บ้าน)
            </p>
          </div>
        </div>
      )}

      {/* Images List */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {images.map((img, imgIdx) => (
            <div
              key={img.id || imgIdx}
              className="group relative bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2.5 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all"
            >
              {/* Header row: Index & Delete */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center justify-center">
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
                    {!!img.size && <span>{formatBytes(img.size)}</span>}
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

export function Type13ActualForm({
  isVisible = true,
  actualState,
  products = [],
  dealers = [],
  readonly = false,
}: Type13ActualProps) {
  const {
    plotsActual = [],
    addPlot,
    removePlot,
    updatePlotField,
    updatePlotInfo = (idx: number, f: any, val: any) => updatePlotField?.(idx, f, val),
    updatePlotDealer = (idx: number, sId: string, dName?: string, p?: string, d?: string) => {
      updatePlotField?.(idx, "storeId", sId);
      if (dName) updatePlotField?.(idx, "dealerName", dName);
      if (p) updatePlotField?.(idx, "province", p);
      if (d) updatePlotField?.(idx, "district", d);
    },
    updatePlotCoordinates = (idx: number, lat: string, lng: string) => {
      updatePlotField?.(idx, "latitude", lat);
      updatePlotField?.(idx, "longitude", lng);
    },
    addSprayRound,
    removeSprayRound,
    addSprayingRound = addSprayRound,
    removeSprayingRound = removeSprayRound,
    updateRoundField,
    updateRoundProduct,
    addRoundProduct,
    removeRoundProduct,
    addExternalProduct,
    removeExternalProduct,
    updateExternalProduct,
    addPlotAfterSprayImages,
    removePlotAfterSprayImage,
  } = actualState || {};

  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  if (!isVisible) return null;

  const handleAddPlot = () => {
    if (plotsActual.length >= 10 || readonly) return;
    addPlot?.();
  };

  const handleDeletePlot = (index: number) => {
    if (plotsActual.length <= 1 || readonly) return;
    removePlot?.(index);
  };

  const productOptions = products.map((p) => ({
    value: p.id,
    label: p.name,
    subLabel: p.unit ? `หน่วย: ${p.unit}` : undefined,
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 space-y-6 shadow-2xs">
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
        {plotsActual.map((plot: Type13PlotActualState, plotIdx: number) => {
          return (
            <div
              key={plot.clientPlotId || plot.demoPlotId || `plot-${plotIdx}`}
              className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-6 shadow-2xs hover:border-emerald-200 transition-colors"
            >
              {/* Plot Info Banner / Form */}
              <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {plotIdx + 1}
                    </div>
                    <span className="font-bold text-slate-800 text-sm">
                      {plot.plotName?.trim()
                        ? plot.plotName
                        : plot.isNew
                          ? `แปลงพบหน้างาน #${plotIdx + 1}`
                          : `แปลงที่ ${plotIdx + 1}`}
                    </span>
                    {plot.dealerName && (
                      <span className="text-xs text-slate-500 font-medium">
                        (ตัวแทน: {plot.dealerName})
                      </span>
                    )}
                  </div>

                  {!readonly && plotsActual.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePlot(plotIdx)}
                      className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-1 self-end sm:self-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบแปลงนี้</span>
                    </Button>
                  )}
                </div>

                {/* Plot Metadata Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      ชื่อแปลง <span className="text-red-500">*</span>
                    </label>
                    <ActivityInput
                      type="text"
                      placeholder="ระบุชื่อแปลง เช่น แปลงพี่สมชาย..."
                      value={plot.plotName || ""}
                      onChange={(e) =>
                        updatePlotInfo?.(plotIdx, "plotName", e.target.value)
                      }
                      disabled={readonly}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      ร้านค้า Dealer <span className="text-red-500">*</span>
                    </label>
                    <FormCombobox
                      options={dealers.map((d: any) => ({
                        value: d.id,
                        label: d.name,
                      }))}
                      value={plot.storeId || ""}
                      onChange={(val) => {
                        const matched = dealers.find((d: any) => d.id === val);
                        updatePlotDealer?.(
                          plotIdx,
                          val,
                          matched?.name,
                          matched?.province,
                          matched?.district,
                        );
                      }}
                      placeholder="เลือกร้านค้า..."
                      disabled={readonly}
                      triggerClassName="h-9 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      หมู่บ้าน
                    </label>
                    <ActivityInput
                      type="text"
                      placeholder="ระบุหมู่บ้าน เช่น บ้านหนองหว้า..."
                      value={plot.village || ""}
                      onChange={(e) =>
                        updatePlotInfo?.(plotIdx, "village", e.target.value)
                      }
                      disabled={readonly}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Location Display */}
                {(plot.province || plot.district || plot.subdistrict) && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {[
                        plot.subdistrict ? `ต.${plot.subdistrict}` : null,
                        plot.district ? `อ.${plot.district}` : null,
                        plot.province ? `จ.${plot.province}` : null,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
                  </div>
                )}

                {/* GPS Coordinates Picker */}
                <div className="pt-2">
                  <ActivityGpsPicker
                    latitude={plot.latitude || ""}
                    longitude={plot.longitude || ""}
                    onLocationChange={(lat: string, lng: string) =>
                      updatePlotCoordinates?.(plotIdx, lat, lng)
                    }
                    disabled={readonly}
                    required
                  />
                </div>
              </div>

              {/* Spraying Rounds Sub-Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Beaker className="w-4 h-4 text-emerald-600" />
                    <h5 className="font-bold text-xs sm:text-sm text-slate-800">
                      รอบการฉีดพ่น ({plot.sprayRounds?.length || 0} รอบ)
                    </h5>
                  </div>
                  {!readonly && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addSprayingRound?.(plotIdx)}
                      className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มรอบฉีดพ่น</span>
                    </Button>
                  )}
                </div>

                {(!plot.sprayRounds || plot.sprayRounds.length === 0) ? (
                  <div className="p-6 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    ยังไม่มีข้อมูลรอบการฉีดพ่น กดปุ่ม &quot;เพิ่มรอบฉีดพ่น&quot; เพื่อบันทึกผล
                  </div>
                ) : (
                  <div className="space-y-4">
                    {plot.sprayRounds.map((round: any, roundIdx: number) => (
                      <div
                        key={round.id || roundIdx}
                        className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-2xs"
                      >
                        {/* Round Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">
                              {round.roundNumber || roundIdx + 1}
                            </span>
                            <span className="font-bold text-xs text-slate-800">
                              รอบที่ {round.roundNumber || roundIdx + 1}
                            </span>
                          </div>
                          {!readonly && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSprayingRound?.(plotIdx, roundIdx)}
                              className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              <span>ลบรอบนี้</span>
                            </Button>
                          )}
                        </div>

                        {/* Round Form Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          {/* วันที่ฉีดพ่น */}
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">
                              วันที่ฉีดพ่น
                            </label>
                            <DatePicker
                              value={
                                round.sprayDate
                                  ? new Date(round.sprayDate)
                                  : undefined
                              }
                              onChange={(d?: string) =>
                                updateRoundField?.(
                                  plotIdx,
                                  roundIdx,
                                  "sprayDate",
                                  d || "",
                                )
                              }
                              disabled={readonly}
                              placeholder="เลือกวันที่..."
                            />
                          </div>

                          {/* วิธีการฉีดพ่น */}
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">
                              วิธีการฉีดพ่น
                            </label>
                            <Select
                              value={round.sprayMethod || "SINGLE"}
                              onValueChange={(val) =>
                                updateRoundField?.(plotIdx, roundIdx, "sprayMethod", val)
                              }
                              disabled={readonly}
                            >
                              <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SINGLE">เดี่ยว (Single)</SelectItem>
                                <SelectItem value="TANK_MIXED">ผสมถัง (Tank-Mixed)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* อุปกรณ์ที่ใช้ */}
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">
                              อุปกรณ์ที่ใช้
                            </label>
                            <Select
                              value={round.sprayEquipment || "เครื่องยนต์พ่นยา"}
                              onValueChange={(val) =>
                                updateRoundField?.(plotIdx, roundIdx, "sprayEquipment", val)
                              }
                              disabled={readonly}
                            >
                              <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SPRAY_EQUIPMENT_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* ผลหลังการฉีดพ่น */}
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">
                              ผลหลังการฉีดพ่น
                            </label>
                            <Select
                              value={round.productResponse || "ปกติ"}
                              onValueChange={(val) =>
                                updateRoundField?.(plotIdx, roundIdx, "productResponse", val)
                              }
                              disabled={readonly}
                            >
                              <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PRODUCT_RESPONSE_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Products Used in this Round */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-emerald-600" />
                              ผลิตภัณฑ์ที่ใช้ ({round.products?.length || 0})
                            </span>
                            {!readonly && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  addRoundProduct?.(plotIdx, roundIdx, {
                                    productId: "",
                                    productName: "",
                                    actualRate: "",
                                    quantityUsed: 1,
                                    unit: "ขวด",
                                  })
                                }
                                className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-2"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                <span>เพิ่มผลิตภัณฑ์</span>
                              </Button>
                            )}
                          </div>

                          {round.products && round.products.length > 0 && (
                            <div className="space-y-2">
                              {round.products.map((prod: any, pIdx: number) => (
                                <div
                                  key={prod.id || pIdx}
                                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-50/70 p-2.5 rounded-lg border border-slate-200/60 text-xs"
                                >
                                  <div className="sm:col-span-5">
                                    <FormCombobox
                                      options={productOptions}
                                      value={prod.productId || ""}
                                      onChange={(val) => {
                                        const matched = products.find((p) => p.id === val);
                                        updateRoundProduct?.(plotIdx, roundIdx, pIdx, "productId", val);
                                        if (matched?.name) {
                                          updateRoundProduct?.(plotIdx, roundIdx, pIdx, "productName", matched.name);
                                        }
                                        if (matched?.unit) {
                                          updateRoundProduct?.(plotIdx, roundIdx, pIdx, "unit", matched.unit);
                                        }
                                      }}
                                      placeholder="เลือกผลิตภัณฑ์..."
                                      disabled={readonly}
                                      triggerClassName="h-8 text-xs bg-white"
                                    />
                                  </div>
                                  <div className="sm:col-span-3">
                                    <Input
                                      type="text"
                                      placeholder="อัตราใช้ (เช่น 20 ซีซี/น้ำ 20 ลิตร)"
                                      value={prod.actualRate || ""}
                                      onChange={(e) =>
                                        updateRoundProduct?.(plotIdx, roundIdx, pIdx, "actualRate", e.target.value)
                                      }
                                      disabled={readonly}
                                      className="h-8 text-xs bg-white"
                                    />
                                  </div>
                                  <div className="sm:col-span-3 flex items-center gap-1.5">
                                    <Input
                                      type="number"
                                      min={0}
                                      placeholder="จำนวน"
                                      value={prod.quantityUsed ?? ""}
                                      onChange={(e) =>
                                        updateRoundProduct?.(plotIdx, roundIdx, pIdx, "quantityUsed", e.target.value)
                                      }
                                      disabled={readonly}
                                      className="h-8 text-xs bg-white w-20"
                                    />
                                    <span className="text-slate-500 text-[11px] truncate">
                                      {prod.unit || "ขวด"}
                                    </span>
                                  </div>
                                  {!readonly && (
                                    <div className="sm:col-span-1 text-right">
                                      <button
                                        type="button"
                                        onClick={() => removeRoundProduct?.(plotIdx, roundIdx, pIdx)}
                                        className="p-1 text-slate-400 hover:text-red-500 rounded"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* After-Spray Photos Section */}
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

      {/* Lightbox Modal */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewModalUrl}
              alt="Full size preview"
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export { Type13ActualForm as Type13Actual };
