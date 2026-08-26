"use client";

import React from "react";
import { Users, ShoppingBag, ImageIcon } from "lucide-react";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";
import { ImageFile } from "@/modules/activity-plans/features/actual-view/types";

export interface ProductSaleDetail {
  productName: string;
  actualQty: string;
  actualSales: string;
}

interface DetailType8MeetingProps {
  isVisible: boolean;
  target: {
    topic: string;
    products: string;
    targetAttendees: string;
    items?: { productName: string; targetQty?: string }[];
  };
  actualAttendees?: string;
  feedbackQnA?: string;
  productSalesDetails?: ProductSaleDetail[];
  images?: ImageFile[];
}

export function DetailType8Meeting({
  isVisible,
  target,
  actualAttendees,
  feedbackQnA,
  productSalesDetails = [],
  images = [],
}: DetailType8MeetingProps) {
  if (!isVisible) return null;

  const totalSales = productSalesDetails.reduce(
    (sum, item) => sum + (Number(item.actualSales?.replace(/,/g, "")) || 0),
    0,
  );

  return (
    <div className="border border-purple-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-purple-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <Users className="w-4 h-4" />
          </div>
          <h2 className="font-bold text-purple-900 text-base md:text-lg">
            จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์
          </h2>
        </div>
      </div>

      {/* PLANNED TARGET CARD */}
      <ActualTargetCard
        iconColorClass="text-purple-600"
        badgeColorClass="bg-purple-50 text-purple-800 border border-purple-200"
        gridColsClass="grid-cols-1 sm:grid-cols-3"
        items={[
          { label: "หัวข้อการประชุม:", value: target.topic || "-" },
          { label: "สินค้าแนะนำ:", value: target.products || "-" },
          {
            label: "เป้าหมายผู้เข้าร่วม:",
            value: target.targetAttendees ? `${target.targetAttendees} คน` : "-",
            highlight: true,
          },
        ]}
      />

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          <span>ผลการจัดประชุมจริง</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              จำนวนผู้เข้าร่วมจริง
            </span>
            <span className="text-sm sm:text-base font-extrabold text-purple-900 block">
              {actualAttendees ? `${actualAttendees} คน` : "-"}
            </span>
          </div>

          <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-purple-600 font-medium block">
              ยอดขายรวมในงาน
            </span>
            <span className="text-sm sm:text-base font-extrabold text-purple-900 block">
              {totalSales > 0 ? `฿${totalSales.toLocaleString()} บาท` : "-"}
            </span>
          </div>

          {/* PRODUCT SALES BREAKDOWN TABLE (IF ANY) */}
          {productSalesDetails.length > 0 && (
            <div className="sm:col-span-2 space-y-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
                รายละเอียดการขายสินค้าในงาน
              </span>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">ลำดับ</th>
                      <th className="py-2.5 px-3">ชื่อสินค้า</th>
                      <th className="py-2.5 px-3 text-center w-28">จำนวนที่ขายได้</th>
                      <th className="py-2.5 px-3 text-right w-36">ยอดขาย (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productSalesDetails.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40">
                        <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {item.productName}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-700 font-medium">
                          {item.actualQty || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-purple-900">
                          {item.actualSales
                            ? `฿${Number(item.actualSales.replace(/,/g, "")).toLocaleString()}`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {feedbackQnA && (
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2">
              <span className="text-xs text-slate-500 font-medium block">
                ข้อเสนอแนะ / ประเด็นคำถาม-คำตอบ (Q&A)
              </span>
              <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                {feedbackQnA}
              </p>
            </div>
          )}
        </div>

        {/* MEETING IMAGES (READ-ONLY) */}
        {images.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
              ภาพถ่ายบรรยากาศการประชุม
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 aspect-video flex items-center justify-center shadow-2xs"
                >
                  <img
                    src={img.url}
                    alt={img.name || "Meeting Image"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
