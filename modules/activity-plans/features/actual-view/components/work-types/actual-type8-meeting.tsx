"use client";

import React from "react";
import { Users, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActualTargetCard } from "../actual-target-card";
import { ImageFile } from "../../types";

interface ActualType8MeetingProps {
  isVisible: boolean;
  target: {
    topic: string;
    products: string;
    targetAttendees: string;
  };
  actualAttendees: string;
  setActualAttendees: (v: string) => void;
  feedbackQnA: string;
  setFeedbackQnA: (v: string) => void;
  images: ImageFile[];
  onUploadImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
}

export function ActualType8Meeting({
  isVisible,
  target,
  actualAttendees,
  setActualAttendees,
  feedbackQnA,
  setFeedbackQnA,
  images,
  onUploadImages,
  onRemoveImage,
}: ActualType8MeetingProps) {
  if (!isVisible) return null;

  return (
    <div className="border-2 border-violet-500 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-violet-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white font-bold text-sm shadow-2xs">
            8
          </span>
          <h2 className="font-bold text-violet-900 text-base md:text-lg">
            จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์
          </h2>
        </div>
      </div>

      <ActualTargetCard
        iconColorClass="text-violet-600"
        badgeColorClass="bg-violet-100 text-violet-800"
        gridColsClass="grid-cols-1 sm:grid-cols-3"
        items={[
          { label: "หัวข้อประชุม:", value: target.topic, colSpan: "sm:col-span-2" },
          { label: "เป้าหมายผู้เข้าร่วม:", value: target.targetAttendees, highlight: true },
        ]}
      />

      <div className="space-y-1.5 max-w-xs pt-1">
        <label className="text-sm font-semibold text-slate-800">
          จำนวนผู้เข้าร่วมจริง (คน) <span className="text-rose-500">*</span>
        </label>
        <div className="relative flex items-center">
          <Input
            type="number"
            min="0"
            value={actualAttendees}
            onChange={(e) => setActualAttendees(e.target.value)}
            placeholder="ระบุจำนวน"
            className="bg-white border-slate-300 pr-12"
          />
          <span className="absolute right-3 text-xs font-semibold text-slate-500">
            คน
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800">
          ประเด็นคำถามหรือข้อเสนอแนะที่ได้รับ <span className="text-rose-500">*</span>
        </label>
        <Textarea
          rows={3}
          value={feedbackQnA}
          onChange={(e) => setFeedbackQnA(e.target.value)}
          placeholder="สรุปข้อซักถาม ข้อเสนอแนะ หรือความต้องการเพิ่มเติมจากผู้เข้าประชุม"
          className="bg-white border-slate-300"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">
          รูปภาพบรรยากาศการประชุม <span className="text-rose-500">*</span>
        </label>
        <div className="border-2 border-dashed border-violet-200 hover:border-violet-400 bg-violet-50/20 hover:bg-violet-50/40 rounded-2xl p-5 text-center transition-colors cursor-pointer relative group">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onUploadImages}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-violet-900">
              คลิกเพื่ออัปโหลด รูปบรรยากาศการจัดประชุม
            </p>
          </div>
        </div>
        {images.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative aspect-square rounded-lg overflow-hidden border border-slate-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage(img.id)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
