"use client";

import React, { useState } from "react";
import {
  Camera,
  X,
  Sprout,
  Calendar,
  Clock,
  Coins,
  History,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Star,
  TrendingUp,
  Sparkles,
  PlusCircle,
  Search,
  MapPin,
  FileText,
  ImageIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ActualTargetCard } from "../actual-target-card";
import { ImageFile } from "../../types";

export interface TargetDemoItem {
  activityType?: "CREATE" | "FOLLOW_UP" | string;
  owner: string;
  product: string;
  crop: string;
  plots: string;
  demoProductQuantity?: string | number | null;
  objective?: string;
  experimentDetail?: string;
  detail?: string;
}

export interface DemoPlotVisitHistoryItem {
  id: string;
  visitNumber: number;
  visitDate: string | Date;
  daysSinceStart: number;
  cropAgeValue?: number | null;
  cropAgeUnit?: string | null;
  growthStage?: string | null;
  cropCondition?: string | null;
  productResponse?: string | null;
  totalVisitCost?: number | null;
  notes?: string | null;
  imageUrls?: string[];
  activityPlan?: {
    code?: string | null;
    title?: string | null;
  } | null;
}

interface ActualType7DemoProps {
  isVisible: boolean;
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
    items?: TargetDemoItem[];
  };
  startDate?: string;
  actualDate?: string;
  productPrice?: number;
  plotName: string;
  setPlotName: (v: string) => void;
  usageMethod: string;
  setUsageMethod: (v: string) => void;
  // Specific to "ทำแปลงสาธิต" (CREATE)
  plantingDate?: string;
  setPlantingDate?: (v: string) => void;
  plantingAreaCondition?: string;
  setPlantingAreaCondition?: (v: string) => void;
  cropImages?: ImageFile[];
  onUploadCropImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveCropImage?: (id: string) => void;
  // Specific to "ติดตามแปลงสาธิต" (FOLLOW_UP)
  cropAgeValue?: string;
  setCropAgeValue?: (v: string) => void;
  cropAgeUnit?: string;
  setCropAgeUnit?: (v: string) => void;
  growthStage?: string;
  setGrowthStage?: (v: string) => void;
  cropCondition?: "สมบูรณ์" | "มีปัญหา" | "ปานกลาง" | "ทรุดโทรม" | "";
  setCropCondition?: (
    v: "สมบูรณ์" | "มีปัญหา" | "ปานกลาง" | "ทรุดโทรม" | "",
  ) => void;
  cropProblemDescription?: string;
  setCropProblemDescription?: (v: string) => void;
  productResponse?: "พืชตอบสนองดี" | "พบปัญหา" | "";
  setProductResponse?: (v: "พืชตอบสนองดี" | "พบปัญหา" | "") => void;
  problemDescription?: string;
  setProblemDescription?: (v: string) => void;
  plotImages: ImageFile[];
  onUploadImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
  // Lifecycle & Calculations Props (for FOLLOW_UP)
  plotStatus?: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  setPlotStatus?: (v: "IN_PROGRESS" | "COMPLETED" | "FAILED") => void;
  nextFollowUpDate?: string;
  setNextFollowUpDate?: (v: string) => void;
  finalYieldKg?: string;
  setFinalYieldKg?: (v: string) => void;
  controlYieldKg?: string;
  setControlYieldKg?: (v: string) => void;
  yieldIncreasePercent?: string;
  setYieldIncreasePercent?: (v: string) => void;
  farmerSatisfaction?: number;
  setFarmerSatisfaction?: (v: number) => void;
  commercialPotential?: string;
  setCommercialPotential?: (v: string) => void;
  finalSummaryNotes?: string;
  setFinalSummaryNotes?: (v: string) => void;
  visitHistory?: DemoPlotVisitHistoryItem[];
  isHistoryLoading?: boolean;
}

export function ActualType7Demo({
  isVisible,
  target,
  startDate = "",
  actualDate = "",
  productPrice = 500,
  plotName,
  setPlotName,
  usageMethod,
  setUsageMethod,
  plantingDate = "",
  setPlantingDate,
  plantingAreaCondition = "",
  setPlantingAreaCondition,
  cropImages = [],
  onUploadCropImages,
  onRemoveCropImage,
  cropAgeValue = "",
  setCropAgeValue,
  cropAgeUnit = "วัน",
  setCropAgeUnit,
  growthStage = "",
  setGrowthStage,
  cropCondition = "",
  setCropCondition,
  cropProblemDescription = "",
  setCropProblemDescription,
  productResponse = "",
  setProductResponse,
  problemDescription = "",
  setProblemDescription,
  plotImages = [],
  onUploadImages,
  onRemoveImage,
  plotStatus = "IN_PROGRESS",
  setPlotStatus,
  nextFollowUpDate = "",
  setNextFollowUpDate,
  finalYieldKg = "",
  setFinalYieldKg,
  controlYieldKg = "",
  setControlYieldKg,
  yieldIncreasePercent = "",
  setYieldIncreasePercent,
  farmerSatisfaction = 5,
  setFarmerSatisfaction,
  commercialPotential = "",
  setCommercialPotential,
  finalSummaryNotes = "",
  setFinalSummaryNotes,
  visitHistory = [],
  isHistoryLoading = false,
}: ActualType7DemoProps) {
  const [showHistory, setShowHistory] = useState(false);

  if (!isVisible) return null;

  // Determine work type from target
  const activityType =
    target.activityType || target.items?.[0]?.activityType || "CREATE";
  const isFollowUp = activityType === "FOLLOW_UP";
  const isCreate = !isFollowUp;

  const hasMultipleItems = target.items && target.items.length > 1;

  // 1. Duration Calculation (Days Elapsed) for FOLLOW_UP
  const computeDaysElapsed = () => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const end = actualDate ? new Date(actualDate) : new Date();
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    const diffMs = end.getTime() - start.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  };

  const daysElapsed = computeDaysElapsed();

  // 2. Cost Calculation for FOLLOW_UP
  const demoQty =
    target.demoProductQuantity != null && target.demoProductQuantity !== ""
      ? Number(target.demoProductQuantity)
      : 0;
  const currentDemoCost = demoQty * (productPrice || 500);

  const previousVisitsCost = visitHistory.reduce(
    (sum, v) => sum + (Number(v.totalVisitCost) || 0),
    0,
  );
  const totalCumulativeCost = previousVisitsCost + currentDemoCost;
  const currentVisitNumber = visitHistory.length + 1;

  // Handle Yield calculation
  const handleYieldChange = (finalVal: string, controlVal: string) => {
    setFinalYieldKg?.(finalVal);
    setControlYieldKg?.(controlVal);
    const f = parseFloat(finalVal);
    const c = parseFloat(controlVal);
    if (!isNaN(f) && !isNaN(c) && c > 0) {
      const inc = (((f - c) / c) * 100).toFixed(1);
      setYieldIncreasePercent?.(inc);
    }
  };

  return (
    <div className="border-2 border-emerald-500 rounded-2xl p-4 md:p-6 bg-white space-y-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-emerald-100 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-emerald-900 text-base md:text-lg">
              {isFollowUp
                ? "ติดตามแปลงสาธิต"
                : "ทำแปลงสาธิต (เริ่มทำแปลงใหม่)"}
            </h2>
            <p className="text-xs text-slate-500">
              {isFollowUp
                ? "บันทึกผลการทดสอบ ติดตามการเจริญเติบโต และประเมินผลผลิต"
                : "บันทึกข้อมูลการเริ่มต้นทำแปลงสาธิตใหม่ และภาพถ่ายสภาพแปลงเริ่มต้น"}
            </p>
          </div>
        </div>

        {/* Type & Status Badges */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs",
              isFollowUp
                ? "bg-blue-50 text-blue-800 border border-blue-200"
                : "bg-emerald-100 text-emerald-800 border border-emerald-300",
            )}
          >
            {isFollowUp ? (
              <>
                <Search className="w-3.5 h-3.5 text-blue-600" />
                <span>ประเภท: ติดตามแปลงสาธิต</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>ประเภท: ทำแปลงสาธิต</span>
              </>
            )}
          </span>

          {isFollowUp && (
            <span
              className={cn(
                "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs",
                plotStatus === "COMPLETED"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : plotStatus === "FAILED"
                    ? "bg-rose-100 text-rose-800 border border-rose-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300",
              )}
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  plotStatus === "COMPLETED"
                    ? "bg-emerald-500"
                    : plotStatus === "FAILED"
                      ? "bg-rose-500"
                      : "bg-amber-500 animate-pulse",
                )}
              />
              {plotStatus === "COMPLETED"
                ? "ปิดแปลงสมบูรณ์"
                : plotStatus === "FAILED"
                  ? "ยุติการทดลอง"
                  : "กำลังติดตามต่อเนื่อง"}
            </span>
          )}
        </div>
      </div>

      {/* Case 1: FOLLOW_UP Cumulative Metrics & Calculations Banner */}
      {isFollowUp && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3 text-xs">
          <div className="bg-white p-2.5 rounded-lg border border-emerald-100/80 shadow-2xs space-y-0.5">
            <div className="text-slate-500 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>ระยะเวลาทำแปลง</span>
            </div>
            <div className="text-base font-extrabold text-emerald-950">
              {daysElapsed !== null ? `${daysElapsed} วัน` : "-"}
            </div>
            <div className="text-[10px] text-slate-400">
              เริ่ม: {startDate || "ตามแผน"}
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-emerald-100/80 shadow-2xs space-y-0.5">
            <div className="text-slate-500 flex items-center gap-1 font-medium">
              <History className="w-3.5 h-3.5 text-emerald-600" />
              <span>รอบการเข้าตรวจ</span>
            </div>
            <div className="text-base font-extrabold text-emerald-950">
              ครั้งที่ {currentVisitNumber}
            </div>
            <div className="text-[10px] text-slate-400">
              ประวัติเดิม {visitHistory.length} ครั้ง
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-emerald-100/80 shadow-2xs space-y-0.5">
            <div className="text-slate-500 flex items-center gap-1 font-medium">
              <Coins className="w-3.5 h-3.5 text-emerald-600" />
              <span>มูลค่าสินค้าสาธิต</span>
            </div>
            <div className="text-base font-extrabold text-emerald-950">
              {currentDemoCost > 0
                ? `${currentDemoCost.toLocaleString()} บ.`
                : "-"}
            </div>
            <div className="text-[10px] text-slate-400">
              {demoQty > 0 ? `${demoQty} หน่วย (รอบนี้)` : "ยังไม่ระบุจำนวน"}
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-emerald-100/80 shadow-2xs space-y-0.5">
            <div className="text-slate-500 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>ค่าใช้จ่ายสะสมรวม</span>
            </div>
            <div className="text-base font-extrabold text-emerald-900">
              {totalCumulativeCost > 0
                ? `${totalCumulativeCost.toLocaleString()} บ.`
                : "0 บ."}
            </div>
            <div className="text-[10px] text-slate-400">รวมทุกการเข้าตรวจ</div>
          </div>
        </div>
      )}

      {/* Target Details from Plan */}
      {hasMultipleItems ? (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-emerald-600" />
              รายการเป้าหมายแปลงสาธิต ({target.items?.length} รายการ):
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              จากฟอร์มสร้างแผน
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {target.items?.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                  <span className="flex items-center gap-1.5 text-xs text-emerald-900">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-extrabold">
                      {idx + 1}
                    </span>
                    เจ้าของแปลง: {item.owner || "-"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {item.activityType === "FOLLOW_UP"
                      ? "ติดตามแปลง"
                      : "ทำแปลงใหม่"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-slate-600 text-[11px]">
                  <div>
                    <span className="font-semibold text-slate-400">สินค้า: </span>
                    <span className="font-bold text-slate-800">
                      {item.product || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">
                      จำนวนสินค้า:{" "}
                    </span>
                    <span className="font-bold text-emerald-800">
                      {item.demoProductQuantity != null &&
                      item.demoProductQuantity !== ""
                        ? `${item.demoProductQuantity} หน่วย`
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">พืช: </span>
                    <span className="font-bold text-slate-800">
                      {item.crop || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400">
                      พื้นที่/ต้น:{" "}
                    </span>
                    <span className="font-bold text-slate-800">
                      {item.plots || "-"}
                    </span>
                  </div>
                </div>
                {(item.objective || item.experimentDetail || item.detail) && (
                  <div className="pt-1 border-t border-slate-100 text-[11px] space-y-0.5">
                    {item.objective && (
                      <div>
                        <span className="font-semibold text-slate-400">
                          วัตถุประสงค์:{" "}
                        </span>
                        <span className="text-slate-700">{item.objective}</span>
                      </div>
                    )}
                    {(item.experimentDetail || item.detail) && (
                      <div>
                        <span className="font-semibold text-slate-400">
                          วิธีทดลอง:{" "}
                        </span>
                        <span className="text-slate-700">
                          {item.experimentDetail || item.detail}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ActualTargetCard
          items={[
            {
              label: "ประเภทงาน:",
              value: isFollowUp ? "ติดตามแปลงสาธิต" : "ทำแปลงสาธิต (แปลงใหม่)",
              highlight: true,
            },
            { label: "เจ้าของแปลง:", value: target.owner || "-" },
            { label: "สินค้าสาธิต:", value: target.product || "-" },
            {
              label: "จำนวนสินค้าที่จะสาธิต:",
              value:
                target.demoProductQuantity != null &&
                target.demoProductQuantity !== ""
                  ? `${target.demoProductQuantity} หน่วย`
                  : "-",
              highlight: true,
            },
            { label: "พืชเป้าหมาย:", value: target.crop || "-" },
            { label: "พื้นที่/จำนวนต้น:", value: target.plots || "-" },
            { label: "วัตถุประสงค์ของแปลง:", value: target.objective || "-" },
            {
              label: "รายละเอียด / วิธีการทดลอง:",
              value: target.experimentDetail || target.detail || "-",
            },
          ]}
        />
      )}

      {/* ========================================================================= */}
      {/* CASE A: ประเภทงาน = "ทำแปลงสาธิต" (CREATE - เริ่มต้นทำแปลงใหม่)             */}
      {/* ========================================================================= */}
      {isCreate && (
        <div className="space-y-6 pt-1">
          {/* ข้อมูลการทำแปลง */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-200/80 pb-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>ข้อมูลการทำแปลง (Plot Creation Details)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>วันที่ปลูก</span>
                  <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="date"
                  value={plantingDate}
                  onChange={(e) => setPlantingDate?.(e.target.value)}
                  className="bg-white border-slate-300 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>สภาพพื้นที่ปลูก</span>
                </label>
                <Input
                  type="text"
                  value={plantingAreaCondition}
                  onChange={(e) => setPlantingAreaCondition?.(e.target.value)}
                  placeholder="เช่น ดินร่วนปนทราย น้ำสมบูรณ์ ใกล้แหล่งน้ำ"
                  className="bg-white border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                วิธีการใช้ / อัตราการใช้
              </label>
              <Textarea
                rows={2}
                value={usageMethod}
                onChange={(e) => setUsageMethod(e.target.value)}
                placeholder="เช่น ฉีดพ่นทางใบ 50cc/น้ำ 20L หรือ รองก้นหลุมก่อนปลูก"
                className="bg-white border-slate-300 text-xs"
              />
            </div>
          </div>

          {/* รูปภาพประกอบการทำแปลง */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-200/80 pb-2">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>รูปภาพประกอบการทำแปลง (Plot Photos)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. รูปสภาพพืช */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sprout className="w-4 h-4 text-emerald-600" />
                    <span>รูปสภาพพืช</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    (ต้นกล้า/ก่อน-หลังใช้)
                  </span>
                </label>
                <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/30 rounded-xl p-4 text-center transition-colors cursor-pointer relative group">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={onUploadCropImages || onUploadImages}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-emerald-800">
                      คลิกเพื่ออัปโหลด รูปสภาพพืช
                    </p>
                  </div>
                </div>
                {cropImages && cropImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {cropImages.map((img) => (
                      <div
                        key={img.id}
                        className="relative aspect-square rounded-lg overflow-hidden border border-slate-200"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-full object-cover"
                        />
                        {onRemoveCropImage && (
                          <button
                            type="button"
                            onClick={() => onRemoveCropImage(img.id)}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. รูปภาพสภาพแปลง */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>รูปภาพสภาพแปลง</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    (ภาพรวมพื้นที่ปลูก)
                  </span>
                </label>
                <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/30 rounded-xl p-4 text-center transition-colors cursor-pointer relative group">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={onUploadImages}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-emerald-800">
                      คลิกเพื่ออัปโหลด รูปภาพสภาพแปลง
                    </p>
                  </div>
                </div>
                {plotImages && plotImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {plotImages.map((img) => (
                      <div
                        key={img.id}
                        className="relative aspect-square rounded-lg overflow-hidden border border-slate-200"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => onRemoveImage(img.id)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CASE B: ประเภทงาน = "ติดตามแปลงสาธิต" (FOLLOW_UP - ติดตามแปลงเดิม)          */}
      {/* ========================================================================= */}
      {isFollowUp && (
        <>
          {/* Visit History Accordion */}
          {visitHistory.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 text-xs">
              <button
                type="button"
                onClick={() => setShowHistory((prev) => !prev)}
                className="w-full px-4 py-2.5 flex items-center justify-between font-bold text-slate-700 hover:bg-slate-100/80 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-600" />
                  <span>
                    ประวัติการเข้าตรวจย้อนหลัง ({visitHistory.length} ครั้ง)
                  </span>
                </span>
                {showHistory ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {showHistory && (
                <div className="p-3 border-t border-slate-200 space-y-2.5 bg-white">
                  {visitHistory.map((visit, idx) => (
                    <div
                      key={visit.id || idx}
                      className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/60 space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-200/50 pb-1">
                        <span className="text-emerald-800">
                          ครั้งที่ {visit.visitNumber || idx + 1} —{" "}
                          {typeof visit.visitDate === "string"
                            ? visit.visitDate.split("T")[0]
                            : new Date(visit.visitDate).toLocaleDateString(
                                "th-TH",
                              )}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                          ผ่านไป {visit.daysSinceStart || 0} วัน
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
                        <div>
                          <span className="font-semibold text-slate-400">
                            ระยะพืช:{" "}
                          </span>
                          <span>{visit.growthStage || "-"}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-400">
                            สภาพแปลง:{" "}
                          </span>
                          <span
                            className={
                              visit.cropCondition === "มีปัญหา"
                                ? "text-rose-600 font-bold"
                                : "text-emerald-700 font-bold"
                            }
                          >
                            {visit.cropCondition || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-400">
                            ผลผลิตภัณฑ์:{" "}
                          </span>
                          <span>{visit.productResponse || "-"}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-400">
                            ค่าใช้จ่าย:{" "}
                          </span>
                          <span>
                            {visit.totalVisitCost
                              ? `${Number(visit.totalVisitCost).toLocaleString()} บ.`
                              : "-"}
                          </span>
                        </div>
                      </div>
                      {visit.notes && (
                        <div className="text-[11px] text-slate-500 pt-0.5">
                          <span className="font-semibold">หมายเหตุ: </span>
                          {visit.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Form Section: Usage & Growth Observation */}
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                วิธีการใช้ / อัตราการใช้ <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={2}
                value={usageMethod}
                onChange={(e) => setUsageMethod(e.target.value)}
                placeholder="เช่น ฉีดพ่นทางใบ 50cc/น้ำ 20L"
                className="bg-white border-slate-300 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  อายุพืช <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={cropAgeValue}
                    onChange={(e) => setCropAgeValue?.(e.target.value)}
                    placeholder="ระบุจำนวน"
                    className="bg-white border-slate-300 text-xs"
                  />
                  <Select
                    value={cropAgeUnit}
                    onValueChange={(v) => setCropAgeUnit?.(v)}
                  >
                    <SelectTrigger className="w-28 bg-white border-slate-300 text-xs">
                      <SelectValue placeholder="หน่วย" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="วัน">วัน</SelectItem>
                      <SelectItem value="สัปดาห์">สัปดาห์</SelectItem>
                      <SelectItem value="เดือน">เดือน</SelectItem>
                      <SelectItem value="ปี">ปี</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800">
                  ระยะการเจริญเติบโต <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={growthStage}
                  onValueChange={(v) => setGrowthStage?.(v)}
                >
                  <SelectTrigger className="w-full bg-white border-slate-300 text-xs">
                    <SelectValue placeholder="เลือกระยะการเจริญเติบโต" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ระยะกล้า/ตั้งตัว">
                      ระยะกล้า/ตั้งตัว
                    </SelectItem>
                    <SelectItem value="ระยะเจริญเติบโตทางลำต้น/ใบ">
                      ระยะเจริญเติบโตทางลำต้น/ใบ
                    </SelectItem>
                    <SelectItem value="ระยะออกดอก/ติดผล">
                      ระยะออกดอก/ติดผล
                    </SelectItem>
                    <SelectItem value="ระยะเก็บเกี่ยว/พักต้น">
                      ระยะเก็บเกี่ยว/พักต้น
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">
                สภาพพืช <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["สมบูรณ์", "มีปัญหา"] as const).map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setCropCondition?.(cond)}
                    className={cn(
                      "py-2.5 px-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1",
                      cropCondition === cond
                        ? cond === "สมบูรณ์"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                          : "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    <span>{cond === "สมบูรณ์" ? "🌿" : "🔴"}</span>
                    <span>{cond}</span>
                  </button>
                ))}
              </div>
            </div>

            {cropCondition === "มีปัญหา" && (
              <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 space-y-1.5">
                <label className="text-xs font-bold text-rose-800">
                  ระบุปัญหาที่พบ (สภาพพืช){" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Textarea
                    rows={2}
                    maxLength={500}
                    value={cropProblemDescription}
                    onChange={(e) =>
                      setCropProblemDescription?.(e.target.value)
                    }
                    placeholder="ระบุปัญหาของสภาพพืช เช่น แคระเกร็ง, ใบเหลือง, โรค/แมลงศัตรูพืช ฯลฯ"
                    className="bg-white border-rose-200 pb-6 text-slate-800 text-xs"
                  />
                  <span className="absolute bottom-2 right-3 text-[10px] text-slate-400 font-mono">
                    {cropProblemDescription.length}/500
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">
                ผลการใช้ผลิตภัณฑ์ <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["พืชตอบสนองดี", "พบปัญหา"] as const).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setProductResponse?.(res)}
                    className={cn(
                      "py-2.5 px-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1",
                      productResponse === res
                        ? res === "พืชตอบสนองดี"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                          : "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    <span>{res === "พืชตอบสนองดี" ? "🟢" : "⚠️"}</span>
                    <span>{res}</span>
                  </button>
                ))}
              </div>
            </div>

            {productResponse === "พบปัญหา" && (
              <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 space-y-1.5">
                <label className="text-xs font-bold text-rose-800">
                  ระบุปัญหาที่พบ (ผลการใช้ผลิตภัณฑ์){" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Textarea
                    rows={2}
                    maxLength={500}
                    value={problemDescription}
                    onChange={(e) => setProblemDescription?.(e.target.value)}
                    placeholder="ระบุปัญหาของผลิตภัณฑ์ เช่น ใบไหม้, ตกตะกอน, ยาไม่เกิดผล ฯลฯ"
                    className="bg-white border-rose-200 pb-6 text-slate-800 text-xs"
                  />
                  <span className="absolute bottom-2 right-3 text-[10px] text-slate-400 font-mono">
                    {problemDescription.length}/500
                  </span>
                </div>
              </div>
            )}

            {/* Photos */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">
                รูปภาพสภาพแปลงล่าสุด <span className="text-rose-500">*</span>
              </label>
              <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/40 rounded-2xl p-5 text-center transition-colors cursor-pointer relative group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={onUploadImages}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-emerald-800">
                    คลิกเพื่ออัปโหลด รูปถ่ายสภาพแปลงล่าสุด
                  </p>
                </div>
              </div>
              {plotImages.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                  {plotImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square rounded-lg overflow-hidden border border-slate-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveImage(img.id)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Plot Lifecycle & Conclusion Section */}
          <div className="border-t border-emerald-200/80 pt-4 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                สถานะของแปลงสาธิต (Lifecycle Status)
              </label>
              <p className="text-xs text-slate-500">
                ระบุว่าแปลงนี้ยังต้องติดตามต่อ หรือเป็นการปิดแปลงสรุปผลสำเร็จ
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setPlotStatus?.("IN_PROGRESS")}
                className={cn(
                  "p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex flex-col items-start gap-1 text-left",
                  plotStatus === "IN_PROGRESS"
                    ? "bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                )}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <span>🟡</span>
                  <span>กำลังทดลอง / ติดตามต่อ</span>
                </div>
                <span className="text-[11px] text-slate-500 font-normal">
                  ยังไม่สิ้นสุดการทดลอง ต้องนัดติดตามรอบถัดไป
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPlotStatus?.("COMPLETED")}
                className={cn(
                  "p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex flex-col items-start gap-1 text-left",
                  plotStatus === "COMPLETED"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                )}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <span>🟢</span>
                  <span>เสร็จสิ้นและปิดแปลงสาธิต</span>
                </div>
                <span className="text-[11px] text-slate-500 font-normal">
                  เก็บเกี่ยวผลผลิตและสรุปผลสัมฤทธิ์เรียบร้อย
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPlotStatus?.("FAILED")}
                className={cn(
                  "p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex flex-col items-start gap-1 text-left",
                  plotStatus === "FAILED"
                    ? "bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                )}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <span>🔴</span>
                  <span>ยุติการทดลอง / แปลงเสียหาย</span>
                </div>
                <span className="text-[11px] text-slate-500 font-normal">
                  แปลงได้รับความเสียหายจากภัยธรรมชาติ/โรค
                </span>
              </button>
            </div>

            {/* When IN_PROGRESS: Next Follow-up Date */}
            {plotStatus === "IN_PROGRESS" && (
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                <label className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-700" />
                  กำหนดการเข้าติดตามรอบถัดไป (Next Visit Schedule)
                </label>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate?.(e.target.value)}
                  className="w-full sm:w-64 h-9 px-3 rounded-lg border border-amber-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            {/* When COMPLETED: Final Harvest & ROI Evaluation Form */}
            {plotStatus === "COMPLETED" && (
              <div className="bg-emerald-50/60 border border-emerald-300 rounded-xl p-4 space-y-3.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-900 border-b border-emerald-200/80 pb-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>
                    สรุปผลสัมฤทธิ์เมื่อปิดแปลงสาธิต (Final Yield & Evaluation)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      ผลผลิตแปลงสาธิต (กก./ไร่){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={finalYieldKg}
                      onChange={(e) =>
                        handleYieldChange(e.target.value, controlYieldKg)
                      }
                      placeholder="เช่น 1200"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      ผลผลิตแปลงควบคุม (ไม่ได้ใช้ยา)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={controlYieldKg}
                      onChange={(e) =>
                        handleYieldChange(finalYieldKg, e.target.value)
                      }
                      placeholder="เช่น 1000"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      % ผลผลิตที่เพิ่มขึ้น
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        step="0.1"
                        value={yieldIncreasePercent}
                        onChange={(e) =>
                          setYieldIncreasePercent?.(e.target.value)
                        }
                        placeholder="Auto Calc"
                        className="w-full h-9 pl-3 pr-8 rounded-lg border border-emerald-300 text-xs font-bold text-emerald-900 bg-emerald-50/50 focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="absolute right-3 text-xs font-bold text-emerald-700 pointer-events-none">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      ความพึงพอใจของเกษตรกร
                    </label>
                    <div className="flex items-center gap-1.5 h-9 bg-white border border-slate-300 rounded-lg px-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFarmerSatisfaction?.(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={cn(
                              "w-4 h-4",
                              star <= (farmerSatisfaction || 5)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300",
                            )}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-2">
                        {farmerSatisfaction === 5
                          ? "ดีเยี่ยม (5/5)"
                          : farmerSatisfaction === 4
                            ? "ดีมาก (4/5)"
                            : farmerSatisfaction === 3
                              ? "ปานกลาง (3/5)"
                              : `${farmerSatisfaction}/5`}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      โอกาสสั่งซื้อจริงหลังสาธิต (Estimated Sales)
                    </label>
                    <input
                      type="text"
                      value={commercialPotential}
                      onChange={(e) => setCommercialPotential?.(e.target.value)}
                      placeholder="เช่น พร้อมสั่งซื้อ 20 ลัง ในรอบหน้า"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    สรุปผลสัมฤทธิ์และข้อคิดเห็นของแปลง
                  </label>
                  <Textarea
                    rows={2}
                    value={finalSummaryNotes}
                    onChange={(e) => setFinalSummaryNotes?.(e.target.value)}
                    placeholder="สรุปผลการทดลอง ข้อดี-ข้อจำกัดที่พบ และคำแนะนำสำหรับพื้นที่ใกล้เคียง"
                    className="bg-white border-slate-300 text-xs"
                  />
                </div>
              </div>
            )}

            {/* When FAILED */}
            {plotStatus === "FAILED" && (
              <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                <label className="font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                  ระบุสาเหตุที่แปลงเสียหายหรือต้องยุติการทดลอง
                </label>
                <Textarea
                  rows={2}
                  value={finalSummaryNotes}
                  onChange={(e) => setFinalSummaryNotes?.(e.target.value)}
                  placeholder="ระบุสาเหตุ เช่น ประสบอุทกภัยน้ำท่วมขัง, แปลงข้างเคียงฉีดยาฆ่าหญ้าปลิวมาโดน ฯลฯ"
                  className="bg-white border-rose-200 text-slate-800 text-xs"
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
