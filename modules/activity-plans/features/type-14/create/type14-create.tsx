"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Compass,
  MapPin,
  Plus,
  Trash2,
  Calendar,
  Layers,
  UploadCloud,
  FileText,
  Loader2,
  Store,
  User,
  Clock,
  ExternalLink,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  Type14PlanInput,
  Type14TrackingItem,
} from "../../../application/validations";
import { getHattackFollowUpDemoPlotsAction } from "../../../server/actions";

export interface Type14CreateProps {
  value: Type14PlanInput;
  onChange: (val: Type14PlanInput) => void;
  dealerCustomers?: Array<{
    id: string;
    name: string;
    customerCode?: string;
    province?: string;
  }>;
  planDate?: string;
  defaultProvince?: string;
  defaultDistrict?: string;
  readonly?: boolean;
}

export function Type14Create({
  value,
  onChange,
  dealerCustomers = [],
  planDate,
  defaultProvince = "",
  defaultDistrict = "",
  readonly = false,
}: Type14CreateProps) {
  const [existingPlots, setExistingPlots] = useState<any[]>([]);
  const [loadingPlots, setLoadingPlots] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [uploadingTrackingIdx, setUploadingTrackingIdx] = useState<number | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Load existing Hattack demo plots strictly for TYPE_14
  useEffect(() => {
    let isMounted = true;
    async function loadHattackPlots() {
      setLoadingPlots(true);
      try {
        const res = await getHattackFollowUpDemoPlotsAction();
        if (isMounted && res.success && res.demoPlots) {
          setExistingPlots(res.demoPlots);
        }
      } catch (err) {
        console.error("Failed to load Hattack demo plots:", err);
      } finally {
        if (isMounted) setLoadingPlots(false);
      }
    }
    loadHattackPlots();
    return () => {
      isMounted = false;
    };
  }, []);

  // Mode Switch
  const handleModeChange = (mode: "EXISTING_PLOT" | "NEW_PLOT") => {
    if (readonly) return;
    onChange({
      ...value,
      mode,
      demoPlotId: mode === "EXISTING_PLOT" ? value.demoPlotId : null,
    });
  };

  // Select existing plot
  const handleSelectExistingPlot = (plotId: string) => {
    const selected = existingPlots.find((p) => p.id === plotId);
    if (!selected) {
      onChange({
        ...value,
        demoPlotId: null,
      });
      return;
    }

    onChange({
      ...value,
      demoPlotId: selected.id,
      name: selected.name || "",
      storeId: selected.customerId || selected.customer?.id || value.storeId || "",
      ownerName: selected.ownerName || selected.farmerName || "",
      province: selected.province || value.province || defaultProvince,
      district: selected.district || value.district || defaultDistrict,
      latitude: selected.latitude ? String(selected.latitude) : value.latitude,
      longitude: selected.longitude ? String(selected.longitude) : value.longitude,
    });
  };

  // Get current GPS location
  const handleGetCurrentLocation = useCallback(() => {
    if (readonly || !navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        onChange({
          ...value,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        });
      },
      (err) => {
        setGpsLoading(false);
        console.warn("Geolocation error:", err.message);
        alert("ไม่สามารถดึงพิกัด GPS ปัจจุบันได้ กรุณาระบุพิกัดด้วยตนเอง");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [value, onChange, readonly]);

  // Tracking Management
  const addTracking = () => {
    if (readonly) return;
    const nextVisitNumber = (value.trackings || []).length + 1;
    const newTracking: Type14TrackingItem = {
      visitDate: planDate || new Date().toISOString().split("T")[0],
      daysSinceStart: nextVisitNumber === 1 ? 7 : nextVisitNumber * 7,
      notes: "",
      attachments: [],
    };
    onChange({
      ...value,
      trackings: [...(value.trackings || []), newTracking],
    });
  };

  const removeTracking = (index: number) => {
    if (readonly || (value.trackings || []).length <= 1) return;
    onChange({
      ...value,
      trackings: value.trackings.filter((_, idx) => idx !== index),
    });
  };

  const updateTrackingField = (index: number, field: keyof Type14TrackingItem, val: any) => {
    if (readonly) return;
    const next = [...(value.trackings || [])];
    next[index] = { ...next[index], [field]: val };
    onChange({ ...value, trackings: next });
  };

  // Photo Upload via /api/upload
  const handlePhotoUpload = async (trackingIdx: number, files: FileList | null) => {
    if (readonly || !files || files.length === 0) return;

    const currentAttachments = value.trackings[trackingIdx]?.attachments || [];
    const availableSlots = 5 - currentAttachments.length;
    if (availableSlots <= 0) {
      alert("รูปภาพผลหลังฉีดพ่นต้องไม่เกิน 5 รูปต่อการติดตาม");
      return;
    }

    setUploadingTrackingIdx(trackingIdx);
    const filesToUpload = Array.from(files).slice(0, availableSlots);
    const uploadedAttachments: any[] = [];

    try {
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error("อัปโหลดไฟล์ล้มเหลว");
        }

        const data = await res.json();
        if (data.url) {
          uploadedAttachments.push({
            fileUrl: data.url,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
          });
        }
      }

      const nextTrackings = [...(value.trackings || [])];
      nextTrackings[trackingIdx] = {
        ...nextTrackings[trackingIdx],
        attachments: [...currentAttachments, ...uploadedAttachments],
      };
      onChange({ ...value, trackings: nextTrackings });
    } catch (err: any) {
      console.error("Photo upload error:", err);
      alert(err.message || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    } finally {
      setUploadingTrackingIdx(null);
    }
  };

  const removePhoto = (trackingIdx: number, photoIdx: number) => {
    if (readonly) return;
    const nextTrackings = [...(value.trackings || [])];
    const currentAtts = nextTrackings[trackingIdx]?.attachments || [];
    nextTrackings[trackingIdx] = {
      ...nextTrackings[trackingIdx],
      attachments: currentAtts.filter((_, idx) => idx !== photoIdx),
    };
    onChange({ ...value, trackings: nextTrackings });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
            14
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">
              ติดตามแปลงแฮทแทค (TYPE_14)
            </h4>
            <p className="text-xs text-slate-500">
              บันทึกการติดตามผลแปลงแฮทแทค พิกัดแปลง และรูปภาพผลหลังการฉีดพ่น
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        {!readonly && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleModeChange("EXISTING_PLOT")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                value.mode === "EXISTING_PLOT"
                  ? "bg-white text-purple-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              เลือกแปลงแฮตแทคเดิม
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("NEW_PLOT")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                value.mode === "NEW_PLOT"
                  ? "bg-white text-purple-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              สร้างแปลงแฮตแทคใหม่
            </button>
          </div>
        )}
      </div>

      {/* Plot Information Section */}
      <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-600" />
          <h5 className="font-bold text-xs sm:text-sm text-slate-800">
            ข้อมูลแปลงแฮตแทค
          </h5>
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 border-purple-200"
          >
            {value.mode === "EXISTING_PLOT" ? "แปลงเดิม (Existing)" : "แปลงใหม่ (New Plot)"}
          </Badge>
        </div>

        {/* Existing Plot Dropdown (Mode = EXISTING_PLOT) */}
        {value.mode === "EXISTING_PLOT" && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เลือกแปลงแฮตแทคเดิม <span className="text-red-500">*</span>
            </label>
            {loadingPlots ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span>กำลังโหลดแปลงแฮตแทค...</span>
              </div>
            ) : (
              <select
                value={value.demoPlotId || ""}
                onChange={(e) => handleSelectExistingPlot(e.target.value)}
                disabled={readonly}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="">-- กรุณาเลือกแปลงแฮตแทค --</option>
                {existingPlots.map((plot) => (
                  <option key={plot.id} value={plot.id}>
                    {plot.name || plot.code} ({plot.ownerName || plot.farmerName || "ไม่ระบุเจ้าของ"}) -{" "}
                    {plot.province || ""}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Plot Details Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* Plot Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อแปลง <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={value.name}
              onChange={(e) => onChange({ ...value, name: e.target.value })}
              disabled={readonly || value.mode === "EXISTING_PLOT"}
              placeholder="เช่น แปลงแฮตแทคแปลงที่ 1 ทุเรียนหมอนทอง"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white disabled:bg-slate-100/80"
            />
          </div>

          {/* Dealer Customer */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ร้านค้าตัวแทนจำหน่าย (Dealer) <span className="text-red-500">*</span>
            </label>
            <select
              value={value.storeId}
              onChange={(e) => onChange({ ...value, storeId: e.target.value })}
              disabled={readonly || value.mode === "EXISTING_PLOT"}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white disabled:bg-slate-100/80"
            >
              <option value="">-- เลือกร้านค้า --</option>
              {dealerCustomers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.province ? `(${d.province})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Farmer Owner Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อเกษตรกรเจ้าของแปลง
            </label>
            <input
              type="text"
              value={value.ownerName || ""}
              onChange={(e) => onChange({ ...value, ownerName: e.target.value })}
              disabled={readonly || value.mode === "EXISTING_PLOT"}
              placeholder="เช่น นายสมชาย เกษตรก้าวหน้า"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white disabled:bg-slate-100/80"
            />
          </div>

          {/* Province */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              จังหวัด <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={value.province}
              onChange={(e) => onChange({ ...value, province: e.target.value })}
              disabled={readonly || value.mode === "EXISTING_PLOT"}
              placeholder="เช่น จันทบุรี"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white disabled:bg-slate-100/80"
            />
          </div>

          {/* District */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              อำเภอ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={value.district}
              onChange={(e) => onChange({ ...value, district: e.target.value })}
              disabled={readonly || value.mode === "EXISTING_PLOT"}
              placeholder="เช่น ท่าใหม่"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white disabled:bg-slate-100/80"
            />
          </div>
        </div>

        {/* GPS Coordinates (Required) */}
        <div className="pt-3 border-t border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-purple-600" />
              <span>พิกัด GPS ของแปลง</span>
              <span className="text-red-500">* (บังคับระบุ)</span>
            </label>

            {!readonly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetCurrentLocation}
                disabled={gpsLoading}
                className="h-8 px-2.5 text-xs text-purple-700 border-purple-200 hover:bg-purple-50 rounded-lg flex items-center gap-1.5"
              >
                <Compass className={`w-3.5 h-3.5 ${gpsLoading ? "animate-spin" : ""}`} />
                <span>{gpsLoading ? "กำลังดึงพิกัด..." : "ดึงตำแหน่งปัจจุบัน (GPS)"}</span>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                ละติจูด (Latitude) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={value.latitude}
                onChange={(e) => onChange({ ...value, latitude: e.target.value })}
                disabled={readonly}
                placeholder="เช่น 12.531234"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                ลองจิจูด (Longitude) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={value.longitude}
                onChange={(e) => onChange({ ...value, longitude: e.target.value })}
                disabled={readonly}
                placeholder="เช่น 102.012345"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 1..N Trackings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <h5 className="font-bold text-xs sm:text-sm text-slate-800">
              บันทึกการติดตามผลแปลงแฮทแทค (Trackings)
            </h5>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {(value.trackings || []).length} ครั้ง
            </span>
          </div>

          {!readonly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTracking}
              className="h-8 px-3 text-xs text-purple-700 border-purple-200 hover:bg-purple-50 rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มรอบการติดตาม</span>
            </Button>
          )}
        </div>

        {/* Trackings List */}
        <div className="space-y-4">
          {(value.trackings || []).map((t, tIdx) => (
            <div
              key={tIdx}
              className="bg-purple-50/30 border border-purple-100 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                    {tIdx + 1}
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-slate-800">
                    การติดตามครั้งที่ {tIdx + 1}
                  </span>
                </div>

                {!readonly && (value.trackings || []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTracking(tIdx)}
                    className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบรอบนี้</span>
                  </button>
                )}
              </div>

              {/* Date & Days After Spray */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    วันที่ตรวจติดตาม <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={
                      typeof t.visitDate === "string"
                        ? t.visitDate.split("T")[0]
                        : t.visitDate instanceof Date
                          ? t.visitDate.toISOString().split("T")[0]
                          : ""
                    }
                    onChange={(e) => updateTrackingField(tIdx, "visitDate", e.target.value)}
                    disabled={readonly}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    จำนวนวันหลังฉีดพ่น (วัน) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={t.daysSinceStart ?? 0}
                    onChange={(e) =>
                      updateTrackingField(tIdx, "daysSinceStart", parseInt(e.target.value, 10) || 0)
                    }
                    disabled={readonly}
                    placeholder="เช่น 7, 14, 21"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  บันทึก / อาการของพืช / ผลการฉีดพ่น
                </label>
                <textarea
                  rows={2}
                  value={t.notes || ""}
                  onChange={(e) => updateTrackingField(tIdx, "notes", e.target.value)}
                  disabled={readonly}
                  placeholder="เช่น ใบเริ่มแตกยอดใหม่ ไม่มีรอยไหม้ การเข้าทำลายของแมลงลดลงอย่างเห็นได้ชัด"
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>

              {/* After-spray Photos (Max 5 photos per tracking) */}
              <div className="space-y-2 pt-2 border-t border-purple-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5 text-purple-600" />
                    <span>รูปภาพผลหลังการฉีดพ่น (สูงสุด 5 รูปต่อครั้ง)</span>
                    <span className="text-[11px] font-semibold text-purple-600">
                      ({(t.attachments || []).length}/5 รูป)
                    </span>
                  </label>

                  {!readonly && (t.attachments || []).length < 5 && (
                    <label className="cursor-pointer h-7 px-2.5 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg flex items-center gap-1 transition-colors">
                      {uploadingTrackingIdx === tIdx ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>กำลังอัปโหลด...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>เพิ่มรูปถ่าย</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={uploadingTrackingIdx !== null}
                            onChange={(e) => handlePhotoUpload(tIdx, e.target.files)}
                            className="hidden"
                          />
                        </>
                      )}
                    </label>
                  )}
                </div>

                {/* Photos Grid */}
                {(t.attachments || []).length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-1">
                    ยังไม่มีรูปภาพผลหลังการฉีดพ่น กดปุ่มเพิ่มรูปถ่ายเพื่อบันทึกรูปภาพ
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                    {(t.attachments || []).map((att: any, aIdx: number) => (
                      <div
                        key={aIdx}
                        className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video shadow-2xs"
                      >
                        <img
                          src={att.fileUrl}
                          alt={att.fileName || `ผลการฉีดพ่น #${aIdx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewImageUrl(att.fileUrl)}
                            className="p-1 rounded-full bg-white/90 text-slate-700 hover:bg-white"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {!readonly && (
                            <button
                              type="button"
                              onClick={() => removePhoto(tIdx, aIdx)}
                              className="p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImageUrl}
              alt="ดูรูปถ่ายเต็มขนาด"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
