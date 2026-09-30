"use client";

import React, { useState } from "react";
import {
  Flag,
  Users,
  ShoppingBag,
  ImageIcon,
  MessageSquare,
  Camera,
  Eye,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ActualTargetCard } from "@/modules/activity-plans/features/shared/actual-view/components/actual-target-card";
import { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";
import {
  ImageLightboxModal,
  LightboxImage,
} from "@/components/custom/image-lightbox-modal";

export interface Type10SoldProductDetail {
  id?: string;
  productId?: string;
  productName: string;
  productCode?: string;
  quantity?: string | number;
  actualQty?: string | number;
  actualSales?: string | number;
  unitPrice?: number;
  remarks?: string;
  isCustom?: boolean;
  isCustomProduct?: boolean;
}

export interface DetailType10FieldDayProps {
  isVisible: boolean;
  target: {
    plot: string;
    location: string;
    showcase: string;
    targetAttendees: string;
    targetSales: string;
  };
  actualAttendees?: string;
  actualSalesOrBooking?: string;
  targetFarmersList?: string;
  farmerFeedback?: "สูง" | "กลาง" | "ต่ำ" | "";
  images?: ImageFile[];
  productSalesDetails?: Type10SoldProductDetail[];
  soldProducts?: Type10SoldProductDetail[];
}

export function DetailType10FieldDay({
  isVisible,
  target,
  actualAttendees,
  actualSalesOrBooking,
  targetFarmersList,
  farmerFeedback,
  images = [],
  productSalesDetails = [],
  soldProducts,
}: DetailType10FieldDayProps) {
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

  // Resolve sold products array from either prop
  const effectiveSoldProducts = soldProducts || productSalesDetails || [];

  // Filter valid products (has productName or actualSales or quantity)
  const validSoldProducts = effectiveSoldProducts.filter(
    (p) =>
      (p.productName && p.productName.trim() !== "") ||
      (p.actualSales && String(p.actualSales).trim() !== "" && String(p.actualSales).trim() !== "0") ||
      (p.quantity && String(p.quantity).trim() !== "" && String(p.quantity).trim() !== "0") ||
      (p.actualQty && String(p.actualQty).trim() !== "" && String(p.actualQty).trim() !== "0"),
  );

  const hasSoldProducts = validSoldProducts.length > 0;

  // Calculate sum of sold items
  const totalSoldAmount = validSoldProducts.reduce((sum, item) => {
    const raw = String(item.actualSales ?? "").replace(/,/g, "").trim();
    const val = parseFloat(raw);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Total sales for display (use items sum or fallback to overall actualSalesOrBooking)
  const displayTotalSales =
    totalSoldAmount > 0
      ? totalSoldAmount
      : actualSalesOrBooking
        ? parseFloat(actualSalesOrBooking.replace(/,/g, "")) || 0
        : 0;

  return (
    <div className="border border-orange-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-orange-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
            <Flag className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-orange-900 text-base md:text-lg">
            จัดงาน Field Day
          </h2>
        </div>
      </div>

      {/* PLANNED TARGET CARD */}
      <ActualTargetCard
        iconColorClass="text-orange-600"
        badgeColorClass="bg-orange-50 text-orange-800 border border-orange-200"
        gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
        items={[
          { label: "แปลงสาธิต:", value: target.plot || "-" },
          { label: "สถานที่จัดงาน:", value: target.location || "-" },
          { label: "จุดเด่นแปลง:", value: target.showcase || "-" },
          {
            label: "เป้าหมายผู้เข้าร่วม:",
            value: target.targetAttendees ? `${target.targetAttendees} คน` : "-",
            highlight: true,
          },
          {
            label: "เป้ายอดขาย/จอง:",
            value: target.targetSales ? `฿${target.targetSales}` : "-",
            highlight: true,
          },
        ]}
      />

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-4 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          <span>ผลการจัดงาน Field Day จริง</span>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400" />
              จำนวนผู้เข้าร่วมจริง
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-800 block">
              {actualAttendees ? `${actualAttendees} คน` : "-"}
            </span>
          </div>

          <div className="bg-orange-50/60 border border-orange-200 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-orange-700 font-medium block flex items-center gap-1">
              <ShoppingBag className="w-3 h-3 text-orange-600" />
              ยอดขาย / ยอดจองในงานจริง
            </span>
            <span className="text-sm sm:text-base font-extrabold text-orange-950 block">
              {displayTotalSales > 0
                ? `฿${displayTotalSales.toLocaleString()} บาท`
                : actualSalesOrBooking && Number(actualSalesOrBooking.replace(/,/g, "")) > 0
                  ? `฿${Number(actualSalesOrBooking.replace(/,/g, "")).toLocaleString()} บาท`
                  : "-"}
            </span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-slate-400" />
              ผลตอบรับของเกษตรกร
            </span>
            {farmerFeedback ? (
              <Badge
                variant="outline"
                className={
                  farmerFeedback === "สูง"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs"
                    : farmerFeedback === "กลาง"
                      ? "bg-amber-50 text-amber-800 border-amber-300 font-bold text-xs"
                      : "bg-rose-50 text-rose-800 border-rose-300 font-bold text-xs"
                }
              >
                {farmerFeedback}
              </Badge>
            ) : (
              <span className="text-xs text-slate-700 font-semibold">-</span>
            )}
          </div>

          {targetFarmersList && (
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-3">
              <span className="text-xs text-slate-500 font-medium block">
                รายชื่อกลุ่มเกษตรกรเป้าหมายที่เข้าร่วม
              </span>
              <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                {targetFarmersList}
              </p>
            </div>
          )}
        </div>

        {/* SOLD PRODUCTS SECTION (SECTION: สินค้าที่ขายได้ในกิจกรรม) */}
        <div className="bg-orange-50/20 border border-orange-200/70 rounded-2xl p-4 sm:p-4.5 space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-100/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-orange-950 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-orange-600 shrink-0" />
                สินค้าที่ขายได้ในกิจกรรม
              </span>
              {hasSoldProducts && (
                <Badge
                  variant="outline"
                  className="bg-orange-100/80 text-orange-800 border-orange-300 text-[11px] font-bold"
                >
                  {validSoldProducts.length} รายการ
                </Badge>
              )}
            </div>
            {hasSoldProducts && displayTotalSales > 0 && (
              <div className="text-right">
                <span className="text-xs text-orange-800/80 font-medium mr-1.5 hidden sm:inline">
                  ยอดขายจริงรวม:
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-orange-950">
                  ฿{displayTotalSales.toLocaleString()} บาท
                </span>
              </div>
            )}
          </div>

          {hasSoldProducts ? (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-xl border border-orange-200/60 bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-orange-50/60 text-orange-950 font-bold border-b border-orange-100">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                      <th className="py-2.5 px-3">ชื่อสินค้า</th>
                      <th className="py-2.5 px-3 text-center w-28">
                        จำนวนที่ขายได้
                      </th>
                      <th className="py-2.5 px-3 text-right w-36">
                        ยอดขายจริง (บาท)
                      </th>
                      <th className="py-2.5 px-3 min-w-[150px]">
                        รายละเอียด / หมายเหตุ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100/60 bg-white">
                    {validSoldProducts.map((item, idx) => {
                      const qty = item.quantity ?? item.actualQty ?? "";
                      const rawSales = String(item.actualSales ?? "").replace(/,/g, "").trim();
                      const salesNum = parseFloat(rawSales);
                      const remarks = item.remarks || (item as any).unclosedReason || (item as any).notes;

                      return (
                        <tr key={item.id || idx} className="hover:bg-orange-50/30 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Package className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                              <span>{item.productName || "ไม่ระบุชื่อสินค้า"}</span>
                              {(item.isCustom || item.isCustomProduct) && (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] px-1.5 py-0 font-medium"
                                >
                                  กรอกชื่อเอง
                                </Badge>
                              )}
                            </div>
                            {item.productCode && (
                              <span className="text-[10px] text-slate-500 font-normal block pl-5 mt-0.5">
                                รหัส: {item.productCode}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-orange-950">
                            {qty ? `${qty} หน่วย` : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-orange-950">
                            {!isNaN(salesNum) && salesNum > 0
                              ? `฿${salesNum.toLocaleString()} บาท`
                              : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">
                            {remarks ? (
                              <span className="whitespace-pre-wrap leading-relaxed">
                                {remarks}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {displayTotalSales > 0 && (
                    <tfoot className="bg-orange-100/40 border-t border-orange-200 text-xs">
                      <tr>
                        <td
                          colSpan={3}
                          className="py-2.5 px-3 text-right font-bold text-orange-900"
                        >
                          ยอดขายจริงรวมทั้งหมด ({validSoldProducts.length} รายการ):
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-orange-950 text-sm">
                          ฿{displayTotalSales.toLocaleString()} บาท
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-400 text-xs font-medium">
              <Package className="w-4 h-4 opacity-50 text-slate-400 shrink-0" />
              <span>ไม่มีรายการสินค้าที่ขายได้ในกิจกรรมนี้</span>
            </div>
          )}
        </div>

        {/* FIELD DAY IMAGES (READ-ONLY LIGHTBOX) */}
        <div className="bg-orange-50/20 border border-orange-200/70 rounded-2xl p-4 sm:p-4.5 space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-orange-100/80 pb-2">
            <span className="text-xs sm:text-sm font-bold text-orange-950 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-orange-600" />
              ภาพถ่ายบรรยากาศงาน Field Day
            </span>
            {images && images.length > 0 ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
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
                      `ภาพถ่ายบรรยากาศงาน Field Day - ${target.plot || "แปลงสาธิต"}`,
                      images,
                      imgIdx,
                    )
                  }
                  className="group relative rounded-xl border border-orange-200/80 overflow-hidden bg-slate-100 aspect-video flex items-center justify-center shadow-2xs hover:shadow-md hover:border-orange-400 transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  aria-label={`คลิกเพื่อดูภาพถ่ายงาน Field Day ที่ ${imgIdx + 1} ขนาดใหญ่`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.name || `ภาพถ่ายงาน Field Day ${imgIdx + 1}`}
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
              <span>ไม่มีภาพถ่ายบรรยากาศงาน Field Day</span>
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
