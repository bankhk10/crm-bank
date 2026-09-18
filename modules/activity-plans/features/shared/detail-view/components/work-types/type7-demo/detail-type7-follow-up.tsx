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
  Droplets,
  Layers,
  MapPin,
  Sparkles,
  Clock,
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
  sprayRounds?: any[];
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
  sprayRounds = [],
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
    imgs: any[] = [],
    initialIndex: number = 0,
  ) => {
    if (!imgs || imgs.length === 0) return;
    setLightboxState({
      isOpen: true,
      title,
      images: imgs.map((img) => ({
        id: img.id,
        url: img.url || img.fileUrl,
        name: img.name || img.fileName,
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

  // Completed past follow-up visits count (Problem 3.1 fix)
  const completedVisits = (demoPlotData?.visits || visitHistory || []).filter(
    (v: any) => v.visitNumber > 1 && v.productResponse != null,
  );
  const completedVisitsCount = completedVisits.length;

  return (
    <div className="border border-blue-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-5 shadow-xs">
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

          {demoPlotData && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setHistoryOpen(true)}
              className="h-8 gap-1.5 text-xs font-semibold text-blue-800 border-blue-300 bg-blue-50/50 hover:bg-blue-100 rounded-xl"
            >
              <History className="w-3.5 h-3.5" />
              <span>ดูประวัติการติดตาม ({completedVisitsCount} ครั้ง)</span>
            </Button>
          )}
        </div>
      </div>

      {/* PLANNED TARGET CARD (Problem 3.2 Fix: Selected Plot + Planned Detail) */}
      <ActualTargetCard
        iconColorClass="text-blue-700"
        badgeColorClass="bg-blue-50 text-blue-800 border border-blue-200"
        gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
        items={[
          { label: "ประเภทงาน:", value: "ติดตามแปลงสาธิต" },
          {
            label: "แปลงสาธิตที่เลือก:",
            value: demoPlotData?.code
              ? `[${demoPlotData.code}] ${demoPlotData.name || demoPlotData.plotName || target.owner}`
              : target.owner || "-",
          },
          {
            label: "สิ่งที่ตั้งใจไปติดตาม:",
            value: target.detail || target.experimentDetail || "-",
          },
        ]}
      />

      {/* READ-ONLY INITIAL DATA CARD FOR TYPE_7B (Problem 3.3 Fix: Complete Baseline Plot Data) */}
      {demoPlotData && (
        <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 text-xs shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-slate-800">
                ข้อมูลตั้งต้นของแปลงสาธิต (Initial Plot Data - Read Only)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
              BASELINE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-slate-700">
            <div>
              <span className="text-slate-400 block text-[11px]">รหัสแปลงสาธิต</span>
              <span className="font-semibold text-slate-900 font-mono">
                {demoPlotData.code || "-"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">ชื่อแปลงสาธิต</span>
              <span className="font-semibold text-slate-900">
                {demoPlotData.plotName || demoPlotData.name || "-"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">เกษตรกรเจ้าของแปลง</span>
              <span className="font-semibold text-slate-900">
                {demoPlotData.ownerName || target.owner || "-"}{" "}
                {demoPlotData.ownerPhone ? `(${demoPlotData.ownerPhone})` : ""}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">จังหวัด / อำเภอ</span>
              <span className="font-semibold text-slate-900">
                {demoPlotData.ownerProvince || demoPlotData.farmerCustomer?.province || "-"}{" "}
                {demoPlotData.district ? `/ ${demoPlotData.district}` : ""}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">ร้านค้าตัวแทนจำหน่าย</span>
              <span className="font-semibold text-slate-900">
                {demoPlotData.customer?.name || demoPlotData.dealerName || "-"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">พิกัดแปลง (Lat, Lng)</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                {demoPlotData.latitude && demoPlotData.longitude
                  ? `${demoPlotData.latitude}, ${demoPlotData.longitude}`
                  : "-"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">พืช / หมวดหมู่</span>
              <span className="font-semibold text-slate-900">
                {demoPlotData.cropName || demoPlotData.targetCrop || target.crop || "-"}{" "}
                {demoPlotData.cropCategory ? `(${demoPlotData.cropCategory})` : ""}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">ขนาดพื้นที่</span>
              <span className="font-semibold text-slate-900">
                {demoPlotData.areaRai ? `${demoPlotData.areaRai} ไร่` : "-"}{" "}
                {demoPlotData.treeCount ? `(${demoPlotData.treeCount} ต้น)` : ""}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block text-[11px]">วัตถุประสงค์แปลงสาธิต</span>
              <span className="font-medium text-slate-800">
                {demoPlotData.objective || "-"}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block text-[11px]">รายละเอียดการทดสอบ</span>
              <span className="font-medium text-slate-800">
                {demoPlotData.experimentDetail || "-"}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block text-[11px]">ข้อมูลแปลงหลัก / สภาพพื้นที่ปลูก</span>
              <span className="font-medium text-slate-800">
                {demoPlotData.mainCropInfo || demoPlotData.plantingAreaCondition || "-"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">แหล่งน้ำ / ระบบการให้น้ำ</span>
              <span className="font-medium text-slate-800">
                {demoPlotData.irrigations && demoPlotData.irrigations.length > 0
                  ? demoPlotData.irrigations
                      .map((i: any) => i.method || i.methodName)
                      .join(", ")
                  : "-"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">วันที่เริ่มฉีดพ่นครั้งแรก</span>
              <span className="font-semibold text-slate-900">
                {demoPlotData.initialSprayDate
                  ? new Date(demoPlotData.initialSprayDate).toLocaleDateString("th-TH")
                  : "-"}
              </span>
            </div>
          </div>

          {/* Baseline Demo Products Table */}
          {demoPlotData.demoProducts && demoPlotData.demoProducts.length > 0 && (
            <div className="pt-2 border-t border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                ตารางรายการยาที่ใช้สาธิตของแปลง (Baseline Products):
              </span>
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="p-2.5 w-12 text-center">#</th>
                      <th className="p-2.5">ชื่อสินค้าสาธิต</th>
                      <th className="p-2.5">อัตราการใช้ตามเกณฑ์ (Baseline Rate)</th>
                      <th className="p-2.5 text-right">ปริมาณที่ใช้สาธิต</th>
                      <th className="p-2.5">หน่วย</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {demoPlotData.demoProducts.map((p: any, pIdx: number) => (
                      <tr key={p.id || pIdx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 text-center text-slate-400">{pIdx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900">
                          {p.product?.name || p.productName || "-"}
                        </td>
                        <td className="p-2.5 text-slate-700">
                          {p.applicationRate ? (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-200">
                              {p.applicationRate}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-2.5 text-right font-semibold text-slate-800">
                          {p.quantity ?? "-"}
                        </td>
                        <td className="p-2.5 text-slate-600">
                          {p.product?.unit || p.unit || ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Baseline External Chemicals Table */}
          {demoPlotData.externalProducts && demoPlotData.externalProducts.length > 0 && (
            <div className="pt-2 border-t border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                ตารางสารเคมีภายนอกตั้งต้น (Baseline External Chemicals):
              </span>
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="p-2.5 w-12 text-center">#</th>
                      <th className="p-2.5">บริษัท</th>
                      <th className="p-2.5">ชื่อสินค้า / สารเคมี</th>
                      <th className="p-2.5">สารสำคัญ</th>
                      <th className="p-2.5">สูตรเคมี</th>
                      <th className="p-2.5">อัตราการใช้</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {demoPlotData.externalProducts.map((ep: any, epIdx: number) => (
                      <tr key={ep.id || epIdx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 text-center text-slate-400">{epIdx + 1}</td>
                        <td className="p-2.5 text-slate-800 font-medium">{ep.company || "-"}</td>
                        <td className="p-2.5 text-slate-900 font-bold">{ep.productName || "-"}</td>
                        <td className="p-2.5 text-slate-600">{ep.activeIngredient || "-"}</td>
                        <td className="p-2.5 text-slate-700">
                          {ep.formula === "อื่นๆ" ? ep.customFormula : ep.formula}
                        </td>
                        <td className="p-2.5 font-medium text-slate-800">{ep.applicationRate || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Baseline Initial Photos */}
          {demoPlotData.attachments && demoPlotData.attachments.length > 0 && (
            <div className="pt-2 border-t border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                รูปถ่ายแปลงเริ่มต้น (Baseline Photos):
              </span>
              <div className="flex flex-wrap gap-2">
                {demoPlotData.attachments.map((att: any, attIdx: number) => (
                  <button
                    key={att.id || attIdx}
                    type="button"
                    onClick={() => openLightbox("รูปถ่ายแปลงเริ่มต้น", demoPlotData.attachments, attIdx)}
                    className="block relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity shadow-xs"
                  >
                    <img
                      src={att.fileUrl}
                      alt={att.fileName || "Baseline Photo"}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION A: ผลการตรวจติดตามแปลง (Tracking Details) */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>ส่วนที่ 1: ผลการตรวจติดตามแปลง (Tracking Details)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {/* วันที่ติดตามจริง */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              วันที่ติดตามจริง
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 block">
              {formatThaiDate(visitDate || demoPlotData?.visits?.[0]?.visitDate)}
            </span>
          </div>

          {/* จำนวนวันหลังฉีดพ่น */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              จำนวนวันหลังฉีดพ่น
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {daysAfterSpray != null && daysAfterSpray !== ""
                ? `${daysAfterSpray} วัน`
                : "-"}
            </span>
          </div>

          {/* สถานะแปลง */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              สถานะแปลงสาธิต
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

        {/* รูปสภาพพืช */}
        {cropImages && cropImages.length > 0 && (
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-slate-800 block">
              รูปภาพสภาพพืชรอบนี้ ({cropImages.length} รูป)
            </span>
            <div className="flex flex-wrap gap-2.5">
              {cropImages.map((img, i) => (
                <button
                  key={img.id || i}
                  type="button"
                  onClick={() => openLightbox("รูปภาพสภาพพืช", cropImages, i)}
                  className="group relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-xs hover:ring-2 hover:ring-blue-500 transition-all"
                >
                  <img
                    src={img.url}
                    alt={img.name || `Crop photo ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION B: ข้อมูลการฉีดพ่นรอบต่างๆ (Multiple Spraying Rounds) */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Droplets className="w-4 h-4 text-emerald-600" />
          <span>ส่วนที่ 2: ข้อมูลการฉีดพ่นรอบต่างๆ (Multiple Spraying Rounds)</span>
        </div>

        {sprayRounds && sprayRounds.length > 0 ? (
          <div className="space-y-4">
            {sprayRounds.map((round: any, rIdx: number) => {
              const rNumber = round.roundNumber || rIdx + 1;
              const rProducts = round.productRates || round.products || [];
              const rExternals = round.externalProducts || [];
              const rAttachments = round.plotImages || round.attachments || [];

              return (
                <div
                  key={round.id || rIdx}
                  className="p-4 sm:p-5 border border-emerald-200 rounded-2xl space-y-4 bg-emerald-50/20 shadow-2xs"
                >
                  <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        {rNumber}
                      </span>
                      <h4 className="text-sm font-bold text-emerald-950">
                        รอบการฉีดพ่นที่ {rNumber}
                      </h4>
                    </div>

                    <Badge
                      variant="outline"
                      className={
                        round.productResponse === "พืชตอบสนองดี"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                          : "bg-rose-50 text-rose-800 border-rose-300 font-bold"
                      }
                    >
                      {round.productResponse === "พืชตอบสนองดี" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                      )}
                      {round.productResponse || "ไม่ระบุผล"}
                    </Badge>
                  </div>

                  {/* รายการสินค้าสาธิตที่ฉีดพ่นในรอบนี้ */}
                  {rProducts.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-800 block">
                        รายการยาที่ฉีดพ่นในรอบนี้:
                      </span>
                      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                              <th className="p-2.5 w-12 text-center">#</th>
                              <th className="p-2.5">ชื่อสินค้าสาธิต</th>
                              <th className="p-2.5">อัตราตามเกณฑ์ (Baseline)</th>
                              <th className="p-2.5">อัตราการใช้จริงรอบนี้</th>
                              <th className="p-2.5 text-right">ปริมาณที่ใช้</th>
                              <th className="p-2.5">หน่วย</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {rProducts.map((p: any, pIdx: number) => (
                              <tr key={p.productId || pIdx}>
                                <td className="p-2.5 text-center text-slate-400">{pIdx + 1}</td>
                                <td className="p-2.5 font-bold text-slate-900">
                                  {p.productName || p.product?.name || "-"}
                                </td>
                                <td className="p-2.5 text-slate-500">
                                  {p.baselineRate || "-"}
                                </td>
                                <td className="p-2.5 font-semibold text-emerald-800">
                                  {p.actualRate || "-"}
                                </td>
                                <td className="p-2.5 text-right font-semibold text-slate-800">
                                  {p.quantityUsed != null ? p.quantityUsed : p.quantity ?? "-"}
                                </td>
                                <td className="p-2.5 text-slate-600">
                                  {p.unit || p.product?.unit || ""}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ข้อมูลอุปกรณ์และวิธีการฉีด */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                      <span className="text-slate-500 block">วิธีการฉีดพ่น</span>
                      <span className="font-bold text-slate-900">
                        {round.sprayMethod === "TANK_MIXED"
                          ? "ผสมถังรวม (Tank-Mixed)"
                          : "ฉีดเดี่ยว (Single)"}
                      </span>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                      <span className="text-slate-500 block">อุปกรณ์ที่ใช้ฉีดพ่น</span>
                      <span className="font-bold text-slate-900">
                        {round.sprayEquipment || "-"}
                        {round.otherEquipment ? ` (${round.otherEquipment})` : ""}
                      </span>
                    </div>

                    {round.productResponse === "พบปัญหา" && (
                      <div className="sm:col-span-3 p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                        <span className="text-xs font-bold text-rose-900 block">
                          รายละเอียดปัญหาที่พบหลังการฉีดพ่นรอบนี้:
                        </span>
                        <p className="text-xs text-rose-800 font-medium">
                          {round.problemDetail || round.problemDescription || "-"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* สารเคมีภายนอกเมื่อเลือก TANK_MIXED */}
                  {round.sprayMethod === "TANK_MIXED" && rExternals.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-amber-950 block">
                        สารเคมีภายนอกที่ผสมร่วมในรอบนี้:
                      </span>
                      <div className="overflow-x-auto border border-amber-200 rounded-xl bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-amber-50/70 border-b border-amber-200 text-amber-900 font-semibold">
                              <th className="p-2.5 w-12 text-center">#</th>
                              <th className="p-2.5">บริษัท</th>
                              <th className="p-2.5">ชื่อสารเคมีภายนอก</th>
                              <th className="p-2.5">สารสำคัญ</th>
                              <th className="p-2.5">สูตรเคมี</th>
                              <th className="p-2.5">อัตราการใช้</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-amber-100">
                            {rExternals.map((ep: any, eIdx: number) => (
                              <tr key={ep.id || eIdx}>
                                <td className="p-2.5 text-center text-slate-400">{eIdx + 1}</td>
                                <td className="p-2.5 font-medium text-slate-800">{ep.company || "-"}</td>
                                <td className="p-2.5 font-bold text-slate-900">{ep.productName || "-"}</td>
                                <td className="p-2.5 text-slate-600">{ep.activeIngredient || "-"}</td>
                                <td className="p-2.5 text-slate-700">
                                  {ep.formula === "อื่นๆ" ? ep.customFormula : ep.formula}
                                </td>
                                <td className="p-2.5 font-semibold text-slate-800">{ep.applicationRate || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* รูปการฉีดพ่นในรอบนี้ */}
                  {rAttachments.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-emerald-100">
                      <span className="text-xs font-bold text-slate-800 block">
                        รูปภาพการฉีดพ่นในรอบนี้ ({rAttachments.length} รูป)
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {rAttachments.map((img: any, i: number) => (
                          <button
                            key={img.id || i}
                            type="button"
                            onClick={() => openLightbox(`รูปการฉีดพ่นรอบที่ ${rNumber}`, rAttachments, i)}
                            className="group relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-xs hover:ring-2 hover:ring-emerald-500 transition-all"
                          >
                            <img
                              src={img.url || img.fileUrl}
                              alt={img.name || img.fileName || `Spray photo ${i + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-5 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
            ไม่มีการบันทึกรอบการฉีดพ่นในการเข้าแปลงครั้งนี้ (ตรวจติดตามสภาพพืชเท่านั้น)
          </div>
        )}

        {/* นัดหมายครั้งถัดไปและข้อสังเกตเพิ่มเติม */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3 border-t border-slate-100">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              กำหนดฉีดพ่น / ติดตามครั้งต่อไป
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {formatThaiDate(nextSprayDate || nextFollowUpDate)}
            </span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              ข้อสังเกตหรือข้อมูลเพิ่มเติม
            </span>
            <span className="text-xs sm:text-sm text-slate-800 block">
              {usageMethod || "-"}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3: สรุปผลผลิตและการประเมินผลเมื่อปิดแปลง */}
      {plotStatus === "COMPLETED" && (
        <div className="pt-4 border-t border-emerald-200 space-y-4 bg-emerald-50/40 p-5 rounded-2xl border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
              สรุปผลการเก็บเกี่ยวและความพึงพอใจของเกษตรกร
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1">
              <span className="text-xs text-slate-500 block">ผลผลิตแปลงสาธิต</span>
              <span className="text-sm font-bold text-slate-900 block">
                {finalYieldKg ? `${finalYieldKg} กก./ไร่` : "-"}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1">
              <span className="text-xs text-slate-500 block">ผลผลิตแปลงควบคุม</span>
              <span className="text-sm font-bold text-slate-900 block">
                {controlYieldKg ? `${controlYieldKg} กก./ไร่` : "-"}
              </span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
              <span className="text-xs text-emerald-800 font-medium block">ผลผลิตเพิ่มขึ้น</span>
              <span className="text-sm font-bold text-emerald-900 block">
                {yieldIncreasePercent ? `+${yieldIncreasePercent} %` : "-"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1">
              <span className="text-xs text-slate-500 block">ความพึงพอใจของเกษตรกร</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= (farmerSatisfaction || 0)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-slate-700 ml-1.5">
                  {farmerSatisfaction || 0} / 5
                </span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1">
              <span className="text-xs text-slate-500 block">โอกาสในการขยายผล</span>
              <span className="text-xs font-bold text-slate-900 block">
                {commercialPotential || "-"}
              </span>
            </div>

            {finalSummaryNotes && (
              <div className="sm:col-span-2 p-3 bg-white rounded-xl border border-emerald-200 space-y-1">
                <span className="text-xs text-slate-500 block">สรุปภาพรวมและข้อเสนอแนะ</span>
                <p className="text-xs text-slate-800 font-medium">
                  {finalSummaryNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <DemoPlotHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        plot={demoPlotData}
      />

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
