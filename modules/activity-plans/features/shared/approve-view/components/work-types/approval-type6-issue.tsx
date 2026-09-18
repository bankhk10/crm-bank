"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Package,
  Barcode,
  Globe,
  Store,
  CheckCircle2,
  Clock,
  FileText,
  Eye,
  Camera,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  ActualTargetsState,
  ImageFile,
  Type6IssueRecord,
} from "@/modules/activity-plans/features/actual-view/types";
import {
  ImageLightboxModal,
  LightboxImage,
} from "@/components/custom/image-lightbox-modal";

interface ApprovalType6IssueProps {
  isVisible: boolean;
  target: ActualTargetsState["t6"];
  issueRecord?: Type6IssueRecord;
  productName?: string;
  lotNumber?: string;
  purchaseChannel?: string;
  storeName?: string;
  issueType?: string;
  detail?: string;
  status?: "เสร็จสิ้น" | "รอติดตาม" | string;
  images?: ImageFile[];
  problemDetail?: string;
  initialSolution?: string;
}

export function ApprovalType6Issue({
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
}: ApprovalType6IssueProps) {
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

  // Resolve values prioritizing issueRecord then individual props
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

  const hasActualResult = Boolean(
    issueRecord ||
    productName ||
    lotNumber ||
    purchaseChannel ||
    storeName ||
    (status && status !== "-") ||
    (resolvedImages && resolvedImages.length > 0) ||
    problemDetail ||
    initialSolution,
  );

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
    <div className="border border-red-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-4 shadow-2xs">
      <div className="flex items-center justify-between border-b border-red-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-red-900 text-sm sm:text-base">
            ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา
          </h4>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-bold bg-red-50 text-red-800 border-red-200"
        >
          TYPE_6
        </Badge>
      </div>

      {/* PLANNED TARGET SECTION */}
      {target.items && target.items.length > 1 ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 block">
              รายการเป้าหมายตามแผน ({target.items.length} รายการ):
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
              จากแผนงาน
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {target.items.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 space-y-1.5"
              >
                <div className="font-bold text-red-900 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-red-100 text-red-800 flex items-center justify-center text-[10px] font-extrabold">
                    {idx + 1}
                  </span>
                  ลูกค้า: {item.customer || "-"}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-red-50/40 p-3 rounded-xl border border-red-100/80 sm:col-span-1">
            <span className="text-red-700 block text-[11px] font-bold mb-1">
              วัตถุประสงค์ของประเภทงาน
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              ตรวจสอบเรื่องร้องเรียนและแก้ปัญหาให้กับลูกค้า
            </span>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              ลูกค้า / ผู้ร้องเรียน
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {target.customer || "-"}
            </span>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              ประเภทเรื่องร้องเรียน
            </span>
            <span className="font-bold text-red-700 block text-xs sm:text-sm">
              {target.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย"}
            </span>
          </div>

          {target.detail && (
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-3">
              <span className="text-slate-500 block text-[11px] font-medium mb-1">
                รายละเอียดปัญหา
              </span>
              <span className="text-slate-700 block text-xs whitespace-pre-line">
                {target.detail}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ACTUAL OUTCOME SECTION (IF ACTUAL RESULT EXISTS) */}
      {hasActualResult && (
        <div className="space-y-3 pt-3 border-t border-red-100/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              <span>ผลการตรวจสอบและแก้ไขปัญหาจริง (Actual Outcome)</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              บันทึกผลแล้ว
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {/* ชื่อสินค้า */}
            <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-red-600" />
                ชื่อสินค้า
              </span>
              <p className="text-xs sm:text-sm text-slate-900 font-bold truncate">
                {resolvedProductName || "-"}
              </p>
            </div>

            {/* เลข Lot */}
            <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5 text-red-600" />
                เลข Lot
              </span>
              <p className="text-xs sm:text-sm text-slate-900 font-bold truncate">
                {resolvedLotNumber || "-"}
              </p>
            </div>

            {/* ช่องทางการซื้อ */}
            <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                {resolvedPurchaseChannel === "ออนไลน์" ? (
                  <Globe className="w-3.5 h-3.5 text-red-600" />
                ) : (
                  <Store className="w-3.5 h-3.5 text-red-600" />
                )}
                ช่องทางการซื้อ
              </span>
              <p className="text-xs sm:text-sm text-slate-900 font-bold truncate">
                {resolvedPurchaseChannel || "-"}
              </p>
            </div>

            {/* ร้านค้าตัวแทนจำหน่าย (ถ้าเลือกช่องทางนี้) */}
            {resolvedPurchaseChannel === "ร้านค้าตัวแทนจำหน่าย" && (
              <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 space-y-1 sm:col-span-2 md:col-span-2">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-red-600" />
                  ร้านค้าตัวแทนจำหน่าย
                </span>
                <p className="text-xs sm:text-sm text-slate-900 font-bold truncate">
                  {resolvedStoreName || "-"}
                </p>
              </div>
            )}

            {/* ประเภทปัญหา */}
            <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 space-y-1 sm:col-span-2 md:col-span-2">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                ประเภทปัญหา
              </span>
              <p className="text-xs sm:text-sm text-slate-900 font-bold">
                {resolvedIssueType || "-"}
              </p>
            </div>

            {/* สถานะการดำเนินการ (Display Label ใหม่) */}
            <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium block">
                สถานะการดำเนินการ
              </span>
              {resolvedStatus ? (
                <Badge
                  variant="outline"
                  className={
                    resolvedStatus === "เสร็จสิ้น"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs px-2.5 py-0.5 mt-0.5"
                      : "bg-amber-50 text-amber-800 border-amber-300 font-bold text-xs px-2.5 py-0.5 mt-0.5"
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

            {/* รายละเอียดเพิ่มเติม (ถ้ามี) */}
            {resolvedDetail && (
              <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 space-y-1 sm:col-span-2 md:col-span-3">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-600" />
                  รายละเอียดปัญหาเพิ่มเติม
                </span>
                <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                  {resolvedDetail}
                </p>
              </div>
            )}

            {/* Legacy Initial Solution (ถ้ามีจาก record เดิม) */}
            {initialSolution && (
              <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 space-y-1 sm:col-span-2 md:col-span-3">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-600" />
                  แนวทางการแก้ไขเบื้องต้น (ข้อมูลเดิม)
                </span>
                <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                  {initialSolution}
                </p>
              </div>
            )}
          </div>

          {/* รูปภาพการดำเนินการ (สูงสุด 5 รูป พร้อม Lightbox) */}
          <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-red-600" />
                รูปภาพการดำเนินการ ({resolvedImages.length} รูป จากสูงสุด 5 รูป)
              </span>
              {resolvedImages.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    openLightbox(
                      "รูปภาพการตรวจสอบและแก้ไขปัญหา",
                      resolvedImages,
                      0,
                    )
                  }
                  className="text-[11px] text-red-600 hover:text-red-700 font-semibold hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  ดูรูปขนาดใหญ่ทั้งหมด
                </button>
              )}
            </div>

            {resolvedImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {resolvedImages.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    onClick={() =>
                      openLightbox(
                        "รูปภาพการตรวจสอบและแก้ไขปัญหา",
                        resolvedImages,
                        idx,
                      )
                    }
                    className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 hover:border-red-400 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                  >
                    <img
                      src={img.url}
                      alt={img.name || `รูปที่ ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                    </div>
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold backdrop-blur-xs">
                      {idx + 1}/{resolvedImages.length}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 rounded-lg p-3 text-center text-slate-400 text-xs">
                ไม่มีรูปภาพแนบ
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
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
