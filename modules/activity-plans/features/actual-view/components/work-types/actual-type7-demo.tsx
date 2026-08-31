"use client";

import React, { useState } from "react";
import {
  Sprout,
  Calendar,
  Clock,
  History,
  AlertTriangle,
  PlusCircle,
  Search,
  MapPin,
  FileText,
  ImageIcon,
  Info,
  Star,
  TrendingUp,
  Sparkles,
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
import { ImageFile } from "../../types";
import { DemoPlotHistoryModal } from "./demo-plot-history-modal";
import GalleryUpload from "@/components/custom/gallery-upload";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import {
  convertToFileMetadata,
  filesWithPreviewToImageFiles,
  isImageFilesEqual,
} from "../../utils";

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
  cropProblemDesc?: string | null;
  productResponse?: string | null;
  productProblemDesc?: string | null;
  usageMethod?: string | null;
  totalVisitCost?: number | null;
  notes?: string | null;
  cropImageUrls?: string[];
  plotImageUrls?: string[];
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
  // Master Setup & Observation
  plantingDate?: string;
  setPlantingDate?: (v: string) => void;
  plantingAreaCondition?: string;
  setPlantingAreaCondition?: (v: string) => void;
  cropImages?: ImageFile[];
  setCropImages?: (imgs: ImageFile[]) => void;
  onUploadCropImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveCropImage?: (id: string) => void;
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
  setPlotImages?: (imgs: ImageFile[]) => void;
  onUploadImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: (id: string) => void;
  // Lifecycle & Evaluation Props
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
  // History and Demo Plot Master Linkage
  demoPlotData?: any;
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
  setCropImages,
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
  setPlotImages,
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
  demoPlotData,
  visitHistory = [],
  isHistoryLoading = false,
}: ActualType7DemoProps) {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  if (!isVisible) return null;

  // Determine work type from target
  const activityType =
    target.activityType || target.items?.[0]?.activityType || "CREATE";
  const isFollowUp = activityType === "FOLLOW_UP";
  const isCreate = !isFollowUp;

  const hasMultipleItems = target.items && target.items.length > 1;

  // Construct comprehensive plot data for History Modal
  const modalPlotData = demoPlotData || {
    name: plotName || `แปลงสาธิต ${target.owner || ""}`,
    ownerName: target.owner,
    targetCrop: target.crop,
    cropName: target.crop,
    primaryProductName: target.product,
    productName: target.product,
    demoProductQuantity: target.demoProductQuantity,
    areaRai: target.plots,
    startDate: startDate,
    plantingDate: plantingDate || startDate,
    plantingAreaCondition: plantingAreaCondition,
    usageMethod: usageMethod,
    objective: target.objective,
    experimentDetail: target.experimentDetail || target.detail,
    status: plotStatus,
    visits: visitHistory,
  };

  const totalVisitsCount = visitHistory.length;

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

  const handleCropFilesChange = (files: FileWithPreview[]) => {
    if (!setCropImages) return;
    const newImageFiles = filesWithPreviewToImageFiles(files);
    if (!isImageFilesEqual(cropImages, newImageFiles)) {
      setCropImages(newImageFiles);
    }
  };

  const handlePlotFilesChange = (files: FileWithPreview[]) => {
    if (!setPlotImages) return;
    const newImageFiles = filesWithPreviewToImageFiles(files);
    if (!isImageFilesEqual(plotImages, newImageFiles)) {
      setPlotImages(newImageFiles);
    }
  };

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-emerald-100 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-emerald-900 text-base md:text-lg">
              {isFollowUp ? "ติดตามแปลงสาธิต" : "ทำแปลงสาธิต (เริ่มทำแปลงใหม่)"}
            </h2>
            <p className="text-xs text-slate-500">
              {isFollowUp
                ? "บันทึกผลการเข้าตรวจแปลงเดิม ติดตามการเจริญเติบโต และประเมินสถานะแปลง"
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

      {/* Target Details from Plan (เฉพาะประเภททำแปลงสาธิตใหม่ ไม่แสดงตอนติดตามแปลง) */}
      {!isFollowUp &&
        (hasMultipleItems ? (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-600" />
                รายการแปลงสาธิตจากแผนงาน ({target.items?.length} รายการ):
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
                      <span className="font-semibold text-slate-400">
                        สินค้า:{" "}
                      </span>
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
                        item.demoProductQuantity !== "" &&
                        item.demoProductQuantity !== "-"
                          ? `${item.demoProductQuantity}`
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
                  {(item.experimentDetail ||
                    (item.detail && item.detail !== item.experimentDetail)) && (
                    <div className="pt-1 border-t border-slate-100 text-[11px] space-y-0.5">
                      {item.experimentDetail && (
                        <div>
                          <span className="font-semibold text-slate-400">
                            วิธีการทดลอง:{" "}
                          </span>
                          <span className="text-slate-700">
                            {item.experimentDetail}
                          </span>
                        </div>
                      )}
                      {item.detail &&
                        item.detail !== item.experimentDetail && (
                          <div>
                            <span className="font-semibold text-slate-400">
                              รายละเอียด:{" "}
                            </span>
                            <span className="text-slate-700">{item.detail}</span>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                ข้อมูลแปลงสาธิตจากแผนงาน
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                จากฟอร์มสร้างแผน
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-100/90 shadow-2xs">
                <span className="text-slate-400 block text-[10px] mb-0.5 font-medium">
                  เจ้าของแปลง
                </span>
                <span className="font-bold block break-words text-slate-800 text-xs">
                  {target.owner || "-"}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-100/90 shadow-2xs">
                <span className="text-slate-400 block text-[10px] mb-0.5 font-medium">
                  สินค้าที่จะสาธิต
                </span>
                <span className="font-bold block break-words text-emerald-800 text-xs">
                  {target.product || "-"}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-100/90 shadow-2xs">
                <span className="text-slate-400 block text-[10px] mb-0.5 font-medium">
                  จำนวนสินค้าที่จะสาธิต
                </span>
                <span className="font-bold block break-words text-emerald-800 text-xs">
                  {target.demoProductQuantity != null &&
                  target.demoProductQuantity !== "" &&
                  target.demoProductQuantity !== "-"
                    ? String(target.demoProductQuantity)
                    : "-"}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-100/90 shadow-2xs">
                <span className="text-slate-400 block text-[10px] mb-0.5 font-medium">
                  พืช
                </span>
                <span className="font-bold block break-words text-slate-800 text-xs">
                  {target.crop || "-"}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-100/90 shadow-2xs">
                <span className="text-slate-400 block text-[10px] mb-0.5 font-medium">
                  พื้นที่ / จำนวนต้น
                </span>
                <span className="font-bold block break-words text-slate-800 text-xs">
                  {target.plots || "-"}
                </span>
              </div>
              {(target.experimentDetail || target.detail) && (
                <div className="bg-white p-2.5 rounded-lg border border-slate-100/90 shadow-2xs sm:col-span-2 md:col-span-3">
                  <span className="text-slate-400 block text-[10px] mb-0.5 font-medium">
                    รายละเอียด / วิธีการทดลอง
                  </span>
                  <span className="font-medium block break-words whitespace-pre-wrap text-slate-700 text-xs">
                    {target.experimentDetail || target.detail}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

      {/* ========================================================================= */}
      {/* CASE A: ประเภทงาน = "ทำแปลงสาธิต" (CREATE - เริ่มทำแปลงใหม่)                 */}
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
                  value={plantingDate || startDate}
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
                <GalleryUpload
                  maxFiles={10}
                  maxSize={20 * 1024 * 1024}
                  accept="image/*"
                  multiple={true}
                  initialFiles={convertToFileMetadata(cropImages)}
                  onFilesChange={handleCropFilesChange}
                />
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
                <GalleryUpload
                  maxFiles={10}
                  maxSize={20 * 1024 * 1024}
                  accept="image/*"
                  multiple={true}
                  initialFiles={convertToFileMetadata(plotImages)}
                  onFilesChange={handlePlotFilesChange}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CASE B: ประเภทงาน = "ติดตามแปลงสาธิต" (FOLLOW_UP - ติดตามแปลงเดิม)          */}
      {/* ========================================================================= */}
      {isFollowUp && (
        <div className="space-y-5 pt-1">
          {/* 1. Master Setup Reference Card */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl overflow-hidden shadow-2xs">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between bg-emerald-100/70 border-b border-emerald-200 px-4 py-2.5 gap-2">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ข้อมูลอ้างอิงของแปลงสาธิต
              </span>
              <div className="flex items-center gap-2">
                {demoPlotData?.code && (
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-white text-slate-600 border border-slate-200">
                    {demoPlotData.code}
                  </span>
                )}
                {/* View History Button */}
                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all hover:shadow cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>ประวัติการติดตาม ({totalVisitsCount} ครั้ง)</span>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Row 1: เจ้าของ, พืช, สินค้า, จำนวนสินค้า */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2.5 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">เจ้าของแปลง</span>
                  <span className="font-bold text-slate-900 block">{target.owner || demoPlotData?.ownerName || "-"}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">พืช</span>
                  <span className="font-bold text-slate-900 block">{target.crop || demoPlotData?.cropName || "-"}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">สินค้าสาธิต</span>
                  <span className="font-bold text-emerald-800 block">
                    {target.product || demoPlotData?.primaryProductName || demoPlotData?.productName || "-"}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">จำนวนสินค้าสาธิต</span>
                  <span className="font-bold text-emerald-800 block">
                    {demoPlotData?.demoProductQuantity != null &&
                    demoPlotData?.demoProductQuantity !== "" &&
                    demoPlotData?.demoProductQuantity !== "-"
                      ? String(demoPlotData.demoProductQuantity)
                      : demoPlotData?.plotCount != null &&
                        demoPlotData?.plotCount !== "" &&
                        demoPlotData?.plotCount !== "-"
                        ? String(demoPlotData.plotCount)
                        : target.demoProductQuantity != null &&
                          target.demoProductQuantity !== "" &&
                          target.demoProductQuantity !== "-"
                          ? String(target.demoProductQuantity)
                          : "-"}
                  </span>
                </div>
              </div>

              {/* Row 2: วันเริ่มแปลง, พื้นที่, สภาพพื้นที่ */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 text-xs border-t border-emerald-200/50 pt-2.5">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">วันเริ่มแปลง / วันปลูก</span>
                  <span className="font-bold text-slate-900 block">
                    {plantingDate || demoPlotData?.plantingDate || startDate || demoPlotData?.startDate || "-"}
                  </span>
                </div>
                {(target.plots || demoPlotData?.areaRai != null || demoPlotData?.treeCount != null) && (
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">พื้นที่ / จำนวนต้น</span>
                    <span className="font-bold text-slate-900 block">
                      {target.plots ||
                        (demoPlotData?.areaRai ? `${demoPlotData.areaRai} ไร่` : "") ||
                        (demoPlotData?.treeCount ? `${demoPlotData.treeCount} ต้น` : "") ||
                        "-"}
                    </span>
                  </div>
                )}
                {plantingAreaCondition && (
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">สภาพพื้นที่ตอนเริ่ม</span>
                    <span className="font-medium text-slate-800 block">{plantingAreaCondition}</span>
                  </div>
                )}
              </div>

              {/* Row 3: วัตถุประสงค์ */}
              {(demoPlotData?.objective || (target.objective && target.objective !== target.detail)) && (
                <div className="border-t border-emerald-200/50 pt-2.5 space-y-0.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">วัตถุประสงค์ของแปลง</span>
                  <p className="text-xs text-slate-800 leading-relaxed">{demoPlotData?.objective || target.objective}</p>
                </div>
              )}

              {/* Row 4: สิ่งที่ตั้งใจจะมาติดตาม */}
              {target.detail &&
                target.detail !== demoPlotData?.experimentDetail &&
                target.detail !== target.objective && (
                  <div className="bg-amber-50/70 border border-amber-200/60 rounded-lg px-3 py-2.5 space-y-0.5">
                    <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1 block">
                      <Sprout className="w-3 h-3" />
                      สิ่งที่ตั้งใจมาติดตามรอบนี้ (จากแผนงาน)
                    </span>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{target.detail}</p>
                  </div>
                )}
            </div>
          </div>

          {/* 3. Follow-up Observation Form for this Visit */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-2">
              <Sprout className="w-4 h-4 text-emerald-600" />
              <span>บันทึกผลการติดตามรอบนี้ (Visit Observation)</span>
            </div>

            {/* อายุพืช & ระยะการเจริญเติบโต */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>อายุพืช</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={cropAgeValue}
                    onChange={(e) => setCropAgeValue?.(e.target.value)}
                    placeholder="เช่น 15"
                    className="flex-1 bg-white border-slate-300 text-xs"
                  />
                  <Select
                    value={cropAgeUnit}
                    onValueChange={(val) => setCropAgeUnit?.(val)}
                  >
                    <SelectTrigger className="w-[100px] bg-white border-slate-300 text-xs">
                      <SelectValue placeholder="หน่วย" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="วัน">วัน</SelectItem>
                      <SelectItem value="สัปดาห์">สัปดาห์</SelectItem>
                      <SelectItem value="เดือน">เดือน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-emerald-600" />
                  <span>ระยะการเจริญเติบโต</span>
                  <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  value={growthStage}
                  onChange={(e) => setGrowthStage?.(e.target.value)}
                  placeholder="เช่น แตกใบอ่อน, กำลังออกดอก, ติดผลเล็ก"
                  className="bg-white border-slate-300 text-xs"
                />
              </div>
            </div>

            {/* สภาพพืช & ผลการใช้ผลิตภัณฑ์ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* สภาพพืช */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <span>สภาพพืช</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="cropCondition"
                      value="สมบูรณ์"
                      checked={cropCondition === "สมบูรณ์"}
                      onChange={() => setCropCondition?.("สมบูรณ์")}
                      className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>สมบูรณ์</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="cropCondition"
                      value="มีปัญหา"
                      checked={cropCondition === "มีปัญหา"}
                      onChange={() => setCropCondition?.("มีปัญหา")}
                      className="text-rose-600 focus:ring-rose-500 h-4 w-4"
                    />
                    <span>มีปัญหา</span>
                  </label>
                </div>
                {cropCondition === "มีปัญหา" && (
                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-medium text-slate-600">
                      ระบุปัญหาที่พบ (สภาพพืช){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={cropProblemDescription}
                      onChange={(e) =>
                        setCropProblemDescription?.(e.target.value)
                      }
                      placeholder="เช่น ใบเหลือง, มีโรคแคงเกอร์, แมลงระบาด"
                      className="bg-white border-slate-300 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* ผลการใช้ผลิตภัณฑ์ */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <span>ผลการใช้ผลิตภัณฑ์</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="productResponse"
                      value="พืชตอบสนองดี"
                      checked={productResponse === "พืชตอบสนองดี"}
                      onChange={() => setProductResponse?.("พืชตอบสนองดี")}
                      className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>พืชตอบสนองดี</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="productResponse"
                      value="พบปัญหา"
                      checked={productResponse === "พบปัญหา"}
                      onChange={() => setProductResponse?.("พบปัญหา")}
                      className="text-rose-600 focus:ring-rose-500 h-4 w-4"
                    />
                    <span>พบปัญหา</span>
                  </label>
                </div>
                {productResponse === "พบปัญหา" && (
                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-medium text-slate-600">
                      ระบุปัญหาที่พบ (ผลการใช้ผลิตภัณฑ์){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={problemDescription}
                      onChange={(e) => setProblemDescription?.(e.target.value)}
                      placeholder="เช่น เกิดอาการใบไหม้, ไม่เห็นความเปลี่ยนแปลง"
                      className="bg-white border-slate-300 text-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* วิธีใช้รอบนี้ */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800">
                วิธีการใช้ / อัตราการใช้รอบนี้ (ถ้ามีการปรับปรุง)
              </label>
              <Textarea
                rows={2}
                value={usageMethod}
                onChange={(e) => setUsageMethod(e.target.value)}
                placeholder="เช่น ฉีดพ่นซ้ำ 50cc/น้ำ 20L ทุก 7 วัน"
                className="bg-white border-slate-300 text-xs"
              />
            </div>
          </div>

          {/* รูปภาพการติดตามรอบนี้ */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-200/80 pb-2">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>รูปภาพจากการติดตามรอบนี้ (Visit Photos)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. รูปสภาพพืชรอบนี้ */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sprout className="w-4 h-4 text-emerald-600" />
                    <span>รูปสภาพพืช (รอบนี้)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    (ถ่ายต้นพืช/ใบ/ดอก)
                  </span>
                </label>
                <GalleryUpload
                  maxFiles={10}
                  maxSize={20 * 1024 * 1024}
                  accept="image/*"
                  multiple={true}
                  initialFiles={convertToFileMetadata(cropImages)}
                  onFilesChange={handleCropFilesChange}
                />
              </div>

              {/* 2. รูปภาพสภาพแปลงรอบนี้ */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>รูปภาพสภาพแปลง (รอบนี้)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    (ภาพรวมพื้นที่แปลง)
                  </span>
                </label>
                <GalleryUpload
                  maxFiles={10}
                  maxSize={20 * 1024 * 1024}
                  accept="image/*"
                  multiple={true}
                  initialFiles={convertToFileMetadata(plotImages)}
                  onFilesChange={handlePlotFilesChange}
                />
              </div>
            </div>
          </div>

          {/* 4. สถานะของแปลงสาธิต (Lifecycle Status & Plot Closing Evaluation) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>สถานะของแปลงสาธิต (Lifecycle Status)</span>
              </div>
              <span className="text-[11px] text-slate-400">
                ระบุสถานะความคืบหน้าของแปลง
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setPlotStatus?.("IN_PROGRESS")}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer",
                  plotStatus === "IN_PROGRESS"
                    ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white",
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0",
                    plotStatus === "IN_PROGRESS"
                      ? "border-amber-600 bg-amber-600 text-white"
                      : "border-slate-300",
                  )}
                >
                  {plotStatus === "IN_PROGRESS" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-800">
                    กำลังติดตามต่อเนื่อง
                  </div>
                  <div className="text-[11px] text-slate-500">
                    ยังไม่สิ้นสุดการทดลอง มีรอบติดตามต่อ
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPlotStatus?.("COMPLETED")}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer",
                  plotStatus === "COMPLETED"
                    ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white",
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0",
                    plotStatus === "COMPLETED"
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-300",
                  )}
                >
                  {plotStatus === "COMPLETED" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-800">
                    ปิดแปลงสมบูรณ์
                  </div>
                  <div className="text-[11px] text-slate-500">
                    เก็บเกี่ยวผลผลิต/สิ้นสุดการทดลองสำเร็จ
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPlotStatus?.("FAILED")}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer",
                  plotStatus === "FAILED"
                    ? "border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white",
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0",
                    plotStatus === "FAILED"
                      ? "border-rose-600 bg-rose-600 text-white"
                      : "border-slate-300",
                  )}
                >
                  {plotStatus === "FAILED" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-800">
                    ยุติการทดลอง
                  </div>
                  <div className="text-[11px] text-slate-500">
                    พืชเสียหาย/ภัยธรรมชาติ/ยกเลิก
                  </div>
                </div>
              </button>
            </div>

            {/* Condition 1: IN_PROGRESS -> Next Follow-up Date */}
            {plotStatus === "IN_PROGRESS" && (
              <div className="pt-2 border-t border-slate-100">
                <div className="max-w-xs space-y-1.5">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>กำหนดการติดตามครั้งถัดไป</span>
                  </label>
                  <Input
                    type="date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate?.(e.target.value)}
                    className="bg-white border-slate-300 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Condition 2: COMPLETED -> Harvest & Final Evaluation Form */}
            {plotStatus === "COMPLETED" && (
              <div className="pt-3 border-t border-emerald-100 space-y-4 bg-emerald-50/30 -mx-4 md:-mx-5 -mb-4 md:-mb-5 p-4 md:p-5 rounded-b-xl">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>
                    แบบประเมินผลผลิตและผลสัมฤทธิ์ของแปลงสาธิต (Harvest
                    Evaluation)
                  </span>
                </div>

                {/* Yield comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      ผลผลิตแปลงสาธิต (กก./ไร่)
                    </label>
                    <Input
                      type="number"
                      value={finalYieldKg}
                      onChange={(e) =>
                        handleYieldChange(e.target.value, controlYieldKg)
                      }
                      placeholder="เช่น 3500"
                      className="bg-white border-slate-300 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      ผลผลิตแปลงควบคุม (กก./ไร่)
                    </label>
                    <Input
                      type="number"
                      value={controlYieldKg}
                      onChange={(e) =>
                        handleYieldChange(finalYieldKg, e.target.value)
                      }
                      placeholder="เช่น 2800"
                      className="bg-white border-slate-300 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-emerald-800">
                      % ผลผลิตที่เพิ่มขึ้น (คำนวณอัตโนมัติ)
                    </label>
                    <div className="h-9 px-3 bg-emerald-100/80 border border-emerald-300 rounded-md flex items-center font-bold text-xs text-emerald-900">
                      {yieldIncreasePercent ? `+${yieldIncreasePercent}%` : "-"}
                    </div>
                  </div>
                </div>

                {/* Farmer Satisfaction & Commercial Potential */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      ความพึงพอใจของเกษตรกร (1-5 ดาว)
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFarmerSatisfaction?.(star)}
                          className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={cn(
                              "w-5 h-5",
                              star <= farmerSatisfaction
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300",
                            )}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-600 ml-2">
                        {farmerSatisfaction} / 5 คะแนน
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      โอกาสในการสั่งซื้อจริงของเกษตรกร/พื้นที่ใกล้เคียง
                    </label>
                    <Input
                      type="text"
                      value={commercialPotential}
                      onChange={(e) => setCommercialPotential?.(e.target.value)}
                      placeholder="เช่น มีแนวโน้มสั่งซื้อ 20 ลัง ในฤดูกาลหน้า"
                      className="bg-white border-slate-300 text-xs"
                    />
                  </div>
                </div>

                {/* Final Summary Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    สรุปผลสัมฤทธิ์ของแปลงสาธิต / ข้อคิดเห็นของทีมงาน
                  </label>
                  <Textarea
                    rows={2}
                    value={finalSummaryNotes}
                    onChange={(e) => setFinalSummaryNotes?.(e.target.value)}
                    placeholder="ระบุจุดเด่น ข้อเปรียบเทียบ ความคุ้มค่า หรือปัญหาที่พบตลอดการทดลอง"
                    className="bg-white border-slate-300 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Condition 3: FAILED -> Reason */}
            {plotStatus === "FAILED" && (
              <div className="pt-3 border-t border-rose-100 space-y-2 bg-rose-50/40 -mx-4 md:-mx-5 -mb-4 md:-mb-5 p-4 md:p-5 rounded-b-xl">
                <label className="text-xs font-semibold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>สาเหตุที่ยุติการทดลอง / ปัญหาที่ไม่สามารถแก้ไขได้</span>
                </label>
                <Textarea
                  rows={2}
                  value={finalSummaryNotes}
                  onChange={(e) => setFinalSummaryNotes?.(e.target.value)}
                  placeholder="ระบุสาเหตุ เช่น น้ำท่วมแปลงทดลอง, เกษตรกรไถทิ้ง, โรคระบาดรุนแรงนอกเหนือการควบคุม"
                  className="bg-white border-rose-300 text-xs"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Modal */}
      <DemoPlotHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        plot={modalPlotData}
      />
    </div>
  );
}
