"use client";

import React, { useState } from "react";
import { Wrench, CheckCircle2, Clock, ImageIcon, Camera, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";
import { ImageFile } from "@/modules/activity-plans/features/actual-view/types";
import {
  ImageLightboxModal,
  LightboxImage,
} from "@/components/custom/image-lightbox-modal";

interface DetailType6IssueProps {
  isVisible: boolean;
  target: {
    customer: string;
    issueType: string;
    detail: string;
    targetStatus: string;
    items?: any[];
  };
  problemDetail?: string;
  initialSolution?: string;
  status?: "เสร็จสิ้น" | "รอติดตาม" | "";
  images?: ImageFile[];
}

export function DetailType6Issue({
  isVisible,
  target,
  problemDetail,
  initialSolution,
  status,
  images = [],
}: DetailType6IssueProps) {
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    title: string;
    images: LightboxImage[];
    initialIndex: number;
  }>({
    isOpen: false,
    title: "",
    images: [],
    initialIndex: 0,
  });

  const openLightbox = (
    title: string,
    imgs: ImageFile[] = [],
    initialIndex: number = 0,
  ) => {
    if (!imgs || imgs.length === 0) return;
    setLightboxState({
      isOpen: true,
      title,
      images: imgs.map((img) => ({
        id: img.id,
        url: img.url,
        name: img.name,
      })),
      initialIndex,
    });
  };

  const closeLightbox = () => {
    setLightboxState((prev) => ({ ...prev, isOpen: false }));
  };

  if (!isVisible) return null;

  return (
    <div className="border border-rose-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-rose-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <Wrench className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-rose-900 text-base md:text-lg">
            แก้ปัญหา / รับเรื่องร้องเรียน
          </h2>
        </div>
      </div>

      {/* PLANNED TARGET CARD */}
      <ActualTargetCard
        iconColorClass="text-rose-600"
        badgeColorClass="bg-rose-50 text-rose-800 border border-rose-200"
        gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
        items={[
          { label: "ลูกค้า:", value: target.customer || "-" },
          { label: "ประเภทปัญหา:", value: target.issueType || "-" },
          { label: "รายละเอียดปัญหา:", value: target.detail || "-" },
          { label: "เป้าหมายการแก้ปัญหา:", value: target.targetStatus || "-" },
        ]}
      />

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span>ผลการแก้ไขปัญหาจริง</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 md:col-span-2">
            <span className="text-xs text-slate-500 font-medium block">
              รายละเอียดปัญหาที่พบ / ข้อร้องเรียน
            </span>
            <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
              {problemDetail || target.detail || "-"}
            </p>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              สถานะการแก้ปัญหา
            </span>
            {status ? (
              <Badge
                variant="outline"
                className={
                  status === "เสร็จสิ้น"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs px-3 py-1 mt-1"
                    : "bg-amber-50 text-amber-800 border-amber-300 font-bold text-xs px-3 py-1 mt-1"
                }
              >
                {status === "เสร็จสิ้น" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                ) : (
                  <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                )}
                {status}
              </Badge>
            ) : (
              <span className="text-xs text-slate-700 font-semibold">-</span>
            )}
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 md:col-span-3">
            <span className="text-xs text-slate-500 font-medium block">
              แนวทางแก้ไขปัญหาเบื้องต้น
            </span>
            <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
              {initialSolution || "-"}
            </p>
          </div>
        </div>

        {/* ISSUE IMAGES (READ-ONLY LIGHTBOX) */}
        <div className="bg-rose-50/20 border border-rose-200/70 rounded-2xl p-4 sm:p-4.5 space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-rose-100/80 pb-2">
            <span className="text-xs sm:text-sm font-bold text-rose-950 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-rose-600" />
              ภาพถ่ายปัญหา / การแก้ไข
            </span>
            {images && images.length > 0 ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                {images.length} รูป
              </span>
            ) : null}
          </div>

          {images && images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {images.map((img, imgIdx) => (
                <button
                  key={img.id || imgIdx}
                  type="button"
                  onClick={() =>
                    openLightbox(
                      `ภาพถ่ายปัญหา / การแก้ไข - ${target.customer || "ลูกค้า"}`,
                      images,
                      imgIdx,
                    )
                  }
                  className="group relative rounded-xl border border-rose-200/80 overflow-hidden bg-slate-100 aspect-video flex items-center justify-center shadow-2xs hover:shadow-md hover:border-rose-400 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  aria-label={`คลิกเพื่อดูรูปภาพปัญหาที่ ${imgIdx + 1} ขนาดใหญ่`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.name || `ภาพถ่ายปัญหา ${imgIdx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-black/60 text-white backdrop-blur-xs shadow-md">
                      <Eye className="w-4 h-4" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
              <ImageIcon className="w-4 h-4 opacity-50 text-slate-400" />
              <span>ไม่มีภาพถ่ายปัญหา / การแก้ไข</span>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Viewer */}
      <ImageLightboxModal
        isOpen={lightboxState.isOpen}
        onClose={closeLightbox}
        title={lightboxState.title}
        images={lightboxState.images}
        initialIndex={lightboxState.initialIndex}
      />
    </div>
  );
}
