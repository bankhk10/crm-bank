"use client";

import React from "react";
import { Megaphone, FileText, Camera } from "lucide-react";
import {
  ActivityTextarea,
  ActivityPhotoUpload,
} from "@/modules/activity/ui";
import { Type15PlanCard } from "./type15-plan-card";
import type { Type15ActualFormProps } from "../types/actual.types";
import { TYPE_15_MAX_IMAGES } from "../../shared/constants";

export function Type15ActualForm({
  isVisible = true,
  target,
  targets,
  detail = "",
  setDetail,
  images = [],
  setImages,
  readonly = false,
}: Type15ActualFormProps) {
  if (!isVisible) return null;

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
          <Megaphone className="h-4 w-4" />
        </div>
        <div>
          <span className="text-slate-800 font-bold text-sm sm:text-base">
            บันทึกผลการปฏิบัติงาน: บูมทีม / คาราวาน
          </span>
          <p className="text-xs text-slate-500 font-normal">
            บันทึกรายละเอียดผลการปฏิบัติงานจริงและแนบรูปถ่ายการลงพื้นที่ (สูงสุด 10 รูป)
          </p>
        </div>
      </div>

      {/* Plan Target Summary Card */}
      <Type15PlanCard target={target} targets={targets} />

      {/* 1. รายละเอียดผลการปฏิบัติงานเพิ่มเติม */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
        <label className="block text-xs font-bold text-slate-800">
          <span className="inline-flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-orange-600" />
            รายละเอียดผลการปฏิบัติงานเพิ่มเติม
          </span>
        </label>
        <ActivityTextarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          disabled={readonly}
          rows={4}
          placeholder="บันทึกผลการปฏิบัติงานจริง เช่น ขบวนคาราวานผ่านจุดใดบ้าง การตอบรับของเกษตรกรและร้านค้า ผลการนำเสนอสินค้า ข้อเสนอแนะ หรือปัญหาที่พบ..."
        />
      </div>

      {/* 2. อัพโหลดรูปภาพ (สูงสุด 10 รูป) */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <ActivityPhotoUpload
          title="รูปภาพกิจกรรมบูมทีม / คาราวาน"
          description={`อัพโหลดรูปภาพบรรยากาศการลงพื้นที่ ขบวนคาราวาน หรือกิจกรรมร่วมกับร้านค้า/เกษตรกร (สูงสุด ${TYPE_15_MAX_IMAGES} รูป)`}
          images={images}
          onImagesChange={setImages}
          maxFiles={TYPE_15_MAX_IMAGES}
          accentColor="amber"
          icon={<Camera className="w-4 h-4 text-orange-600" />}
          readonly={readonly}
        />
      </div>
    </div>
  );
}

