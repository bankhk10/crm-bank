"use client";

import React from "react";
import { Camera, HelpCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ActualTargetCard } from "../actual-target-card";
import { ImageFile } from "../../types";
import GalleryUpload from "@/components/custom/gallery-upload";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import {
  convertToFileMetadata,
  filesWithPreviewToImageFiles,
  isImageFilesEqual,
} from "../../utils";

export interface TargetIssueItem {
  customer: string;
  issueType: string;
  detail: string;
}

interface ActualType6IssueProps {
  isVisible: boolean;
  target: {
    customer: string;
    issueType: string;
    detail: string;
    targetStatus?: string;
    items?: TargetIssueItem[];
  };
  problemDetail: string;
  setProblemDetail: (v: string) => void;
  initialSolution: string;
  setInitialSolution: (v: string) => void;
  status: "เสร็จสิ้น" | "รอติดตาม" | "";
  setStatus: (v: "เสร็จสิ้น" | "รอติดตาม" | "") => void;
  images: ImageFile[];
  setImages: (v: ImageFile[]) => void;
  onUploadImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: (id: string) => void;
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
  images = [],
  setImages,
}: ActualType6IssueProps) {
  if (!isVisible) return null;

  const hasMultipleItems = target.items && target.items.length > 1;

  const handleFilesChange = (files: FileWithPreview[]) => {
    const converted = filesWithPreviewToImageFiles(files);
    if (!isImageFilesEqual(images, converted) && setImages) {
      setImages(converted);
    }
  };

  return (
    <div className="border border-rose-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-rose-100 pb-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-bold text-rose-900 text-base md:text-lg">
            แก้ปัญหา / รับเรื่องร้องเรียน
          </h2>
        </div>
      </div>

      {hasMultipleItems ? (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-rose-600" />
              รายการเป้าหมายแก้ปัญหา / รับเรื่องร้องเรียน ({target.items?.length} รายการ):
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              จากฟอร์มสร้างแผน
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {target.items?.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                  <span className="flex items-center gap-1.5 text-xs text-rose-900">
                    <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-[10px] font-extrabold">
                      {idx + 1}
                    </span>
                    ลูกค้า: {item.customer || "-"}
                  </span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      ประเภทปัญหา:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {item.issueType || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      รายละเอียดเพิ่มเติม:
                    </span>
                    <span className="font-medium text-slate-700 block break-words whitespace-pre-wrap">
                      {item.detail || "-"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ActualTargetCard
          iconColorClass="text-rose-600"
          badgeColorClass="bg-rose-100 text-rose-800"
          gridColsClass="grid-cols-1 sm:grid-cols-3"
          items={[
            { label: "ลูกค้า/ร้านค้า:", value: target.customer || "-" },
            { label: "ประเภทปัญหา:", value: target.issueType || "-" },
            {
              label: "รายละเอียดเพิ่มเติม:",
              value: target.detail || "-",
            },
          ]}
        />
      )}

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

      {/* GalleryUpload Standard */}
      <div className="bg-rose-50/20 border border-rose-200/70 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-rose-100 pb-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-rose-950">
              รูปภาพประกอบการแก้ปัญหา / รับเรื่องร้องเรียน
            </h4>
            <p className="text-[11px] text-rose-700/80">
              อัปโหลดรูปภาพสินค้ามีปัญหา หรือรูปถ่ายหน้างาน (สูงสุด 10 รูป)
            </p>
          </div>
        </div>
        <GalleryUpload
          maxFiles={10}
          maxSize={20 * 1024 * 1024}
          accept="image/*"
          multiple={true}
          initialFiles={convertToFileMetadata(images || [])}
          onFilesChange={handleFilesChange}
        />
      </div>
    </div>
  );
}
