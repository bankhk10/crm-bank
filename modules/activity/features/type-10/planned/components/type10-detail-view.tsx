"use client";

import React, { useState, useMemo } from "react";
import { Sprout, ShoppingBag, Users, ThumbsUp, DollarSign, ImageIcon, Eye, Camera, Package } from "lucide-react";
import {
  ImageLightboxModal,
  LightboxImage,
} from "@/components/custom/image-lightbox-modal";
import { cn } from "@/lib/utils";
import type { Type10ImageFile, Type10SoldProductItem } from "../../shared/types";
import type {
  DetailType10FieldDayProps,
  Type10DetailViewProps,
} from "../types/actual.types";
import { Type10PlanCard } from "./type10-plan-card";

export type {
  DetailType10FieldDayProps,
  Type10DetailViewProps,
};

export function Type10DetailView({
  isVisible = true,
  target,
  targets,
  actualAttendees,
  actualSalesOrBooking,
  farmerFeedback,
  images = [],
  productSalesDetails,
  soldProducts,
}: Type10DetailViewProps) {
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
    imgs: Type10ImageFile[] = [],
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

    // ปรับการดึงและจัดรูปแบบข้อมูลให้รองรับทั้ง View Model และ Raw Prisma Model (activity_type_10_products)
  const effectiveSoldProducts = useMemo(() => {
    const rawList =
      (soldProducts && soldProducts.length > 0
        ? soldProducts
        : productSalesDetails) || [];

    return rawList
      .filter((prod: any) => {
        if (!prod) return false;
        // กรองสินค้าจัดแสดง (SHOWCASE) ที่ไม่ได้มียอดสั่งจองหรือยอดขายจริงออก
        if (
          prod.productRole === "SHOWCASE" &&
          prod.actualQty == null &&
          prod.actualQuantity == null &&
          prod.actualSales == null &&
          prod.actualTotal == null
        ) {
          return false;
        }
        return true;
      })
      .map((prod: any) => {
        const productName =
          prod.productName || prod.product?.name || "สินค้าไม่ระบุชื่อ";

        const rawQty =
          prod.actualQty != null && prod.actualQty !== ""
            ? prod.actualQty
            : prod.actualQuantity != null && prod.actualQuantity !== ""
              ? prod.actualQuantity
              : prod.quantity != null && prod.quantity !== ""
                ? prod.quantity
                : prod.targetQuantity != null && prod.targetQuantity !== ""
                  ? prod.targetQuantity
                  : null;

        const rawUnitPrice =
          prod.unitPrice != null && prod.unitPrice !== ""
            ? prod.unitPrice
            : prod.actualUnitPrice != null && prod.actualUnitPrice !== ""
              ? prod.actualUnitPrice
              : prod.targetUnitPrice != null && prod.targetUnitPrice !== ""
                ? prod.targetUnitPrice
                : null;

        const rawSales =
          prod.actualSales != null && prod.actualSales !== ""
            ? prod.actualSales
            : prod.actualTotal != null && prod.actualTotal !== ""
              ? prod.actualTotal
              : prod.amount != null && prod.amount !== ""
                ? prod.amount
                : prod.targetAmount != null && prod.targetAmount !== ""
                  ? prod.targetAmount
                  : null;

        return {
          id: prod.id,
          productName,
          displayQty:
            rawQty != null && rawQty !== ""
              ? !isNaN(Number(rawQty))
                ? Number(rawQty).toLocaleString()
                : String(rawQty)
              : "-",
          displayUnitPrice:
            rawUnitPrice != null && rawUnitPrice !== "" && !isNaN(Number(rawUnitPrice))
              ? `฿${Number(rawUnitPrice).toLocaleString()}`
              : "-",
          displaySales:
            rawSales != null && rawSales !== "" && !isNaN(Number(rawSales))
              ? `฿${Number(rawSales).toLocaleString()}`
              : "-",
        };
      });
  }, [soldProducts, productSalesDetails]);

  return (
    <div className="space-y-4">
      {/* Planned Targets */}
      {targets && targets.length > 0 ? (
        targets.map((t, idx) => <Type10PlanCard key={t.id || idx} target={t} />)
      ) : (
        <Type10PlanCard target={target} />
      )}

      {/* Actual Outcome Detail Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
              ผลการจัดงาน Field Day จริง (Actual Outcome)
            </h4>
            <p className="text-[11px] text-slate-500">
              รายละเอียดผู้เข้าร่วม ยอดสั่งจอง/จำหน่าย และภาพถ่ายกิจกรรม
            </p>
          </div>
        </div>

        {/* Outcome Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">ผู้เข้าร่วมงานจริง</p>
              <p className="text-sm font-bold text-slate-900">
                {actualAttendees != null && actualAttendees !== "" ? `${Number(actualAttendees).toLocaleString()} คน` : "-"}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">ยอดสั่งจอง / สั่งซื้อจริง</p>
              <p className="text-sm font-bold text-emerald-700">
                {actualSalesOrBooking != null && actualSalesOrBooking !== "" ? `฿${Number(actualSalesOrBooking).toLocaleString()}` : "-"}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ThumbsUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">ผลตอบรับจากเกษตรกร</p>
              <p className="text-sm font-bold text-slate-900">
                {farmerFeedback || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Sold Products Table */}
        {effectiveSoldProducts.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-600" />
              <span>รายการสินค้าที่สั่งจอง / จำหน่ายในงาน</span>
            </h5>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 text-center w-10">ลำดับ</th>
                    <th className="py-2 px-3">สินค้า</th>
                    <th className="py-2 px-3 text-center w-24">จำนวน</th>
                    <th className="py-2 px-3 text-center w-28">ราคาต่อหน่วย</th>
                    <th className="py-2 px-3 text-right w-32">รวม (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {effectiveSoldProducts.map((prod, idx) => (
                    <tr key={prod.id || idx}>
                      <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{prod.productName}</td>
                      <td className="py-2 px-3 text-center">{prod.displayQty}</td>
                      <td className="py-2 px-3 text-center">{prod.displayUnitPrice}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">
                        {prod.displaySales}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Photos Gallery */}
        {images && images.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>ภาพถ่ายบรรยากาศการจัดงาน ({images.length} รูป)</span>
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {images.map((img, idx) => (
                <div
                  key={img.id || idx}
                  onClick={() => openLightbox("ภาพถ่ายบรรยากาศ Field Day", images, idx)}
                  className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-xs transition-all"
                >
                  <img
                    src={img.url}
                    alt={img.name || "ภาพ Field Day"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
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

export const DetailType10FieldDay = Type10DetailView;
