"use client";

import React from "react";
import { Camera, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ActualTargetCard } from "../actual-target-card";
import { ImageFile } from "../../types";

interface ActualType6IssueProps {
  isVisible: boolean;
  target: {
    customer: string;
    issueType: string;
    detail: string;
    targetStatus: string;
  };
  problemDetail: string;
  setProblemDetail: (v: string) => void;
  initialSolution: string;
  setInitialSolution: (v: string) => void;
  status: "เสร็จสิ้น" | "รอติดตาม" | "";
  setStatus: (v: "เสร็จสิ้น" | "รอติดตาม" | "") => void;
  images: ImageFile[];
  onUploadImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
}

export function ActualType6Issue({
  isVisible,
  target,
  problemDetail,
  setProblemDetail,
  initialSolution,
  setInitialSolution,
  status,
  setStatus,
  images,
  onUploadImages,
  onRemoveImage,
}: ActualType6IssueProps) {
  if (!isVisible) return null;

  return (
    <div className="border-2 border-rose-500 rounded-2xl p-4 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-rose-100 pb-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-bold text-rose-900 text-base md:text-lg">
            แก้ปัญหา / รับเรื่องร้องเรียน
          </h2>
        </div>
      </div>

      <ActualTargetCard
        iconColorClass="text-rose-600"
        badgeColorClass="bg-rose-100 text-rose-800"
        gridColsClass="grid-cols-1 md:grid-cols-2"
        items={[
          { label: "ลูกค้า/ร้านค้า:", value: target.customer },
          { label: "ประเภทปัญหา:", value: target.issueType },
        ]}
      />

      <div className="space-y-1.5 pt-1">
        <label className="text-sm font-semibold text-slate-800">
          รายละเอียดปัญหา <span className="text-rose-500">*</span>
        </label>
        <Textarea
          rows={2}
          value={problemDetail}
          onChange={(e) => setProblemDetail(e.target.value)}
          placeholder="อธิบายอาการ หรือปัญหาที่ลูกค้าร้องเรียนอย่างละเอียด"
          className="bg-white border-slate-300"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800">
          แนวทางการแก้ไขเบื้องต้น <span className="text-rose-500">*</span>
        </label>
        <Textarea
          rows={2}
          value={initialSolution}
          onChange={(e) => setInitialSolution(e.target.value)}
          placeholder="ระบุการให้คำแนะนำ การเปลี่ยนสินค้า หรือการดำเนินการแก้ไข"
          className="bg-white border-slate-300"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-800">
          สถานะการดำเนินการ <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          {(["เสร็จสิ้น", "รอติดตาม"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatus(st)}
              className={cn(
                "py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all",
                status === st
                  ? st === "เสร็จสิ้น"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                    : "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
              )}
            >
              {st === "เสร็จสิ้น" ? "✅ เสร็จสิ้น" : "⏳ รอติดตาม"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800">
          รูปภาพประกอบ
        </label>
        <div className="border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/20 hover:bg-rose-50/40 rounded-2xl p-5 text-center transition-colors cursor-pointer relative group">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onUploadImages}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-rose-900">
              คลิกเพื่ออัปโหลด รูปภาพสินค้ามีปัญหา หรือ รูปหน้างาน
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
