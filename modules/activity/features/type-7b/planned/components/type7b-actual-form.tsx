"use client";

import React, { useMemo } from "react";
import {
  Sprout,
  Droplets,
  Camera,
  Star,
  TrendingUp,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import {
  ActivityInput,
  ActivityTextarea,
  ActivityCombobox,
  ActivityPhotoUpload,
} from "@/modules/activity/ui";
import {
  CROP_CONDITIONS,
  PRODUCT_RESPONSES,
  SPRAY_METHODS,
  SPRAY_EQUIPMENTS,
  COMMERCIAL_POTENTIALS,
  SATISFACTION_SCORES,
  DEMO_PLOT_STATUS_OPTIONS,
} from "../../shared/constants";
import type { Type7bActualFormProps } from "../types/actual.types";
import { Type7bPlanCard } from "./type7b-plan-card";

export function Type7bActualForm({
  isVisible = true,
  planType,
  target,
  targets = [],
  actualState = {},
  onUpdateField,
  readonly = false,
}: Type7bActualFormProps) {
  if (!isVisible) return null;

  const resolvedTargets = targets.length > 0 ? targets : target ? [target] : [];

  const cropConditionOptions = CROP_CONDITIONS.map((c) => ({ value: c, label: c }));
  const responseOptions = PRODUCT_RESPONSES.map((r) => ({ value: r, label: r }));
  const sprayMethodOptions = SPRAY_METHODS.map((m) => ({ value: m, label: m }));
  const sprayEquipOptions = SPRAY_EQUIPMENTS.map((e) => ({ value: e, label: e }));
  const commercialOptions = COMMERCIAL_POTENTIALS.map((c) => ({ value: c, label: c }));

  const satisfactionOptions = SATISFACTION_SCORES.map((s) => ({
    value: String(s.value),
    label: s.label,
  }));

  const statusOptions = DEMO_PLOT_STATUS_OPTIONS.map((s) => ({
    value: s.value,
    label: s.label,
  }));

  const isFinalRound = actualState.t7PlotStatus === "COMPLETED";

  return (
    <div className="space-y-6">
      {/* 1. Plan Reference Card */}
      {planType !== "UNPLANNED" && resolvedTargets.length > 0 && (
        <Type7bPlanCard targets={resolvedTargets as any} />
      )}

      {/* 2. Actual Recording Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              บันทึกผลการติดตามแปลงสาธิตจริง
            </h3>
            <p className="text-xs text-slate-500">
              ประเมินการเจริญเติบโตของพืช, การตอบสนองต่อผลิตภัณฑ์ และรูปถ่ายติดตามแปลง
            </p>
          </div>
        </div>

        {/* Section 1: สภาพแปลง & การเจริญเติบโต */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-l-2 border-emerald-500 pl-2">
            <span>สภาพแปลงและการเจริญเติบโตของพืช</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <ActivityCombobox
              label="สภาพแปลง / สภาพพืช"
              labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
              value={actualState.t7CropCondition || "สมบูรณ์"}
              onChange={(val) => onUpdateField?.("t7CropCondition", val)}
              options={cropConditionOptions}
              placeholder="เลือกสภาพแปลง..."
              disabled={readonly}
              required
            />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                ระยะการเจริญเติบโต (Growth Stage) <span className="text-rose-500">*</span>
              </label>
              <ActivityInput
                value={actualState.t7GrowthStage || ""}
                onChange={(e) => onUpdateField?.("t7GrowthStage", e.target.value)}
                disabled={readonly}
                placeholder="เช่น แตกใบอ่อน, ติดผลอ่อน, ระยะขยายผล..."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <ActivityCombobox
              label="การตอบสนองต่อผลิตภัณฑ์"
              labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
              value={actualState.t7ProductResponse || "พืชตอบสนองดี"}
              onChange={(val) => onUpdateField?.("t7ProductResponse", val)}
              options={responseOptions}
              placeholder="เลือกการตอบสนอง..."
              disabled={readonly}
            />

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">อายุพืช (ตัวเลข)</label>
                <ActivityInput
                  type="number"
                  value={actualState.t7CropAgeValue || ""}
                  onChange={(e) => onUpdateField?.("t7CropAgeValue", e.target.value)}
                  disabled={readonly}
                  placeholder="ระบุตัวเลข..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">หน่วยอายุพืช</label>
                <ActivityInput
                  value={actualState.t7CropAgeUnit || "วัน"}
                  onChange={(e) => onUpdateField?.("t7CropAgeUnit", e.target.value)}
                  disabled={readonly}
                  placeholder="วัน / เดือน"
                />
              </div>
            </div>
          </div>

          <ActivityTextarea
            label="อาการผิดปกติ / ปัญหาโรคและแมลงที่พบ"
            labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
            rows={2}
            value={actualState.t7CropProblemDescription || actualState.t7ProblemDescription || ""}
            onChange={(e) => {
              onUpdateField?.("t7CropProblemDescription", e.target.value);
              onUpdateField?.("t7ProblemDescription", e.target.value);
            }}
            disabled={readonly}
            placeholder="ระบุอาการผิดปกติ โรค แมลง หรือข้อสังเกตเพิ่มเติม (ถ้ามี)..."
          />
        </div>

        {/* Section 2: วิธีการพ่น & การติดตามถัดไป */}
        <div className="space-y-4 pt-3 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-l-2 border-emerald-500 pl-2">
            <Droplets className="w-3.5 h-3.5 text-emerald-600" />
            <span>การฉีดพ่นและกำหนดนัดหมายถัดไป</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <ActivityCombobox
              label="วิธีการฉีดพ่น"
              labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
              value={actualState.t7SprayMethod || ""}
              onChange={(val) => onUpdateField?.("t7SprayMethod", val)}
              options={sprayMethodOptions}
              placeholder="เลือกวิธีการพ่น..."
              disabled={readonly}
            />

            <ActivityCombobox
              label="อุปกรณ์หัวพ่น"
              labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
              value={actualState.t7SprayEquipment || ""}
              onChange={(val) => onUpdateField?.("t7SprayEquipment", val)}
              options={sprayEquipOptions}
              placeholder="เลือกอุปกรณ์..."
              disabled={readonly}
            />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">กำหนดติดตาม / พ่นครั้งถัดไป</label>
              <ActivityInput
                type="date"
                value={actualState.t7NextSprayDate || actualState.t7NextFollowUpDate || ""}
                onChange={(e) => {
                  onUpdateField?.("t7NextSprayDate", e.target.value);
                  onUpdateField?.("t7NextFollowUpDate", e.target.value);
                }}
                disabled={readonly}
              />
            </div>
          </div>
        </div>

        {/* Section 3: รูปถ่ายการติดตาม */}
        <div className="space-y-4 pt-3 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-l-2 border-emerald-500 pl-2">
            <Camera className="w-3.5 h-3.5 text-emerald-600" />
            <span>รูปถ่ายติดตามแปลงสาธิต</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ActivityPhotoUpload
              title="รูปถ่ายพืช / ผลผลิตจริง"
              description="แนบรูปถ่ายการแตกใบ ผลผลิต หรืออาการที่ต้องการติดตาม"
              images={(actualState.t7CropImages as any) || []}
              onImagesChange={(imgs) => onUpdateField?.("t7CropImages", imgs)}
              disabled={readonly}
              maxFiles={5}
            />

            <ActivityPhotoUpload
              title="รูปถ่ายบรรยากาศแปลงสาธิต"
              description="แนบรูปภาพมุมกว้างของแปลงสาธิตหรือเจ้าของแปลง"
              images={(actualState.t7PlotImages as any) || []}
              onImagesChange={(imgs) => onUpdateField?.("t7PlotImages", imgs)}
              disabled={readonly}
              maxFiles={5}
            />
          </div>
        </div>

        {/* Section 4: สถานะแปลง & การประเมินผลผลิตเมื่อเสร็จสิ้น */}
        <div className="space-y-4 pt-3 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-l-2 border-emerald-500 pl-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>สถานะแปลงสาธิตและการประเมินผล</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <ActivityCombobox
              label="สถานะแปลงสาธิตในรอบนี้"
              labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
              value={actualState.t7PlotStatus || "IN_PROGRESS"}
              onChange={(val) => onUpdateField?.("t7PlotStatus", val)}
              options={statusOptions}
              disabled={readonly}
            />

            <ActivityCombobox
              label="โอกาสขยายผลเชิงพาณิชย์"
              labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
              value={actualState.t7CommercialPotential || "สูง (เกษตรกรสนใจมาก)"}
              onChange={(val) => onUpdateField?.("t7CommercialPotential", val)}
              options={commercialOptions}
              disabled={readonly}
            />
          </div>

          {/* ถ้าเป็นรอบเก็บเกี่ยวหรือเสร็จสิ้นโครงการ แสดงช่องกรอกผลผลิตและความพึงพอใจ */}
          {isFinalRound && (
            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3.5 sm:p-4 space-y-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>การประเมินผลผลิตรอบสุดท้าย (เมื่อเสร็จสิ้นแปลงสาธิต)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">ผลผลิตแปลงสาธิต (กก.)</label>
                  <ActivityInput
                    type="number"
                    value={actualState.t7FinalYieldKg || ""}
                    onChange={(e) => onUpdateField?.("t7FinalYieldKg", e.target.value)}
                    disabled={readonly}
                    placeholder="เช่น 1500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">ผลผลิตแปลงเปรียบเทียบ (กก.)</label>
                  <ActivityInput
                    type="number"
                    value={actualState.t7ControlYieldKg || ""}
                    onChange={(e) => onUpdateField?.("t7ControlYieldKg", e.target.value)}
                    disabled={readonly}
                    placeholder="เช่น 1200"
                  />
                </div>

                <ActivityCombobox
                  label="ความพึงพอใจของเกษตรกร"
                  labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                  value={String(actualState.t7FarmerSatisfaction || "5")}
                  onChange={(val) => onUpdateField?.("t7FarmerSatisfaction", parseInt(val, 10))}
                  options={satisfactionOptions}
                  disabled={readonly}
                />
              </div>

              <ActivityTextarea
                label="บทสรุปผลการจัดทำแปลงสาธิตภาพรวม"
                labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                rows={2}
                value={actualState.t7FinalSummaryNotes || ""}
                onChange={(e) => onUpdateField?.("t7FinalSummaryNotes", e.target.value)}
                disabled={readonly}
                placeholder="สรุปความคุ้มค่า ความประทับใจของเกษตรกร และข้อสังเกตเพื่อวางแผนขยายยอดขาย..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Backward-compatible alias
export const ActualType7FollowUp = Type7bActualForm;
