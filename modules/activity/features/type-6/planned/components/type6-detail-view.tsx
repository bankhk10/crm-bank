"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Camera,
  Eye,
  Store,
  Globe,
  Package,
  Barcode,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ImageFile } from "@/modules/activity/domain/summary/types";
import {
  ImageLightboxModal,
  type LightboxImage,
} from "@/components/custom/image-lightbox-modal";
import { Type6PlanCard } from "./type6-plan-card";
import type { DetailType6IssueProps, Type6DetailViewProps } from "../types/actual.types";

export type { DetailType6IssueProps, Type6DetailViewProps };

export function Type6DetailView({
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
}: DetailType6IssueProps) {
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

  // Resolve values prioritizing issueRecord then individual props then target/fallback
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
      <Type6PlanCard target={resolvedTarget} />

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

          {/* สถานะการดำเนินการ */}
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
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-rose-600" />
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
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-rose-600" />
              รูปภาพประกอบการตรวจสอบเรื่องร้องเรียน ({resolvedImages.length} รูป)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {resolvedImages.map((img: any, idx: number) => (
                <div
                  key={img.id || idx}
                  className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-md transition-all"
                  onClick={() =>
                    openLightbox(
                      `รูปภาพประกอบการตรวจสอบเรื่องร้องเรียน (${idx + 1}/${resolvedImages.length})`,
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
                    <span className="p-2 rounded-full bg-white/90 text-slate-800 shadow-sm">
                      <Eye className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
export const DetailType6Issue = Type6DetailView;
