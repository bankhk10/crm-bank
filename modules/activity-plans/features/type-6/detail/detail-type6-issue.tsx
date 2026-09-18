"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ImageIcon,
  Camera,
  Eye,
  Store,
  Globe,
  Package,
  Barcode,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ActualTargetCard } from "@/modules/activity-plans/features/shared/actual-view/components/actual-target-card";
import {
  ImageFile,
  Type6IssueRecord,
} from "@/modules/activity-plans/features/shared/actual-view/types";
import {
  ImageLightboxModal,
  LightboxImage,
} from "@/components/custom/image-lightbox-modal";

export interface DetailType6IssueProps {
  isVisible: boolean;
  target: {
    customer: string;
    issueType: string;
    detail: string;
    targetStatus?: string;
    items?: any[];
  };
  issueRecord?: Type6IssueRecord;
  productName?: string;
  lotNumber?: string;
  purchaseChannel?: string;
  storeName?: string;
  issueType?: string;
  detail?: string;
  status?: "เสร็จสิ้น" | "รอติดตาม" | string;
  images?: ImageFile[];

  // Legacy fallback props
  problemDetail?: string;
  initialSolution?: string;
}

export function DetailType6Issue({
  isVisible,
  target,
  issueRecord,
  productName,
  lotNumber,
  purchaseChannel,
  storeName,
  issueType,
  detail,
  status,
  images = [],
  problemDetail,
  initialSolution,
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

  if (!isVisible) return null;

  // Resolve values prioritizing issueRecord then individual props then target/fallback
  const resolvedProductName = issueRecord?.productName || productName || "";
  const resolvedLotNumber = issueRecord?.lotNumber || lotNumber || "";
  const resolvedPurchaseChannel =
    issueRecord?.purchaseChannel || purchaseChannel || "";
  const resolvedStoreName = issueRecord?.storeName || storeName || "";
  const resolvedIssueType =
    issueRecord?.issueType || issueType || target.issueType || "";
  const resolvedDetail =
    issueRecord?.detail || detail || problemDetail || target.detail || "";
  const resolvedStatus = issueRecord?.status || status || "";
  const resolvedImages =
    issueRecord?.images && issueRecord.images.length > 0
      ? issueRecord.images
      : images;

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

  return (
    <div className="border border-rose-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-rose-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <AlertCircle className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-rose-900 text-base md:text-lg">
            ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา
          </h2>
        </div>
      </div>

      {/* PLANNED TARGET CARD */}
      {target.items && target.items.length > 1 ? (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              รายการเป้าหมายตรวจสอบเรื่องร้องเรียน / แก้ปัญหา (
              {target.items.length} รายการ):
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              จากฟอร์มสร้างแผน
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {target.items.map((item: any, idx: number) => (
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
                  {item.detail && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        รายละเอียด:
                      </span>
                      <span className="font-medium text-slate-700 block break-words whitespace-pre-wrap">
                        {item.detail}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ActualTargetCard
          iconColorClass="text-rose-600"
          badgeColorClass="bg-rose-50 text-rose-800 border border-rose-200"
          gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
          items={[
            { label: "ลูกค้า:", value: target.customer || "-" },
            { label: "ประเภทปัญหา:", value: target.issueType || "-" },
            { label: "รายละเอียดปัญหา:", value: target.detail || "-" },
          ]}
        />
      )}

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-3.5 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span>ผลการตรวจสอบและแก้ไขปัญหาจริง</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* ชื่อสินค้า */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-rose-600" />
              ชื่อสินค้า
            </span>
            <p className="text-xs sm:text-sm text-slate-800 font-bold truncate">
              {resolvedProductName || "-"}
            </p>
          </div>

          {/* เลข Lot */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <Barcode className="w-3.5 h-3.5 text-rose-600" />
              เลข Lot
            </span>
            <p className="text-xs sm:text-sm text-slate-800 font-bold truncate">
              {resolvedLotNumber || "-"}
            </p>
          </div>

          {/* ช่องทางการซื้อ */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              {resolvedPurchaseChannel === "ออนไลน์" ? (
                <Globe className="w-3.5 h-3.5 text-rose-600" />
              ) : (
                <Store className="w-3.5 h-3.5 text-rose-600" />
              )}
              ช่องทางการซื้อ
            </span>
            <p className="text-xs sm:text-sm text-slate-800 font-bold truncate">
              {resolvedPurchaseChannel || "-"}
            </p>
          </div>

          {/* ร้านค้าตัวแทนจำหน่าย (ถ้ามี) */}
          {resolvedPurchaseChannel === "ร้านค้าตัวแทนจำหน่าย" && (
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1 sm:col-span-2 md:col-span-2">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-rose-600" />
                ร้านค้าตัวแทนจำหน่าย
              </span>
              <p className="text-xs sm:text-sm text-slate-800 font-bold truncate">
                {resolvedStoreName || "-"}
              </p>
            </div>
          )}

          {/* ประเภทปัญหา */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1 sm:col-span-2 md:col-span-2">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              ประเภทปัญหา
            </span>
            <p className="text-xs sm:text-sm text-slate-800 font-bold">
              {resolvedIssueType || "-"}
            </p>
          </div>

          {/* สถานะการดำเนินการ ( Display Label ปรับใหม่ ) */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              สถานะการดำเนินการ
            </span>
            {resolvedStatus ? (
              <Badge
                variant="outline"
                className={
                  resolvedStatus === "เสร็จสิ้น"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs px-3 py-1 mt-1"
                    : "bg-amber-50 text-amber-800 border-amber-300 font-bold text-xs px-3 py-1 mt-1"
                }
              >
                {resolvedStatus === "เสร็จสิ้น" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                ) : (
                  <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                )}
                {resolvedStatus === "เสร็จสิ้น"
                  ? "แก้ไขปัญหาเสร็จสิ้น"
                  : "รอติดตามผล"}
              </Badge>
            ) : (
              <span className="text-xs text-slate-700 font-semibold">-</span>
            )}
          </div>

          {/* รายละเอียด (ถ้ามี) */}
          {resolvedDetail && (
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-3">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                รายละเอียดปัญหาเพิ่มเติม
              </span>
              <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                {resolvedDetail}
              </p>
            </div>
          )}

          {/* Legacy Initial Solution (ถ้ามีจาก record เก่า) */}
          {initialSolution && (
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-3">
              <span className="text-xs text-slate-500 font-medium block">
                แนวทางแก้ไขปัญหาเบื้องต้น
              </span>
              <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                {initialSolution}
              </p>
            </div>
          )}
        </div>

        {/* ISSUE IMAGES (READ-ONLY LIGHTBOX - สูงสุด 5 รูป) */}
        <div className="bg-rose-50/20 border border-rose-200/70 rounded-2xl p-4 sm:p-4.5 space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-rose-100/80 pb-2">
            <span className="text-xs sm:text-sm font-bold text-rose-950 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-rose-600" />
              ภาพถ่ายปัญหา / การแก้ไข
            </span>
            {resolvedImages && resolvedImages.length > 0 ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                {resolvedImages.length} รูป
              </span>
            ) : null}
          </div>

          {resolvedImages && resolvedImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {resolvedImages.slice(0, 5).map((img, imgIdx) => (
                <button
                  key={img.id || imgIdx}
                  type="button"
                  onClick={() =>
                    openLightbox(
                      `ภาพถ่ายปัญหา / การแก้ไข - ${resolvedProductName || target.customer || "สินค้า"}`,
                      resolvedImages.slice(0, 5),
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
