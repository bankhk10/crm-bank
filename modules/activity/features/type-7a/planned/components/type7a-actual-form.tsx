"use client";

import React, { useMemo } from "react";
import { Sprout, MapPin, Package, Camera, Calendar } from "lucide-react";
import {
  ActivityInput,
  ActivityTextarea,
  ActivityCombobox,
  ActivityCustomerSelect,
  ActivityProductSelect,
  ActivityPhotoUpload,
  ActivityGpsPicker,
} from "@/modules/activity/ui";
import { CROP_CATEGORIES, PLOT_OBJECTIVES } from "../../shared/constants";
import type { Type7aActualFormProps } from "../types/actual.types";
import { Type7aPlanCard } from "./type7a-plan-card";

export function Type7aActualForm({
  isVisible = true,
  planType,
  target,
  targets = [],
  customers = [],
  products = [],
  actualState = {},
  onUpdateField,
  readonly = false,
}: Type7aActualFormProps) {
  if (!isVisible) return null;

  const resolvedTargets = targets.length > 0 ? targets : target ? [target] : [];
  const cropCategoryOptions = CROP_CATEGORIES.map((c) => ({ value: c, label: c }));
  const objectiveOptions = PLOT_OBJECTIVES.map((o) => ({ value: o, label: o }));

  return (
    <div className="space-y-6">
      {/* 1. Plan Reference Card */}
      {planType !== "UNPLANNED" && resolvedTargets.length > 0 && (
        <Type7aPlanCard targets={resolvedTargets as any} />
      )}

      {/* 2. Actual Recording Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              บันทึกผลการจัดทำแปลงสาธิตจริง
            </h3>
            <p className="text-xs text-slate-500">
              กรอกข้อมูลสภาพแปลงจริง, ชนิดพืช, พิกัด GPS และรูปถ่ายแปลงสาธิต
            </p>
          </div>
        </div>

        {/* Form Fields Grid */}
        <div className="space-y-4">
          {/* Row 1: ชื่อแปลง & เกษตรกร */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                ชื่อแปลงสาธิต <span className="text-rose-500">*</span>
              </label>
              <ActivityInput
                value={actualState.t7PlotName || ""}
                onChange={(e) => onUpdateField?.("t7PlotName", e.target.value)}
                disabled={readonly}
                placeholder="ระบุชื่อแปลงสาธิต..."
                required
              />
            </div>

            <ActivityCustomerSelect
              id="actual-t7-farmer-combobox"
              type="FARMER"
              label="เจ้าของแปลง (เกษตรกร) / ร้านค้า"
              labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
              value={actualState.t7FarmerCustomerId || actualState.t7FarmerName || ""}
              onChange={(val, cust) => {
                onUpdateField?.("t7FarmerName", cust?.name || val);
                if (cust?.id) {
                  onUpdateField?.("t7FarmerCustomerId", cust.id);
                }
              }}
              customers={customers as any}
              placeholder="เลือกเกษตรกร หรือพิมพ์ชื่อ..."
              searchPlaceholder="ค้นหาเกษตรกร..."
              emptyText="ไม่พบเกษตรกร"
              disabled={readonly}
              required
            />
          </div>

          {/* Row 2: พืชที่ทดสอบ & พื้นที่ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <ActivityCombobox
              label="กลุ่มพืช"
              labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
              options={cropCategoryOptions}
              value={actualState.t7CropCategory || ""}
              onChange={(val) => onUpdateField?.("t7CropCategory", val)}
              placeholder="เลือกกลุ่มพืช..."
              disabled={readonly}
            />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                ชนิดพืช / สายพันธุ์ <span className="text-rose-500">*</span>
              </label>
              <ActivityInput
                value={actualState.t7CropName || actualState.t7CustomCropName || ""}
                onChange={(e) => {
                  onUpdateField?.("t7CropName", e.target.value);
                  onUpdateField?.("t7CustomCropName", e.target.value);
                }}
                disabled={readonly}
                placeholder="เช่น ข้าว กข43, ทุเรียนหมอนทอง"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">พื้นที่แปลงจริง (ไร่)</label>
              <ActivityInput
                type="number"
                value={actualState.t7AreaRai != null ? String(actualState.t7AreaRai) : ""}
                onChange={(e) => onUpdateField?.("t7AreaRai", e.target.value)}
                disabled={readonly}
                placeholder="เช่น 5"
              />
            </div>
          </div>

          {/* Row 3: วัตถุประสงค์ & วันที่เริ่มปลูก/พ่น */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <ActivityCombobox
              label="วัตถุประสงค์การจัดทำแปลง"
              labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
              options={objectiveOptions}
              value={actualState.t7PlotObjective || ""}
              onChange={(val) => onUpdateField?.("t7PlotObjective", val)}
              placeholder="เลือกวัตถุประสงค์..."
              disabled={readonly}
            />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">วันที่เริ่มฉีดพ่นครั้งแรก</label>
              <ActivityInput
                type="date"
                value={actualState.t7InitialSprayDate ? String(actualState.t7InitialSprayDate).split("T")[0] : ""}
                onChange={(e) => onUpdateField?.("t7InitialSprayDate", e.target.value)}
                disabled={readonly}
              />
            </div>
          </div>

          {/* Row 4: รายละเอียดการทดสอบ / หมายเหตุ */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              รายละเอียดการทดลอง / แผนการดูแลรักษา
            </label>
            <ActivityTextarea
              rows={2}
              value={actualState.t7ExperimentDetail || ""}
              onChange={(e) => onUpdateField?.("t7ExperimentDetail", e.target.value)}
              disabled={readonly}
              placeholder="ระบุสูตรการใช้ อัตราส่วนผสม หรือขั้นตอนที่ทำร่วมกับเกษตรกร..."
            />
          </div>

          {/* Row 5: พิกัดแปลง GPS */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              พิกัดแปลงสาธิตหน้างาน (GPS)
            </label>
            <ActivityGpsPicker
              latitude={actualState.t7Latitude != null ? String(actualState.t7Latitude) : undefined}
              longitude={actualState.t7Longitude != null ? String(actualState.t7Longitude) : undefined}
              onLocationChange={(lat: string, lng: string) => {
                onUpdateField?.("t7Latitude", lat ? Number(lat) : undefined);
                onUpdateField?.("t7Longitude", lng ? Number(lng) : undefined);
              }}
              readonly={readonly}
            />
          </div>

          {/* Row 6: รูปถ่ายแปลงสาธิต */}
          <div className="pt-2">
            <ActivityPhotoUpload
              title="รูปถ่ายแปลงสาธิตและต้นพืช"
              description="รูปถ่ายป้ายแปลง, แปลงทดสอบ, สภาพดิน หรือรูปถ่ายขณะลงมือสาธิต"
              images={actualState.t7InitialPhotos || []}
              onImagesChange={(imgs) => onUpdateField?.("t7InitialPhotos", imgs)}
              maxFiles={6}
              accentColor="emerald"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Backward-compatible alias
export const ActualType7NewDemo = Type7aActualForm;
