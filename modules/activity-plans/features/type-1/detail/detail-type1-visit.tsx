"use client";

import React, { useState } from "react";
import {
  UserCheck,
  Store,
  Calendar,
  ArrowRight,
  Tag,
  MapPin,
  Camera,
  Navigation,
  ExternalLink,
  Eye,
  ImageIcon,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ActualTargetsState, ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";
import {
  ImageLightboxModal,
  LightboxImage,
} from "@/components/custom/image-lightbox-modal";

interface DetailType1VisitProps {
  isVisible: boolean;
  target: ActualTargetsState["t1"];
  productAdvice?: string;
  discussionResult?: string;
  salesOpportunity?: "สูง" | "ต่ำ" | "";
  nextAction?: string;
  nextMeetingDate?: string;
  farmerHomeAddress?: string;
  plotLatitude?: string | number | null;
  plotLongitude?: string | number | null;
  plotImages?: ImageFile[];
}

export function DetailType1Visit({
  isVisible,
  target,
  productAdvice,
  discussionResult,
  salesOpportunity,
  nextAction,
  nextMeetingDate,
  farmerHomeAddress,
  plotLatitude,
  plotLongitude,
  plotImages = [],
}: DetailType1VisitProps) {
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
        url: img.url,
        caption: img.name,
      })),
      initialIndex,
    });
  };

  const closeLightbox = () => {
    setLightboxState((prev) => ({ ...prev, isOpen: false }));
  };

  const isAdviceTopic =
    target?.topic?.trim() === "ให้คำแนะนำการใช้สินค้า" ||
    !!productAdvice ||
    !!salesOpportunity;

  const selectedProducts = productAdvice
    ? productAdvice
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const formatThaiDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return dateStr.replace(/\b(19\d\d|20\d\d)\b/g, (match) =>
      String(parseInt(match, 10) + 543),
    );
  };

  const isStore = target?.visitPurpose === "STORE";
  const isUnregistered = Boolean(target?.isUnregisteredFarmer);
  const farmerDisplayName = isUnregistered
    ? target?.unregisteredFarmerName || target?.customer || "-"
    : target?.customer || "-";

  const hasCoords =
    plotLatitude != null &&
    plotLongitude != null &&
    String(plotLatitude).trim() !== "" &&
    String(plotLongitude).trim() !== "";

  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${plotLatitude},${plotLongitude}`
    : null;

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-emerald-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            {isStore ? <Store className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="font-bold text-emerald-900 text-base md:text-lg">
              เข้าพบร้านค้า / Key Farmer
            </h2>
            <p className="text-xs text-slate-500">
              รายละเอียดแผนงานและผลการปฏิบัติงานจริง
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-xs font-bold bg-emerald-50 text-emerald-800 border-emerald-200"
        >
          TYPE_1
        </Badge>
      </div>

      {/* 1. PLANNED TARGET CARD */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            ข้อมูลตามแผนงาน (PLAN)
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
            {isStore ? "1 Plan : 1 Store" : "1 Plan : 1 Farmer"}
          </span>
        </div>

        {isStore ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* วัตถุประสงค์ของประเภทงาน */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block">วัตถุประสงค์ของประเภทงาน</span>
                <span className="font-bold text-slate-800 text-sm block">
                  เข้าพบร้านค้า
                </span>
              </div>

              {/* ร้านค้า */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block">ร้านค้า (Customer Master)</span>
                <span className="font-bold text-slate-800 text-sm block truncate" title={target?.customer || "-"}>
                  {target?.customer || "-"}
                </span>
              </div>

              {/* ประเภทลูกค้า */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block">ประเภทลูกค้า</span>
                <div>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs"
                  >
                    {target?.customerType === "DEALER"
                      ? "ตัวแทนจำหน่าย"
                      : target?.customerType === "SUBDEALER"
                        ? "ร้านค้าย่อย"
                        : (target?.customerType || "ร้านค้า")}
                  </Badge>
                </div>
              </div>

              {/* ประเด็นหลัก */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block">ประเด็นหลัก</span>
                <span className="font-bold text-slate-800 text-sm block">
                  {target?.topic || "-"}
                </span>
              </div>
            </div>

            {/* รายละเอียดเพิ่มเติม */}
            <div className="text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block">รายละเอียดเพิ่มเติม</span>
                <p className="font-normal text-slate-700 whitespace-pre-wrap">
                  {target?.detail || "-"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              {/* วัตถุประสงค์ของประเภทงาน */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block">วัตถุประสงค์ของประเภทงาน</span>
                <span className="font-bold text-slate-800 text-sm block">
                  เข้าพบเกษตรกร
                </span>
              </div>

              {/* จังหวัด */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block">จังหวัด</span>
                <span className="font-bold text-slate-800 text-sm block">
                  {target?.province || "-"}
                </span>
              </div>

              {/* สถานะเกษตรกร */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block">สถานะเกษตรกร</span>
                <div>
                  {isUnregistered ? (
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-800 border-amber-300 font-bold text-xs"
                    >
                      เกษตรกรนอกระบบ
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs flex items-center gap-1 w-fit"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      เกษตรกรในระบบ
                    </Badge>
                  )}
                </div>
              </div>

              {/* เกษตรกร / ชื่อ */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                <span className="text-slate-400 font-medium block">
                  {isUnregistered ? "ชื่อ - สกุล เกษตรกร" : "เกษตรกร (Customer Master)"}
                </span>
                <span className="font-bold text-slate-800 text-sm block truncate" title={farmerDisplayName}>
                  {farmerDisplayName}
                </span>
              </div>

              {/* เบอร์โทรศัพท์ หรือ วัตถุประสงค์ */}
              {isUnregistered ? (
                <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                  <span className="text-slate-400 font-medium block flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    เบอร์โทรศัพท์
                  </span>
                  <span className="font-bold text-slate-800 text-sm block">
                    {target?.unregisteredFarmerPhone || "-"}
                  </span>
                </div>
              ) : (
                <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                  <span className="text-slate-400 font-medium block">ประเด็นหลัก</span>
                  <span className="font-bold text-slate-800 text-sm block">
                    {target?.topic || "-"}
                  </span>
                </div>
              )}
            </div>

            {/* Topic & Detail Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              {isUnregistered && (
                <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1">
                  <span className="text-slate-400 font-medium block">ประเด็นหลัก</span>
                  <span className="font-semibold text-slate-800 block">
                    {target?.topic || "-"}
                  </span>
                </div>
              )}
              <div className={cn("bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs space-y-1", !isUnregistered && "sm:col-span-2")}>
                <span className="text-slate-400 font-medium block">รายละเอียดเพิ่มเติม</span>
                <p className="font-normal text-slate-700 whitespace-pre-wrap">
                  {target?.detail || "-"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. READ-ONLY ACTUAL RESULT DISPLAY */}
      <div className="space-y-4 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mt-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>ผลการปฏิบัติงานจริง (ACTUAL)</span>
        </div>

        {/* Farmer-Specific Actual Displays (Hidden for STORE) */}
        {!isStore && (
          <>
            {/* ที่อยู่บ้านเกษตรกร & พิกัดแปลง */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* ที่อยู่บ้านเกษตรกร */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  ที่อยู่บ้านเกษตรกร
                </span>
                <p className="text-xs sm:text-sm text-slate-800 font-semibold whitespace-pre-wrap">
                  {farmerHomeAddress || "-"}
                </p>
              </div>

              {/* พิกัดแปลง (Plot Location) */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                    พิกัดแปลง (Latitude, Longitude)
                  </span>
                  {googleMapsUrl && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      เปิดใน Google Maps
                    </a>
                  )}
                </div>
                {hasCoords ? (
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold text-slate-800">
                    <span>Lat: {String(plotLatitude)}</span>
                    <span className="text-slate-300">|</span>
                    <span>Lng: {String(plotLongitude)}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-700 font-semibold">-</span>
                )}
              </div>
            </div>

            {/* รูปแปลงเกษตรกร (Plot Photos) */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-700 font-bold flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  รูปแปลงเกษตรกร
                </span>
                {plotImages && plotImages.length > 0 ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {plotImages.length} รูป
                  </span>
                ) : null}
              </div>

              {plotImages && plotImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {plotImages.map((img, imgIdx) => (
                    <button
                      key={img.id || imgIdx}
                      type="button"
                      onClick={() =>
                        openLightbox(
                          `รูปแปลงเกษตรกร - ${farmerDisplayName}`,
                          plotImages,
                          imgIdx,
                        )
                      }
                      className="group relative rounded-xl border border-emerald-200/80 overflow-hidden bg-slate-100 aspect-video flex items-center justify-center shadow-2xs hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      aria-label={`คลิกเพื่อดูรูปแปลงที่ ${imgIdx + 1} ขนาดใหญ่`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.name || `รูปแปลง ${imgIdx + 1}`}
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
                <div className="flex items-center gap-2 p-3 rounded-lg bg-white border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
                  <ImageIcon className="w-4 h-4 opacity-50 text-slate-400" />
                  <span>ไม่มีรูปภาพแปลงเกษตรกร</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* สินค้าที่ให้คำแนะนำ & โอกาสการขาย */}
        {isAdviceTopic && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
              <span className="text-xs text-slate-500 font-medium block">
                สินค้าที่ให้คำแนะนำ
              </span>
              {selectedProducts.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {selectedProducts.map((prod, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-emerald-900 border border-emerald-200 shadow-2xs"
                    >
                      <Tag className="w-3 h-3 text-emerald-600" />
                      {prod}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-700 font-semibold">-</span>
              )}
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
              <span className="text-xs text-slate-500 font-medium block">
                ประเมินโอกาสการขาย
              </span>
              {salesOpportunity ? (
                <Badge
                  variant="outline"
                  className={
                    salesOpportunity === "สูง"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs px-3 py-1"
                      : "bg-rose-50 text-rose-800 border-rose-300 font-bold text-xs px-3 py-1"
                  }
                >
                  {salesOpportunity}
                </Badge>
              ) : (
                <span className="text-xs text-slate-700 font-semibold">-</span>
              )}
            </div>
          </div>
        )}

        {/* ผลการพูดคุย */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
          <span className="text-xs text-slate-500 font-medium block">
            ผลการพูดคุย
          </span>
          <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
            {discussionResult || "-"}
          </p>
        </div>

        {/* สิ่งที่ต้องดำเนินการต่อ & วันที่นัดหมายครั้งถัดไป */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-slate-400" />
              สิ่งที่ต้องดำเนินการต่อ
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {nextAction || "-"}
            </span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              วันที่นัดหมายครั้งถัดไป
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {formatThaiDate(nextMeetingDate)}
            </span>
          </div>
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
