"use client";

import React, { useState } from "react";
import {
  Sprout,
  Clock,
  History,
  Search,
  ImageIcon,
  Star,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DemoPlotStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { ImageFile } from "@/modules/activity-plans/features/actual-view/types";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";
import { DemoPlotHistoryModal } from "@/modules/activity-plans/features/actual-view/components/work-types/demo-plot-history-modal";
import GalleryUpload from "@/components/custom/gallery-upload";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import {
  convertToFileMetadata,
  filesWithPreviewToImageFiles,
  isImageFilesEqual,
} from "@/modules/activity-plans/features/actual-view/utils";

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
    code?: string;
    title?: string;
  };
}

export interface ActualType7FollowUpProps {
  target: {
    activityType?: string;
    owner: string;
    product: string;
    crop: string;
    plots: string;
    targetCondition?: string;
    demoProductQuantity?: string | number | null;
    objective?: string;
    experimentDetail?: string;
    detail?: string;
  };
  plotName: string;
  usageMethod: string;
  setUsageMethod: (v: string) => void;
  cropImages?: ImageFile[];
  setCropImages?: (imgs: ImageFile[]) => void;
  plotImages?: ImageFile[];
  setPlotImages?: (imgs: ImageFile[]) => void;
  cropAgeValue?: string;
  setCropAgeValue?: (v: string) => void;
  cropAgeUnit?: string;
  setCropAgeUnit?: (v: string) => void;
  growthStage?: string;
  setGrowthStage?: (v: string) => void;
  cropCondition?: string;
  setCropCondition?: (v: any) => void;
  cropProblemDesc?: string;
  setCropProblemDesc?: (v: string) => void;
  cropProblemDescription?: string;
  setCropProblemDescription?: (v: string) => void;
  productResponse?: string;
  setProductResponse?: (v: any) => void;
  problemDescription?: string;
  setProblemDescription?: (v: string) => void;
  plotStatus?: DemoPlotStatus;
  setPlotStatus?: (v: any) => void;
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
  demoPlotData?: any;
  visitHistory?: DemoPlotVisitHistoryItem[];
  startDate?: string;
}

export function ActualType7FollowUp({
  target,
  plotName,
  usageMethod,
  setUsageMethod,
  cropImages = [],
  setCropImages,
  plotImages = [],
  setPlotImages,
  cropAgeValue = "",
  setCropAgeValue,
  cropAgeUnit = "วัน",
  setCropAgeUnit,
  growthStage = "",
  setGrowthStage,
  cropCondition = "สมบูรณ์",
  setCropCondition,
  cropProblemDesc = "",
  setCropProblemDesc,
  cropProblemDescription = "",
  setCropProblemDescription,
  productResponse = "พืชตอบสนองดี",
  setProductResponse,
  problemDescription = "",
  setProblemDescription,
  plotStatus = DemoPlotStatus.IN_PROGRESS,
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
  commercialPotential = "สูงมาก",
  setCommercialPotential,
  finalSummaryNotes = "",
  setFinalSummaryNotes,
  demoPlotData,
  visitHistory = [],
  startDate = "",
}: ActualType7FollowUpProps) {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const effectiveCropProblemDesc =
    cropProblemDesc || cropProblemDescription || "";
  const handleCropProblemDescChange = (val: string) => {
    setCropProblemDesc?.(val);
    setCropProblemDescription?.(val);
  };

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
    usageMethod: usageMethod,
    objective: target.objective,
    experimentDetail: target.experimentDetail || target.detail,
    status: plotStatus,
    visits: visitHistory,
  };

  const totalVisitsCount = visitHistory.length;

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
    <div className="border border-blue-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-blue-100 pb-3 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-blue-900 text-base md:text-lg">
              ติดตามแปลงสาธิต (Follow-up Demo Plot)
            </h2>
            <p className="text-xs text-slate-500">
              บันทึกผลการเข้าตรวจแปลงเดิม ติดตามการเจริญเติบโต และประเมินสถานะแปลง
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs bg-blue-50 text-blue-800 border border-blue-200">
            <Search className="w-3.5 h-3.5 text-blue-600" />
            <span>ประเภท: ติดตามแปลงสาธิต</span>
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsHistoryModalOpen(true)}
            className="h-8 gap-1.5 text-xs text-blue-700 border-blue-200 bg-blue-50/50 hover:bg-blue-100 font-semibold"
          >
            <History className="w-3.5 h-3.5" />
            <span>ดูประวัติการติดตาม ({totalVisitsCount} ครั้ง)</span>
          </Button>
        </div>
      </div>

      {/* SECTION 1: PLANNED TARGET CARD */}
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

      {/* SECTION 2: OBSERVATIONS & CROP HEALTH */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
          <Clock className="w-4 h-4 text-blue-700" />
          <h3 className="text-sm font-bold text-slate-800">
            ผลการตรวจสภาพพืชและการเจริญเติบโต (Observation)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* อายุพืช */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              อายุพืช <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={0}
                value={cropAgeValue}
                onChange={(e) => setCropAgeValue?.(e.target.value)}
                placeholder="เช่น 30"
                className="h-9 text-xs bg-white border-slate-200 rounded-lg flex-1"
              />
              <Select
                value={cropAgeUnit}
                onValueChange={(v) => setCropAgeUnit?.(v)}
              >
                <SelectTrigger className="w-24 h-9 text-xs bg-white border-slate-200 rounded-lg">
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

          {/* ระยะการเจริญเติบโต */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              ระยะการเจริญเติบโต <span className="text-red-500">*</span>
            </label>
            <Select
              value={growthStage}
              onValueChange={(v) => setGrowthStage?.(v)}
            >
              <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg">
                <SelectValue placeholder="เลือกระยะการเจริญเติบโต" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ระยะต้นกล้า/แตกยอด">
                  ระยะต้นกล้า / แตกยอด
                </SelectItem>
                <SelectItem value="ระยะเจริญเติบโตทางลำต้น/ใบ">
                  ระยะเจริญเติบโตทางลำต้น / ใบ
                </SelectItem>
                <SelectItem value="ระยะออกดอก/ติดผลอ่อน">
                  ระยะออกดอก / ติดผลอ่อน
                </SelectItem>
                <SelectItem value="ระยะขยายขนาดผล/สะสมอาหาร">
                  ระยะขยายขนาดผล / สะสมอาหาร
                </SelectItem>
                <SelectItem value="ระยะใกล้เก็บเกี่ยว/สุกแก่">
                  ระยะใกล้เก็บเกี่ยว / สุกแก่
                </SelectItem>
                <SelectItem value="หลังเก็บเกี่ยว/พักฟื้นต้น">
                  หลังเก็บเกี่ยว / พักฟื้นต้น
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* สภาพความสมบูรณ์ของพืช */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              สภาพความสมบูรณ์ของพืช <span className="text-red-500">*</span>
            </label>
            <Select
              value={cropCondition}
              onValueChange={(v) => setCropCondition?.(v)}
            >
              <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg font-medium">
                <SelectValue placeholder="เลือกสภาพพืช" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="สมบูรณ์">🌿 สมบูรณ์ (ดีมาก)</SelectItem>
                <SelectItem value="ไม่เปลี่ยนแปลง">
                  ⚖️ ไม่เปลี่ยนแปลง (ปานกลาง)
                </SelectItem>
                <SelectItem value="มีปัญหา">
                  ⚠️ มีปัญหา (พบโรค/แมลง/ธาตุอาหาร)
                </SelectItem>
                <SelectItem value="ทรุดโทรม">
                  🍂 ทรุดโทรม (เสียหายหนัก)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {cropCondition === "มีปัญหา" || cropCondition === "ทรุดโทรม" ? (
          <div className="space-y-1.5 p-3 bg-red-50/60 border border-red-200 rounded-xl">
            <label className="block text-xs font-bold text-red-800">
              ระบุปัญหาของพืชที่พบ <span className="text-red-500">*</span>
            </label>
            <Textarea
              rows={2}
              value={effectiveCropProblemDesc}
              onChange={(e) => handleCropProblemDescChange(e.target.value)}
              placeholder="ระบุอาการ ใบหงิก รากเน่า แมลงระบาด..."
              className="text-xs bg-white border-red-300 rounded-lg"
            />
          </div>
        ) : null}

        {/* ผลการตอบสนองต่อผลิตภัณฑ์ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              การตอบสนองต่อผลิตภัณฑ์ที่สาธิต{" "}
              <span className="text-red-500">*</span>
            </label>
            <Select
              value={productResponse}
              onValueChange={(v) => setProductResponse?.(v)}
            >
              <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg font-medium">
                <SelectValue placeholder="เลือกผลการตอบสนอง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="พืชตอบสนองดี">
                  ✨ พืชตอบสนองดี (เห็นผลชัดเจน)
                </SelectItem>
                <SelectItem value="ยังไม่เห็นผลชัดเจน">
                  ⏱️ ยังไม่เห็นผลชัดเจน (ต้องติดตามต่อ)
                </SelectItem>
                <SelectItem value="พบปัญหา">
                  ❌ พบปัญหาจากการใช้ (เช่น ใบไหม้ ยาตกตะกอน)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              วิธีการใช้สาร / สูตรยาในรอบนี้
            </label>
            <Input
              value={usageMethod}
              onChange={(e) => setUsageMethod(e.target.value)}
              placeholder="ระบุอัตราการใช้และวิธีการฉีดพ่นในรอบนี้..."
              className="h-9 text-xs bg-white border-slate-200 rounded-lg"
            />
          </div>
        </div>

        {productResponse === "พบปัญหา" && (
          <div className="space-y-1.5 p-3 bg-red-50/60 border border-red-200 rounded-xl">
            <label className="block text-xs font-bold text-red-800">
              ระบุปัญหาของผลิตภัณฑ์ที่พบ <span className="text-red-500">*</span>
            </label>
            <Textarea
              rows={2}
              value={problemDescription}
              onChange={(e) => setProblemDescription?.(e.target.value)}
              placeholder="ระบุปัญหาผลิตภัณฑ์..."
              className="text-xs bg-white border-red-300 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* SECTION 3: INSPECTION PHOTOS */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
          <ImageIcon className="w-4 h-4 text-blue-700" />
          <h3 className="text-sm font-bold text-slate-800">
            ภาพถ่ายการติดตามแปลง (Inspection Photos)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-800 block">
              1. ภาพถ่ายสภาพพืชรอบนี้
            </span>
            <GalleryUpload
              initialFiles={convertToFileMetadata(cropImages)}
              onFilesChange={handleCropFilesChange}
              maxFiles={5}
            />
          </div>

          <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-800 block">
              2. ภาพถ่ายสภาพแปลงโดยรวม
            </span>
            <GalleryUpload
              initialFiles={convertToFileMetadata(plotImages)}
              onFilesChange={handlePlotFilesChange}
              maxFiles={5}
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: PLOT STATUS & FINAL YIELD EVALUATION */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-700" />
            <h3 className="text-sm font-bold text-slate-800">
              สถานะแปลงและการประเมินผล
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              สถานะแปลงหลังการตรวจรอบนี้ <span className="text-red-500">*</span>
            </label>
            <Select
              value={plotStatus}
              onValueChange={(v: DemoPlotStatus) => setPlotStatus?.(v)}
            >
              <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg font-medium">
                <SelectValue placeholder="เลือกสถานะแปลง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DemoPlotStatus.IN_PROGRESS}>
                  🔄 อยู่ระหว่างการทดลอง (ต้องติดตามต่อ)
                </SelectItem>
                <SelectItem value={DemoPlotStatus.COMPLETED}>
                  ✅ เก็บเกี่ยว / สิ้นสุดการทดลอง (ปิดแปลง)
                </SelectItem>
                <SelectItem value={DemoPlotStatus.FAILED}>
                  ❌ ยุติการทดลอง (แปลงเสียหาย / ล้มเหลว)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {plotStatus === DemoPlotStatus.IN_PROGRESS && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                กำหนดการติดตามครั้งถัดไป (Next Follow-up)
              </label>
              <Input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate?.(e.target.value)}
                className="h-9 text-xs bg-white border-slate-200 rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Final Harvest Evaluation (เมื่อเลือก ปิดแปลง COMPLETED) */}
        {plotStatus === DemoPlotStatus.COMPLETED && (
          <div className="pt-3 border-t border-emerald-200/80 space-y-4 bg-emerald-50/40 p-4 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                สรุปผลการเก็บเกี่ยวและความพึงพอใจของเกษตรกร
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  ผลผลิตแปลงสาธิต (กก./ไร่)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={finalYieldKg}
                  onChange={(e) =>
                    handleYieldChange(e.target.value, controlYieldKg)
                  }
                  placeholder="เช่น 1200"
                  className="h-9 text-xs bg-white border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  ผลผลิตแปลงควบคุม (กก./ไร่)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={controlYieldKg}
                  onChange={(e) =>
                    handleYieldChange(finalYieldKg, e.target.value)
                  }
                  placeholder="เช่น 1000"
                  className="h-9 text-xs bg-white border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-emerald-800">
                  ผลผลิตเพิ่มขึ้น (%)
                </label>
                <div className="h-9 px-3 rounded-lg border border-emerald-200 bg-emerald-50 flex items-center font-bold text-emerald-800 text-xs">
                  {yieldIncreasePercent ? `+${yieldIncreasePercent} %` : "-"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  ความพึงพอใจของเกษตรกร (1 - 5 ดาว)
                </label>
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFarmerSatisfaction?.(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={cn(
                          "w-5 h-5",
                          star <= (farmerSatisfaction || 0)
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300",
                        )}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {farmerSatisfaction} / 5 ดาว
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  โอกาสในการขยายผลเชิงพาณิชย์
                </label>
                <Select
                  value={commercialPotential}
                  onValueChange={(v) => setCommercialPotential?.(v)}
                >
                  <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg font-medium">
                    <SelectValue placeholder="เลือกโอกาสขยายผล" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="สูงมาก">🔥 สูงมาก (เกษตรกรสั่งซื้อทันที)</SelectItem>
                    <SelectItem value="ปานกลาง">⚡ ปานกลาง (รอผลแปลงข้างเคียง)</SelectItem>
                    <SelectItem value="ต่ำ">❄️ ต่ำ (ยังไม่เหมาะกับพื้นที่)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                สรุปภาพรวมและข้อเสนอแนะในการทำแปลง
              </label>
              <Textarea
                rows={2}
                value={finalSummaryNotes}
                onChange={(e) => setFinalSummaryNotes?.(e.target.value)}
                placeholder="สรุปจุดเด่น ปัญหา และข้อควรระวังเพื่อนำไปแนะนำเกษตรกรรายอื่น..."
                className="text-xs bg-white border-slate-200 rounded-lg"
              />
            </div>
          </div>
        )}
      </div>

      {/* History Modal */}
      <DemoPlotHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        plot={modalPlotData}
      />
    </div>
  );
}
