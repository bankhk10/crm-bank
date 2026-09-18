"use client";

import React, { useState } from "react";
import {
  Sprout,
  Calendar,
  History,
  CheckCircle2,
  AlertTriangle,
  ImageIcon,
  Star,
  TrendingUp,
  Eye,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";
import { ImageFile } from "@/modules/activity-plans/features/actual-view/types";
import { DemoPlotHistoryModal } from "@/modules/activity-plans/features/actual-view/components/work-types/demo-plot-history-modal";
import {
  ImageLightboxModal,
  LightboxImage,
} from "@/components/custom/image-lightbox-modal";

export interface DetailType7FollowUpProps {
  target: {
    activityType?: "CREATE" | "FOLLOW_UP" | string;
    owner: string;
    product: string;
    crop: string;
    plots: string;
    targetCondition?: string;
    demoProductQuantity?: string | number | null;
    objective?: string;
    experimentDetail?: string;
    detail?: string;
    items?: any[];
  };
  plotName?: string;
  usageMethod?: string;
  cropAgeValue?: string;
  cropAgeUnit?: string;
  growthStage?: string;
  cropCondition?: "สมบูรณ์" | "มีปัญหา" | "ปานกลาง" | "ทรุดโทรม" | "";
  cropProblemDescription?: string;
  productResponse?: "พืชตอบสนองดี" | "พบปัญหา" | "";
  problemDescription?: string;
  plotStatus?: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  nextFollowUpDate?: string;
  finalYieldKg?: string;
  controlYieldKg?: string;
  yieldIncreasePercent?: string;
  farmerSatisfaction?: number;
  commercialPotential?: string;
  finalSummaryNotes?: string;
  cropImages?: ImageFile[];
  plotImages?: ImageFile[];
  visitHistory?: any[];
  demoPlotData?: any;
  visitDate?: string;
  daysAfterSpray?: string | number;
  sprayMethod?: "SINGLE" | "TANK_MIXED" | string;
  sprayEquipment?: string;
  otherEquipment?: string;
  nextSprayDate?: string;
  demoResults?: Array<{
    productId?: string;
    productName?: string;
    plannedQty?: number;
    actualQty?: number;
    applicationRate?: string;
    unit?: string;
  }>;
  externalProducts?: any[];
}

export function DetailType7FollowUp({
  target,
  plotName,
  usageMethod,
  cropAgeValue,
  cropAgeUnit = "วัน",
  growthStage,
  cropCondition,
  cropProblemDescription,
  productResponse,
  problemDescription,
  plotStatus = "IN_PROGRESS",
  nextFollowUpDate,
  finalYieldKg,
  controlYieldKg,
  yieldIncreasePercent,
  farmerSatisfaction = 5,
  commercialPotential,
  finalSummaryNotes,
  cropImages = [],
  plotImages = [],
  visitHistory = [],
  demoPlotData,
  visitDate,
  daysAfterSpray,
  sprayMethod,
  sprayEquipment,
  otherEquipment,
  nextSprayDate,
  demoResults = [],
  externalProducts = [],
}: DetailType7FollowUpProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
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

  const formatThaiDate = (d?: string | Date | null) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      return dt.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return String(d);
    }
  };

  return (
    <div className="border border-blue-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
            <Sprout className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-blue-950 text-base md:text-lg">
              ติดตามแปลงสาธิต (Follow-up Demo Plot)
            </h2>
            <span className="text-xs text-blue-700 font-medium">
              บันทึกผลการตรวจติดตามแปลงเดิม ติดตามการเจริญเติบโต และประเมินผลการใช้ผลิตภัณฑ์
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs bg-blue-50 text-blue-800 border border-blue-200">
            <Search className="w-3.5 h-3.5 text-blue-600" />
            <span>ประเภท: ติดตามแปลงสาธิต</span>
          </span>

          {demoPlotData && visitHistory.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setHistoryOpen(true)}
              className="h-8 gap-1.5 text-xs font-semibold text-blue-800 border-blue-300 bg-blue-50/50 hover:bg-blue-100 rounded-xl"
            >
              <History className="w-3.5 h-3.5" />
              <span>ดูประวัติการติดตาม ({visitHistory.length} ครั้ง)</span>
            </Button>
          )}
        </div>
      </div>

      {/* PLANNED TARGET CARD */}
      <ActualTargetCard
        iconColorClass="text-blue-700"
        badgeColorClass="bg-blue-50 text-blue-800 border border-blue-200"
        gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
        items={[
          { label: "ประเภทงาน:", value: "ติดตามแปลงสาธิต" },
          { label: "แปลงสาธิต / เกษตรกร:", value: target.owner || "-" },
          { label: "พืชที่ติดตาม:", value: target.crop || "-" },
          { label: "สินค้าสาธิตของแปลง:", value: target.product || "-" },
          { label: "ขนาดแปลง:", value: target.plots || "-" },
          {
            label: "เป้าหมายการติดตาม:",
            value: target.targetCondition || target.objective || "-",
          },
          {
            label: "สิ่งที่ตั้งใจไปติดตาม:",
            value: target.experimentDetail || target.detail || "-",
          },
        ]}
      />

      {/* READ-ONLY RESULT DISPLAY */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>ผลการตรวจติดตามแปลงสาธิต (Actual Visit Result)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* 1. วันที่ติดตามจริง */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              1. วันที่ติดตามจริง
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 block">
              {formatThaiDate(visitDate || (demoPlotData?.visits?.[0]?.visitDate))}
            </span>
          </div>

          {/* 2. จำนวนวันหลังฉีดพ่น */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              2. จำนวนวันหลังฉีดพ่น
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {daysAfterSpray != null && daysAfterSpray !== ""
                ? `${daysAfterSpray} วัน`
                : "-"}
            </span>
          </div>

          {/* 3. ผลหลังการฉีดพ่น */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              3. ผลหลังการฉีดพ่น
            </span>
            {productResponse ? (
              <Badge
                variant="outline"
                className={
                  productResponse === "พืชตอบสนองดี"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                    : "bg-rose-50 text-rose-800 border-rose-300 font-bold"
                }
              >
                {productResponse === "พืชตอบสนองดี" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                )}
                {productResponse}
              </Badge>
            ) : (
              <span className="text-xs text-slate-700 font-semibold">-</span>
            )}
          </div>

          {/* สถานะแปลง */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              สถานะแปลง
            </span>
            <Badge
              variant="outline"
              className={
                plotStatus === "COMPLETED"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                  : plotStatus === "FAILED"
                    ? "bg-rose-50 text-rose-800 border-rose-300 font-bold"
                    : "bg-blue-50 text-blue-800 border-blue-300 font-bold"
              }
            >
              {plotStatus === "COMPLETED"
                ? "✅ ปิดแปลงแล้ว"
                : plotStatus === "FAILED"
                  ? "❌ ยุติการทดลอง"
                  : "🔄 กำลังทดลอง"}
            </Badge>
          </div>
        </div>

        {/* ปัญหาที่พบ (ถ้ามี) */}
        {problemDescription && (
          <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-rose-600 font-medium block flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              รายละเอียดปัญหาที่พบหลังการฉีดพ่น
            </span>
            <p className="text-xs sm:text-sm text-rose-900 font-semibold whitespace-pre-wrap leading-relaxed">
              {problemDescription}
            </p>
          </div>
        )}

        {/* 5. อัตราการฉีดพ่น (ตารางผลิตภัณฑ์) */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-700 font-bold block">
              5. อัตราการฉีดพ่น (ผลิตภัณฑ์จาก Demo Plot)
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              * ข้อมูล Baseline คงเดิม / แสดง Actual Rate ของรอบติดตามนี้
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2 px-3 w-12 text-center">#</th>
                  <th className="py-2 px-3">ผลิตภัณฑ์</th>
                  <th className="py-2 px-3 w-40 text-center">อัตราตามแผน (Baseline)</th>
                  <th className="py-2 px-3 w-48 text-center bg-blue-50/60 text-blue-900 font-bold">
                    อัตราที่ฉีดพ่นจริงรอบนี้
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {demoPlotData?.demoProducts && demoPlotData.demoProducts.length > 0 ? (
                  demoPlotData.demoProducts.map((pItem: any, idx: number) => {
                    const actualMatch = demoResults.find(
                      (r) => r.productId === pItem.productId,
                    );
                    const actualRate = actualMatch?.applicationRate;
                    return (
                      <tr key={pItem.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {pItem.product?.name || pItem.productName || target.product || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                          {pItem.applicationRate ? `${pItem.applicationRate} ซีซี / 20 ลิตร` : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-blue-700 bg-blue-50/30">
                          {actualRate ? `${actualRate} ซีซี / 20 ลิตร` : "-"}
                        </td>
                      </tr>
                    );
                  })
                ) : demoResults.length > 0 ? (
                  demoResults.map((item, idx) => (
                    <tr key={item.productId || idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {item.productName || target.product || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                        -
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-blue-700 bg-blue-50/30">
                        {item.applicationRate ? `${item.applicationRate} ซีซี / 20 ลิตร` : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">
                      ไม่มีข้อมูลผลิตภัณฑ์
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. วิธีการฉีดพ่น & 7. อุปกรณ์ & 8. กำหนดฉีดพ่นครั้งต่อไป */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {/* 6. วิธีการฉีดพ่น */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              6. วิธีการฉีดพ่น
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 block">
              {sprayMethod === "TANK_MIXED"
                ? "ฉีดพ่นร่วมกับสารอื่น (Tank-mix)"
                : sprayMethod === "SINGLE"
                  ? "ฉีดพ่นเดี่ยว (Single)"
                  : "-"}
            </span>
          </div>

          {/* 7. อุปกรณ์ที่ใช้ฉีดพ่น */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              7. อุปกรณ์ที่ใช้ฉีดพ่น
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 block">
              {sprayEquipment
                ? sprayEquipment === "อื่นๆ ระบุ.." && otherEquipment
                  ? `อื่นๆ (${otherEquipment})`
                  : sprayEquipment
                : "-"}
            </span>
          </div>

          {/* 8. กำหนดฉีดพ่นครั้งต่อไป */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              8. กำหนดฉีดพ่นครั้งต่อไป
            </span>
            <span className="text-xs sm:text-sm font-bold text-blue-800 block">
              {formatThaiDate(nextSprayDate || nextFollowUpDate)}
            </span>
          </div>
        </div>

        {/* EXTERNAL CHEMICALS (IF TANK_MIXED) */}
        {sprayMethod === "TANK_MIXED" && (
          <div className="bg-amber-50/40 border border-amber-200/80 rounded-xl p-3.5 space-y-2.5">
            <span className="text-xs text-amber-900 font-bold block">
              สารเคมีภายนอกที่ฉีดพ่นร่วม (Tank-mix External Chemicals)
            </span>
            {externalProducts && externalProducts.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-amber-200/80 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-amber-100/60 border-b border-amber-200 text-amber-950 font-bold">
                      <th className="py-2 px-3 w-12 text-center">#</th>
                      <th className="py-2 px-3">บริษัท</th>
                      <th className="py-2 px-3">ชื่อยา/การค้า</th>
                      <th className="py-2 px-3">สารสำคัญ</th>
                      <th className="py-2 px-3 w-28 text-center">สูตรยา</th>
                      <th className="py-2 px-3 w-32 text-center">อัตราการใช้</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {externalProducts.map((ext: any, idx: number) => (
                      <tr key={ext.id || idx} className="hover:bg-amber-50/30">
                        <td className="py-2 px-3 text-center text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800">
                          {ext.company || "-"}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {ext.productName || "-"}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {ext.activeIngredient || "-"}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-700">
                          {ext.formula === "OTHER" && ext.customFormula
                            ? ext.customFormula
                            : ext.formula || "-"}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-slate-800">
                          {ext.applicationRate
                            ? `${ext.applicationRate} ซีซี / 20 ลิตร`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <span className="text-xs text-amber-800 font-medium">
                ไม่มีข้อมูลสารเคมีภายนอก
              </span>
            )}
          </div>
        )}

        {/* 10. ข้อมูลเพิ่มเติม */}
        {usageMethod && (
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              10. ข้อมูลเพิ่มเติม / วิธีการใช้สารในรอบนี้
            </span>
            <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
              {usageMethod}
            </p>
          </div>
        )}

        {/* FINAL HARVEST & SATISFACTION METRICS (IF COMPLETED) */}
        {(finalYieldKg ||
          yieldIncreasePercent ||
          commercialPotential ||
          finalSummaryNotes) && (
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              สรุปผลผลิตและความพึงพอใจเมื่อจบการทดลอง
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
                <span className="text-slate-500 block mb-0.5">ผลผลิตแปลงสาธิต</span>
                <span className="text-sm font-extrabold text-emerald-900">
                  {finalYieldKg
                    ? `${Number(finalYieldKg).toLocaleString()} กก.`
                    : "-"}
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
                <span className="text-slate-500 block mb-0.5">ผลผลิตแปลงควบคุม</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {controlYieldKg
                    ? `${Number(controlYieldKg).toLocaleString()} กก.`
                    : "-"}
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
                <span className="text-slate-500 block mb-0.5">% ผลผลิตที่เพิ่มขึ้น</span>
                <span className="text-sm font-extrabold text-emerald-700">
                  {yieldIncreasePercent ? `+${yieldIncreasePercent}%` : "-"}
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
                <span className="text-slate-500 block mb-0.5">ความพึงพอใจ</span>
                <div className="flex items-center gap-1 text-amber-500 font-bold mt-0.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{farmerSatisfaction} / 5</span>
                </div>
              </div>

              {commercialPotential && (
                <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs sm:col-span-2 md:col-span-4">
                  <span className="text-slate-500 block mb-0.5">ศักยภาพทางการค้า</span>
                  <span className="font-semibold text-slate-800">
                    {commercialPotential}
                  </span>
                </div>
              )}

              {finalSummaryNotes && (
                <div className="bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs sm:col-span-2 md:col-span-4">
                  <span className="text-slate-500 block mb-0.5">สรุปผลการทดลอง</span>
                  <p className="font-semibold text-slate-800 whitespace-pre-wrap">
                    {finalSummaryNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DEMO PHOTOS (CROP & PLOT IMAGES) */}
        {(cropImages.length > 0 || plotImages.length > 0) && (
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-4">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              ภาพถ่ายการติดตามแปลง (Inspection Photos)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cropImages.length > 0 && (
                <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200/70">
                  <span className="text-xs font-semibold text-slate-700 block">
                    4. รูปผลหลังการฉีดพ่น ({cropImages.length} รูป)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {cropImages.map((img, i) => (
                      <button
                        key={img.id || i}
                        type="button"
                        onClick={() =>
                          openLightbox("รูปผลหลังการฉีดพ่น", cropImages, i)
                        }
                        className="group relative aspect-video rounded-md overflow-hidden bg-slate-100 border border-slate-200 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <img
                          src={img.url}
                          alt={img.name || `รูปผลหลังการฉีดพ่นที่ ${i + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {plotImages.length > 0 && (
                <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200/70">
                  <span className="text-xs font-semibold text-slate-700 block">
                    9. รูปการฉีดพ่น ({plotImages.length} รูป)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {plotImages.map((img, i) => (
                      <button
                        key={img.id || i}
                        type="button"
                        onClick={() =>
                          openLightbox("รูปการฉีดพ่น", plotImages, i)
                        }
                        className="group relative aspect-video rounded-md overflow-hidden bg-slate-100 border border-slate-200 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <img
                          src={img.url}
                          alt={img.name || `ภาพสภาพแปลงที่ ${i + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* History Modal */}
      {demoPlotData && (
        <DemoPlotHistoryModal
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          plot={demoPlotData}
        />
      )}

      {/* Lightbox Modal */}
      <ImageLightboxModal
        isOpen={lightboxState.isOpen}
        onClose={closeLightbox}
        images={lightboxState.images}
        initialIndex={lightboxState.initialIndex}
        title={lightboxState.title}
      />
    </div>
  );
}
