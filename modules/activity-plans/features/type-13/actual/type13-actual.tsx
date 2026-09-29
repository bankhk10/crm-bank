"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormCombobox } from "@/components/custom/form-components";
import { EXTERNAL_CHEMICAL_FORMULAS } from "../../../constants";
import type { useType13ActualState } from "./use-type13-actual-state";

export interface Type13ActualProps {
  isVisible?: boolean;
  actualState: ReturnType<typeof useType13ActualState>;
  products: Array<{ id: string; name: string; unit?: string | null; productCode?: string | null }>;
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
  } = actualState;

  const [activePlotIdx, setActivePlotIdx] = useState(0);
  const [gpsLoading, setGpsLoading] = useState(false);

  if (!isVisible || plotsActual.length === 0) return null;

  const currentPlot = plotsActual[activePlotIdx] || plotsActual[0];

  // Handler: Add new plot on-the-fly
  const handleAddPlot = () => {
    if (plotsActual.length >= 10 || readonly) return;
    addPlot();
    setActivePlotIdx(plotsActual.length);
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
    if (activePlotIdx >= idxToRemove && activePlotIdx > 0) {
      setActivePlotIdx(activePlotIdx - 1);
    }
  };

  // Handler: Get GPS Location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("เบราว์เซอร์ของคุณไม่รองรับการดึงพิกัด GPS");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false);
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        updatePlotCoordinates(activePlotIdx, lat, lng);
      },
      (error) => {
        setGpsLoading(false);
        alert(`ไม่สามารถดึงพิกัด GPS ได้: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Handler: Upload photo before spray (max 2)
  const handlePhotoUpload = (
    roundIdx: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const round = currentPlot.sprayRounds[roundIdx];
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
        addRoundAttachment(activePlotIdx, roundIdx, {
          fileUrl: base64,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
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
      </div>

      {/* Plot Tabs & Add Plot Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        {/* Plot Tabs List */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {plotsActual.map((plot, pIdx) => {
            const isActive = pIdx === activePlotIdx;
            const hasGps = Boolean(plot.latitude?.trim() && plot.longitude?.trim());
            const displayName =
              plot.plotName || (plot.isNew ? `แปลงใหม่ #${pIdx + 1}` : `แปลงที่ ${pIdx + 1}`);

            return (
              <button
                key={plot.demoPlotId || pIdx}
                type="button"
                onClick={() => setActivePlotIdx(pIdx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border shrink-0 ${
                  isActive
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>{displayName}</span>
                {plot.isNew && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-normal ${
                      isActive
                        ? "bg-emerald-700 text-emerald-100"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    ใหม่
                  </span>
                )}
                {hasGps && (
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-emerald-600"}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Add Plot Button */}
        {!readonly && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddPlot}
              disabled={plotsActual.length >= 10}
              className="h-9 px-3 rounded-xl text-xs font-semibold text-emerald-700 border-dashed border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100 flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มแปลงแฮตแทคใหม่</span>
            </Button>
            {plotsActual.length >= 10 && (
              <span className="text-[11px] text-amber-600 font-medium">
                (ครบ 10 แปลงแล้ว)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Current Plot Card */}
      <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-6">
        {/* Plot Info Banner / Form */}
        <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">
                {currentPlot.isNew ? "แปลงพบหน้างาน (สร้างใหม่)" : currentPlot.plotName}
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  currentPlot.isNew
                    ? "bg-purple-100 text-purple-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {currentPlot.isNew ? "แปลงใหม่" : "แปลงตามแผน"}
              </span>
            </div>

            {/* Remove button for new plots */}
            {currentPlot.isNew && !readonly && plotsActual.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemovePlot(activePlotIdx)}
                className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบแปลงนี้</span>
              </Button>
            )}
          </div>

          {currentPlot.isNew ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อแปลง / รายละเอียดแปลง <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                </label>
                <input
                  type="text"
                  value={currentPlot.plotName}
                  onChange={(e) =>
                    updatePlotInfo(activePlotIdx, "plotName", e.target.value)
                  }
                  placeholder="เช่น แปลงริมคลอง 7, แปลงหญ้าข้างสวนนายเอ"
                  disabled={readonly}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเหตุ / จุดสังเกต <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                </label>
                <input
                  type="text"
                  value={currentPlot.district || ""}
                  onChange={(e) =>
                    updatePlotInfo(activePlotIdx, "district", e.target.value)
                  }
                  placeholder="เช่น ใกล้สะพานไม้, จุดสังเกต"
                  disabled={readonly}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {currentPlot.dealerName && (
                <span>ร้านค้า Dealer: {currentPlot.dealerName}</span>
              )}
              {currentPlot.province && (
                <span>• {currentPlot.district || ""}, {currentPlot.province}</span>
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
                พิกัด GPS ของแปลง <span className="text-red-500">* (บังคับระบุ)</span>
              </h6>
            </div>

            {!readonly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetCurrentLocation}
                disabled={gpsLoading}
                className="h-8 px-2.5 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-lg flex items-center gap-1.5"
              >
                <Compass className={`w-3.5 h-3.5 ${gpsLoading ? "animate-spin" : ""}`} />
                <span>{gpsLoading ? "กำลังดึงพิกัด..." : "ดึงตำแหน่งปัจจุบัน (GPS)"}</span>
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
                value={currentPlot.latitude}
                onChange={(e) =>
                  updatePlotCoordinates(activePlotIdx, e.target.value, currentPlot.longitude)
                }
                disabled={readonly}
                placeholder="เช่น 13.756331"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ลองจิจูด (Longitude) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={currentPlot.longitude}
                onChange={(e) =>
                  updatePlotCoordinates(activePlotIdx, currentPlot.latitude, e.target.value)
                }
                disabled={readonly}
                placeholder="เช่น 100.501765"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {!currentPlot.latitude || !currentPlot.longitude ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>จำเป็นต้องระบุพิกัด Latitude และ Longitude ให้ครบถ้วนก่อนบันทึกผลงาน</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <a
                href={`https://maps.google.com/?q=${currentPlot.latitude},${currentPlot.longitude}`}
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
                  ({currentPlot.sprayRounds.length} รอบ)
                </span>
              </h5>
            </div>

            {!readonly && (
              <Button
                type="button"
                size="sm"
                onClick={() => addSprayingRound(activePlotIdx)}
                className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มรอบการฉีด</span>
              </Button>
            )}
          </div>

          {/* Rounds List */}
          <div className="space-y-4">
            {currentPlot.sprayRounds.map((round, rIdx) => (
              <div
                key={round.id || rIdx}
                className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-2xs"
              >
                {/* Round Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                      {round.roundNumber}
                    </span>
                    <h6 className="font-bold text-xs text-slate-800">
                      รอบการฉีดพ่นที่ {round.roundNumber}
                    </h6>
                  </div>

                  {!readonly && currentPlot.sprayRounds.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSprayingRound(activePlotIdx, rIdx)}
                      className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>ลบรอบนี้</span>
                    </Button>
                  )}
                </div>

                {/* Round Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* วันที่ฉีดพ่นจริง */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      วันที่ฉีดพ่นจริง <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={
                        round.sprayDate
                          ? new Date(round.sprayDate).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        updateRoundField(activePlotIdx, rIdx, "sprayDate", e.target.value)
                      }
                      disabled={readonly}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  {/* วิธีการฉีดพ่น: SINGLE vs TANK_MIXED */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      วิธีการฉีดพ่น <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 h-9">
                      <button
                        type="button"
                        onClick={() =>
                          updateRoundField(activePlotIdx, rIdx, "sprayMethod", "SINGLE")
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
                          updateRoundField(activePlotIdx, rIdx, "sprayMethod", "TANK_MIXED")
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
                      id={`equipment-${activePlotIdx}-${rIdx}`}
                      label="อุปกรณ์ที่ใช้"
                      labelClassName="block text-xs font-semibold text-slate-600 mb-1 mx-0"
                      triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      value={round.sprayEquipment || ""}
                      onChange={(val) =>
                        updateRoundField(activePlotIdx, rIdx, "sprayEquipment", val)
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
                        ระบุอุปกรณ์อื่นๆ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={round.otherEquipment || ""}
                        onChange={(e) =>
                          updateRoundField(activePlotIdx, rIdx, "otherEquipment", e.target.value)
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
                      id={`response-${activePlotIdx}-${rIdx}`}
                      label="ผลหลังการฉีดพ่น"
                      labelClassName="block text-xs font-semibold text-slate-600 mb-1 mx-0"
                      triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      value={round.productResponse || ""}
                      onChange={(val) =>
                        updateRoundField(activePlotIdx, rIdx, "productResponse", val)
                      }
                      options={PRODUCT_RESPONSE_OPTIONS}
                      placeholder="เลือกผลหลังฉีด..."
                      disabled={readonly}
                      required
                    />
                  </div>

                  {/* รายละเอียดปัญหาที่พบ (ถ้ามี) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      รายละเอียดปัญหาที่พบ (ถ้ามี)
                    </label>
                    <input
                      type="text"
                      value={round.problemDetail || ""}
                      onChange={(e) =>
                        updateRoundField(activePlotIdx, rIdx, "problemDetail", e.target.value)
                      }
                      disabled={readonly}
                      placeholder="เช่น ใบเหลืองเล็กน้อย หรือ ยาละลายช้า..."
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                </div>

                {/* Company Products in Round */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        รายการสินค้าและอัตราการใช้จริง:
                      </label>
                      <span className="text-[11px] text-slate-500">
                        ระบุจำนวนและอัตราการใช้จริงสำหรับแต่ละรายการ
                      </span>
                    </div>
                    {!readonly && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addRoundProduct(activePlotIdx, rIdx)}
                        className="h-7 px-2.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 rounded-lg flex items-center gap-1 font-medium shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>เพิ่มสินค้า</span>
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {round.products.map((prod, pIdx) => {
                      const isWithdrawn = Boolean(
                        prod.drugWithdrawalItemId ||
                          (prod.withdrawnQuantity != null && !prod.isAdditional),
                      );

                      return (
                        <div
                          key={pIdx}
                          className={`p-3 rounded-xl border transition-all space-y-2.5 ${
                            isWithdrawn
                              ? "bg-slate-50/70 border-emerald-200/80 shadow-2xs"
                              : "bg-amber-50/30 border-amber-200/80 shadow-2xs"
                          }`}
                        >
                          {/* Top Row: Product Name/Selector + Badge + Readonly Withdrawn Qty + Delete */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {isWithdrawn ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-800 text-xs sm:text-sm">
                                    {prod.productName || "สินค้าไม่ระบุชื่อ"}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    จากรายการเบิก
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 flex-1 max-w-md flex-wrap sm:flex-nowrap">
                                  {readonly ? (
                                    <span className="font-bold text-slate-800 text-xs sm:text-sm">
                                      {prod.productName || "สินค้าเพิ่มเติม (ไม่ระบุ)"}
                                    </span>
                                  ) : (
                                    <div className="w-full sm:w-64">
                                      <FormCombobox
                                        id={`product-${activePlotIdx}-${rIdx}-${pIdx}`}
                                        label=""
                                        value={prod.productId || ""}
                                        onChange={(val) => {
                                          const selected = products.find((p) => p.id === val);
                                          updateRoundProduct(activePlotIdx, rIdx, pIdx, "productId", val);
                                          if (selected) {
                                            updateRoundProduct(activePlotIdx, rIdx, pIdx, "productName", selected.name);
                                            if (selected.unit) {
                                              updateRoundProduct(activePlotIdx, rIdx, pIdx, "unit", selected.unit);
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
                              {isWithdrawn && prod.withdrawnQuantity != null && (
                                <span className="text-xs text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                                  จำนวนที่เบิก: <strong className="text-emerald-700 font-bold">{prod.withdrawnQuantity}</strong> {prod.unit || "หน่วย"}
                                </span>
                              )}

                              {!readonly && round.products.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeRoundProduct(activePlotIdx, rIdx, pIdx)}
                                  className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-white transition-colors"
                                  title="ลบสินค้ารายการนี้ออกจากรอบ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Inputs Row: จำนวนที่ใช้จริง, อัตราการใช้, รายละเอียด */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
                            {/* จำนวนที่ใช้จริง */}
                            <div className="sm:col-span-3">
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                จำนวนที่ใช้จริง <span className="text-red-500">*</span>
                              </label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  step="any"
                                  value={prod.quantityUsed ?? ""}
                                  onChange={(e) =>
                                    updateRoundProduct(
                                      activePlotIdx,
                                      rIdx,
                                      pIdx,
                                      "quantityUsed",
                                      e.target.value === "" ? "" : parseFloat(e.target.value) || 0,
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
                                อัตราการใช้ <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={prod.actualRate}
                                onChange={(e) =>
                                  updateRoundProduct(
                                    activePlotIdx,
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

                            {/* รายละเอียด */}
                            <div className="sm:col-span-5">
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                รายละเอียด <span className="text-slate-400 font-normal">(ถ้ามี)</span>
                              </label>
                              <input
                                type="text"
                                value={prod.detail || ""}
                                onChange={(e) =>
                                  updateRoundProduct(
                                    activePlotIdx,
                                    rIdx,
                                    pIdx,
                                    "detail",
                                    e.target.value,
                                  )
                                }
                                disabled={readonly}
                                placeholder="ระบุรายละเอียดการใช้ / ข้อสังเกต..."
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
                        <span>สารเคมีภายนอกที่นำมาผสมถัง (External Chemicals):</span>
                      </label>
                      {!readonly && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addExternalProduct(activePlotIdx, rIdx)}
                          className="h-7 px-2 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50 rounded-lg flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>เพิ่มสารเคมีผสม</span>
                        </Button>
                      )}
                    </div>

                    {(round.externalProducts || []).length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic py-1">
                        ยังไม่มีรายการสารเคมีภายนอก กดปุ่มเพิ่มเพื่อระบุสารที่นำมาผสมถัง
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {(round.externalProducts || []).map((ext, eIdx) => (
                          <div
                            key={eIdx}
                            className="p-2.5 bg-indigo-50/40 rounded-xl border border-indigo-100 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs"
                          >
                            <div className="sm:col-span-3">
                              <input
                                type="text"
                                value={ext.company}
                                onChange={(e) =>
                                  updateExternalProduct(activePlotIdx, rIdx, eIdx, "company", e.target.value)
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
                                  updateExternalProduct(activePlotIdx, rIdx, eIdx, "productName", e.target.value)
                                }
                                disabled={readonly}
                                placeholder="ชื่อสารเคมี/ตัวยา"
                                className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs bg-white font-medium"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <FormCombobox
                                id={`formula-${activePlotIdx}-${rIdx}-${eIdx}`}
                                label=""
                                triggerClassName="h-8 min-h-[32px] py-0.5 text-xs bg-white border-slate-200 rounded-md"
                                value={ext.formula}
                                onChange={(val) =>
                                  updateExternalProduct(activePlotIdx, rIdx, eIdx, "formula", val)
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
                                  updateExternalProduct(activePlotIdx, rIdx, eIdx, "applicationRate", e.target.value)
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
                                    removeExternalProduct(activePlotIdx, rIdx, eIdx)
                                  }
                                  className="p-1 text-slate-400 hover:text-rose-500 rounded"
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

                    {!readonly && (round.attachments || []).length < 2 && (
                      <label className="cursor-pointer h-7 px-2.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-1">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>เพิ่มรูปถ่าย</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handlePhotoUpload(rIdx, e)}
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
                              onClick={() => removeRoundAttachment(activePlotIdx, rIdx, aIdx)}
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
      </div>
    </div>
  );
}

export default Type13Actual;
