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
import type { ImageFile } from "@/modules/activity/domain/summary/types";
import {
  ImageLightboxModal,
  type LightboxImage,
} from "@/components/custom/image-lightbox-modal";
import { Type6PlanCard } from "./type6-plan-card";
import type {
  ApprovalType6IssueProps,
  Type6ApprovalCardProps,
} from "../types/actual.types";

export type { ApprovalType6IssueProps, Type6ApprovalCardProps };

export function Type6ApprovalCard({
  isVisible,
  target,
  targets,
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
  const resolvedTarget = React.useMemo(() => {
    if (target && target.items && target.items.length > 0) return target;
    if (targets && targets.length > 0) {
      const allItems = targets.flatMap((t) =>
        t.items && t.items.length > 0
          ? t.items
          : [
              {
                customer: t.customer || t.customerName || "ลูกค้าทั่วไป",
                issueType: t.issueType || "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
                detail: t.detail || "",
              },
            ],
      );
      return {
        ...targets[0],
        customer: targets.map((t) => t.customer || t.customerName).filter(Boolean).join(", "),
        customerName: targets.map((t) => t.customer || t.customerName).filter(Boolean).join(", "),
        detail: targets.map((t) => t.detail).filter(Boolean).join(" | "),
        items: allItems,
      };
    }
    return target;
  }, [target, targets]);

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
    issueRecord?.issueType || issueType || resolvedTarget?.issueType || "";
  const resolvedDetail =
    issueRecord?.detail || detail || problemDetail || resolvedTarget?.detail || "";
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
    imgs: Array<{ id: string; url: string; name?: string }> = [],
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
      <Type6PlanCard target={resolvedTarget} />

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

            {/* สถานะการดำเนินการ */}
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

            {/* รายละเอียด (ถ้ามี) */}
            {resolvedDetail && (
              <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 space-y-1 sm:col-span-2 md:col-span-3">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-600" />
                  รายละเอียดปัญหาเพิ่มเติม
                </span>
                <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                  {resolvedDetail}
                </p>
              </div>
            )}

            {/* Legacy Initial Solution (ถ้ามีจาก record เก่า) */}
            {initialSolution && (
              <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 space-y-1 sm:col-span-2 md:col-span-3">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-600" />
                  แนวทางแก้ไขเบื้องต้น
                </span>
                <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                  {initialSolution}
                </p>
              </div>
            )}
          </div>

          {/* รูปภาพผลการตรวจสอบ (ถ้ามี) */}
          {resolvedImages && resolvedImages.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-red-100">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-red-600" />
                รูปภาพผลการตรวจสอบ ({resolvedImages.length} รูป)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {resolvedImages.map((img: any, idx: number) => (
                  <div
                    key={img.id || idx}
                    className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-md transition-all"
                    onClick={() =>
                      openLightbox(
                        `รูปภาพผลการตรวจสอบ (${idx + 1}/${resolvedImages.length})`,
                        resolvedImages as any,
                        idx,
                      )
                    }
                  >
                    <img
                      src={img.url}
                      alt={img.name || `issue-image-${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="p-1.5 rounded-full bg-white/90 text-slate-800 shadow-sm">
                        <Eye className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
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

// Backward-compatible alias
export const ApprovalType6Issue = Type6ApprovalCard;
