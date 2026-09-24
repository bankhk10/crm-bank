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
    updatePlotCoordinates,
    addSprayingRound,
    removeSprayingRound,
    updateRoundField,
    updateRoundProduct,
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

      {/* Plot Tabs (if multiple plots) */}
      {plotsActual.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {plotsActual.map((plot, pIdx) => {
            const isActive = pIdx === activePlotIdx;
            const hasGps = Boolean(plot.latitude && plot.longitude);
            return (
              <button
                key={plot.demoPlotId || pIdx}
                type="button"
                onClick={() => setActivePlotIdx(pIdx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isActive
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>{plot.plotName || `แปลงที่ ${pIdx + 1}`}</span>
                {hasGps && (
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-emerald-600"}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Current Plot Card */}
      <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-6">
        {/* Plot Info Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white rounded-xl border border-slate-200">
          <div>
            <h5 className="font-bold text-slate-800 text-sm">
              {currentPlot.plotName}
            </h5>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              {currentPlot.dealerName && (
                <span>ร้านค้า Dealer: {currentPlot.dealerName}</span>
              )}
              {currentPlot.province && (
                <span>• {currentPlot.district || ""}, {currentPlot.province}</span>
              )}
            </div>
          </div>
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
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    รายการสินค้าของบริษัทและอัตราที่ใช้จริง:
                  </label>
                  <div className="space-y-2">
                    {round.products.map((prod, pIdx) => (
                      <div
                        key={prod.productId || pIdx}
                        className="grid grid-cols-12 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 items-center text-xs"
                      >
                        <div className="col-span-4 font-medium text-slate-800 truncate">
                          {prod.productName || "สินค้าไม่ระบุชื่อ"}
                        </div>
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={prod.actualRate}
                            onChange={(e) =>
                              updateRoundProduct(activePlotIdx, rIdx, pIdx, "actualRate", e.target.value)
                            }
                            disabled={readonly}
                            placeholder="อัตราจริง เช่น 20 ซีซี/น้ำ 20 ลิตร"
                            className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                          />
                        </div>
                        <div className="col-span-4 flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            value={prod.quantityUsed ?? ""}
                            onChange={(e) =>
                              updateRoundProduct(activePlotIdx, rIdx, pIdx, "quantityUsed", e.target.value)
                            }
                            disabled={readonly}
                            placeholder="จำนวนที่ใช้"
                            className="w-full h-8 px-2 rounded-md border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                          />
                          <span className="text-[11px] text-slate-500 whitespace-nowrap">
                            {prod.unit || "หน่วย"}
                          </span>
                        </div>
                      </div>
                    ))}
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
