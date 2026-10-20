"use client";

import React from "react";
import { Users, FileText, AlertCircle, Camera, Plane } from "lucide-react";
import {
  ActivityInput,
  ActivityTextarea,
  ActivityPhotoUpload,
} from "@/modules/activity/ui";
import { Type12PlanCard } from "./type12-plan-card";
import type { Type12ActualFormProps } from "../types/actual.types";

export type { Type12ActualFormProps };

export function Type12ActualForm({
  isVisible = true,
  planType,
  target,
  targets,
  actualAttendees = "",
  setActualAttendees,
  tourHighlights = "",
  setTourHighlights,
  feedbackIssues = "",
  setFeedbackIssues,
  images = [],
  setImages,
  onUploadImages,
  readonly = false,
  className = "",
}: Type12ActualFormProps) {
  if (!isVisible) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Plan Overview Reference */}
      <Type12PlanCard
        isVisible={isVisible}
        planType={planType}
        target={target}
        targets={targets}
      />

      {/* 2. Actual Tour Execution Form */}
      <div className="bg-white border border-sky-200/80 rounded-2xl p-4 sm:p-5 space-y-5 shadow-xs">
        <div className="flex items-center gap-2.5 border-b border-sky-100 pb-3">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              บันทึกผลการปฏิบัติงาน: พาลูกค้าศึกษาดูงาน (Tour)
            </h4>
            <p className="text-xs text-slate-500">
              ระบุผลลัพธ์การเดินทาง จำนวนผู้เข้าร่วม และรูปภาพกิจกรรม
            </p>
          </div>
        </div>

        {/* ผู้ร่วมเดินทางจริง */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              จำนวนผู้ร่วมเดินทางจริง (คน)
            </label>
            <ActivityInput
              type="number"
              min={0}
              disabled={readonly}
              value={actualAttendees !== undefined ? String(actualAttendees) : ""}
              onChange={(e) => setActualAttendees?.(e.target.value)}
              placeholder="เช่น 15"
            />
          </div>
        </div>

        {/* สรุปไฮไลท์และผลการศึกษาดูงาน */}
        <ActivityTextarea
          label="สรุปไฮไลท์ / ประโยชน์ที่ได้รับจากการศึกษาดูงาน"
          disabled={readonly}
          value={tourHighlights}
          onChange={(e) => setTourHighlights?.(e.target.value)}
          placeholder="ระบุสถานที่สำคัญที่เข้าชม ความรู้ นวัตกรรม หรือข้อตกลงทางธุรกิจที่ได้รับ..."
          rows={3}
        />

        {/* ข้อคิดเห็น หรือ ปัญหาอุปสรรค */}
        <ActivityTextarea
          label="ข้อคิดเห็นจากลูกค้า / ปัญหาและอุปสรรคระหว่างเดินทาง"
          disabled={readonly}
          value={feedbackIssues}
          onChange={(e) => setFeedbackIssues?.(e.target.value)}
          placeholder="เช่น สภาพอากาศ ความพึงพอใจของลูกค้า หรือข้อเสนอแนะสำหรับการจัดทัวร์ครั้งต่อไป..."
          rows={3}
        />

        {/* รูปภาพกิจกรรมศึกษาดูงาน */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-sky-600" />
            รูปภาพกิจกรรมการศึกษาดูงาน / บรรยากาศทัวร์
          </label>
          <ActivityPhotoUpload
            images={images as any}
            onImagesChange={(imgs) => setImages?.(imgs as any)}
            maxFiles={10}
            readonly={readonly}
          />
        </div>
      </div>
    </div>
  );
}

export { Type12ActualForm as ActualType12Tour, Type12ActualForm as ActualType12TourForm };
