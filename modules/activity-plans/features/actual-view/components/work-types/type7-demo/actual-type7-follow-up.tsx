"use client";

import React, { useState, useEffect } from "react";
import {
  Sprout,
  Clock,
  History,
  Search,
  ImageIcon,
  Star,
  TrendingUp,
  Sparkles,
  MapPin,
  Droplets,
  FlaskConical,
  Layers,
  Package,
  Plus,
  Trash2,
  Calendar,
  Wrench,
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
import type { DemoPlotStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  ImageFile,
  DemoPlotExternalProductItem,
  Type7bProductRateItem,
} from "@/modules/activity-plans/features/actual-view/types";
import {
  DEMO_PLOT_SPRAY_METHODS,
  EXTERNAL_CHEMICAL_FORMULAS,
  DEMO_PLOT_SPRAY_EQUIPMENTS,
} from "@/modules/activity-plans/constants";
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
  sprayMethod?: string | null;
  sprayEquipment?: string | null;
  otherEquipment?: string | null;
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

  // 1. วันที่ติดตามจริง
  actualStartDate?: string;
  setActualStartDate?: (v: string) => void;

  // 2. จำนวนวันหลังฉีดพ่น
  daysAfterSpray?: string | number;
  setDaysAfterSpray?: (v: string) => void;

  // 3. ผลหลังการฉีดพ่น
  productResponse?: string;
  setProductResponse?: (v: any) => void;
  problemDescription?: string;
  setProblemDescription?: (v: string) => void;

  // 4. รูปผลหลังการฉีดพ่น (max 5)
  cropImages?: ImageFile[];
  setCropImages?: (imgs: ImageFile[]) => void;

  // 5. อัตราการฉีดพ่นแยกตามแต่ละตัวยา
  bProductRates?: Type7bProductRateItem[];
  setBProductRates?: (items: Type7bProductRateItem[]) => void;

  // 6. วิธีการฉีดพ่น & สารเคมีภายนอก
  sprayMethod?: "SINGLE" | "TANK_MIXED";
  setSprayMethod?: (v: "SINGLE" | "TANK_MIXED") => void;
  hasExternalChemicals?: boolean;
  setHasExternalChemicals?: (v: boolean) => void;
  externalProducts?: DemoPlotExternalProductItem[];
  setExternalProducts?: (items: DemoPlotExternalProductItem[]) => void;

  // 7. อุปกรณ์ที่ใช้ฉีดพ่น
  sprayEquipment?: string;
  setSprayEquipment?: (v: string) => void;
  otherEquipment?: string;
  setOtherEquipment?: (v: string) => void;

  // 8. วันที่นัดหมายครั้งถัดไป (Label: กำหนดฉีดพ่นครั้งต่อไป)
  nextSprayDate?: string;
  setNextSprayDate?: (v: string) => void;
  nextFollowUpDate?: string;
  setNextFollowUpDate?: (v: string) => void;

  // 9. รูปการฉีดพ่น (max 5)
  plotImages?: ImageFile[];
  setPlotImages?: (imgs: ImageFile[]) => void;

  // Additional / Observation fields
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

  // Status & Final Yield
  plotStatus?: DemoPlotStatus;
  setPlotStatus?: (v: any) => void;
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
  actualStartDate = "",
  setActualStartDate,
  daysAfterSpray = "",
  setDaysAfterSpray,
  productResponse = "พืชตอบสนองดี",
  setProductResponse,
  problemDescription = "",
  setProblemDescription,
  cropImages = [],
  setCropImages,
  bProductRates = [],
  setBProductRates,
  sprayMethod = "SINGLE",
  setSprayMethod,
  hasExternalChemicals = false,
  setHasExternalChemicals,
  externalProducts = [],
  setExternalProducts,
  sprayEquipment = "โดรน",
  setSprayEquipment,
  otherEquipment = "",
  setOtherEquipment,
  nextSprayDate = "",
  setNextSprayDate,
  nextFollowUpDate = "",
  setNextFollowUpDate,
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
  plotStatus = "IN_PROGRESS" as DemoPlotStatus,
  setPlotStatus,
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

  // Initialize or merge products list from demoPlotData.demoProducts into bProductRates
  useEffect(() => {
    if (demoPlotData?.demoProducts && demoPlotData.demoProducts.length > 0) {
      const currentRates = bProductRates || [];
      const missing = demoPlotData.demoProducts.filter(
        (dp: any) => !currentRates.some((r) => r.productId === dp.productId),
      );
      if (missing.length > 0) {
        const merged: Type7bProductRateItem[] = [
          ...currentRates,
          ...missing.map((dp: any) => ({
            productId: dp.productId,
            productName: dp.product?.name || dp.productName || "สินค้าสาธิต",
            baselineRate: dp.applicationRate || "",
            actualRate: "",
          })),
        ];
        setBProductRates?.(merged);
      }
    }
  }, [demoPlotData?.demoProducts, bProductRates, setBProductRates]);

  // Auto calculate days after spray from initialSprayDate and actualStartDate if not yet set
  useEffect(() => {
    if (
      (daysAfterSpray === "" || daysAfterSpray == null) &&
      demoPlotData?.initialSprayDate &&
      actualStartDate
    ) {
      const dSpray = new Date(demoPlotData.initialSprayDate).getTime();
      const dVisit = new Date(actualStartDate).getTime();
      if (!isNaN(dSpray) && !isNaN(dVisit)) {
        const diff = Math.max(
          0,
          Math.floor((dVisit - dSpray) / (1000 * 60 * 60 * 24)),
        );
        setDaysAfterSpray?.(String(diff));
      }
    }
  }, [
    demoPlotData?.initialSprayDate,
    actualStartDate,
    daysAfterSpray,
    setDaysAfterSpray,
  ]);

  const handleProductRateChange = (productId: string, val: string) => {
    if (!bProductRates) return;
    const updated = bProductRates.map((item) =>
      item.productId === productId ? { ...item, actualRate: val } : item,
    );
    setBProductRates?.(updated);
  };

  // External Products Handlers (Same as actual-type7-new-demo.tsx)
  const handleAddExternalProduct = () => {
    if (externalProducts.length >= 4) return;
    const newItems: DemoPlotExternalProductItem[] = [
      ...externalProducts,
      {
        company: "",
        productName: "",
        activeIngredient: "",
        formula: "SL",
        customFormula: "",
        applicationRate: "",
      },
    ];
    setExternalProducts?.(newItems);
  };

  const handleUpdateExternalProduct = (
    index: number,
    field: keyof DemoPlotExternalProductItem,
    value: string,
  ) => {
    const updated = [...externalProducts];
    updated[index] = { ...updated[index], [field]: value };
    setExternalProducts?.(updated);
  };

  const handleRemoveExternalProduct = (index: number) => {
    const updated = externalProducts.filter((_, i) => i !== index);
    setExternalProducts?.(updated);
  };

  const handleYieldChange = (finalVal: string, controlVal: string) => {
    setFinalYieldKg?.(finalVal);
    setControlYieldKg?.(controlVal);
    const finalN = Number(finalVal);
    const controlN = Number(controlVal);
    if (finalN > 0 && controlN > 0) {
      const inc = (((finalN - controlN) / controlN) * 100).toFixed(2);
      setYieldIncreasePercent?.(inc);
    } else {
      setYieldIncreasePercent?.("");
    }
  };

  const handleCropFilesChange = (files: FileWithPreview[]) => {
    const newFiles = filesWithPreviewToImageFiles(files);
    if (!isImageFilesEqual(cropImages, newFiles)) {
      setCropImages?.(newFiles.slice(0, 5));
    }
  };

  const handlePlotFilesChange = (files: FileWithPreview[]) => {
    const newFiles = filesWithPreviewToImageFiles(files);
    if (!isImageFilesEqual(plotImages, newFiles)) {
      setPlotImages?.(newFiles.slice(0, 5));
    }
  };

  const totalVisitsCount =
    demoPlotData?.visits?.length || visitHistory?.length || 0;

  const modalPlotData = demoPlotData
    ? {
        ...demoPlotData,
        visits: demoPlotData.visits || visitHistory,
      }
    : null;

  const effectiveNextDate = nextSprayDate || nextFollowUpDate;
  const handleNextDateChange = (val: string) => {
    setNextSprayDate?.(val);
    setNextFollowUpDate?.(val);
  };

  return (
    <div className="space-y-6">
      {/* HEADER WITH HISTORY BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/70 border border-blue-200/80 p-4 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              ผลการติดตามแปลงสาธิต (Follow-up Demonstration Plot)
            </h2>
            <p className="text-xs text-slate-500">
              บันทึกผลการติดตามความคืบหน้า การฉีดพ่น และสภาพพืชในแปลงสาธิตเดิม
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
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

      {/* READ-ONLY INITIAL DATA CARD FOR TYPE_7B */}
      {demoPlotData && (
        <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5 text-xs shadow-2xs">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-slate-700">
            <div>
              <span className="text-slate-400 block text-[11px]">ชื่อแปลง</span>
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
            <div>
              <span className="text-slate-400 block text-[11px]">วันที่ฉีดพ่นครั้งแรก</span>
              <span className="font-semibold text-slate-900">
                {demoPlotData.initialSprayDate
                  ? new Date(demoPlotData.initialSprayDate).toLocaleDateString("th-TH")
                  : "-"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: ฟอร์มบันทึกการติดตามจริง (10 REQUIREMENTS) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xs">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            ข้อมูลการติดตามและการฉีดพ่นรอบนี้
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            กรุณากรอกข้อมูลผลการติดตามและรายละเอียดการฉีดพ่นจริงให้ครบถ้วน
          </p>
        </div>

        {/* 1. วันที่ติดตามจริง & 2. จำนวนวันหลังฉีดพ่น */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              1. วันที่ติดตามจริง <span className="text-rose-500">*</span>
            </label>
            <Input
              type="date"
              value={actualStartDate}
              onChange={(e) => setActualStartDate?.(e.target.value)}
              className="h-9 text-xs bg-white border-slate-200 rounded-lg"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              2. จำนวนวันหลังฉีดพ่น (วัน) <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min={0}
                value={daysAfterSpray}
                onChange={(e) => setDaysAfterSpray?.(e.target.value)}
                placeholder="เช่น 7, 14..."
                className="h-9 text-xs bg-white border-slate-200 rounded-lg flex-1"
                required
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">วัน</span>
            </div>
          </div>
        </div>

        {/* 3. ผลหลังการฉีดพ่น */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700">
            3. ผลหลังการฉีดพ่น <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              value={productResponse}
              onValueChange={(v) => setProductResponse?.(v)}
            >
              <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg font-medium">
                <SelectValue placeholder="เลือกผลการฉีดพ่น" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="พืชตอบสนองดี">
                  ✨ พืชตอบสนองดี (เห็นผลตามเป้าหมาย)
                </SelectItem>
                <SelectItem value="ยังไม่เห็นผลชัดเจน">
                  ⏱️ ยังไม่เห็นผลชัดเจน (ต้องติดตามต่อ)
                </SelectItem>
                <SelectItem value="พบปัญหา">
                  ❌ พบปัญหาหลังการฉีดพ่น (เช่น ใบไหม้ ยาตกตะกอน)
                </SelectItem>
              </SelectContent>
            </Select>

            {productResponse === "พบปัญหา" && (
              <div className="sm:col-span-2 space-y-1.5 p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
                <label className="block text-xs font-bold text-rose-800">
                  ระบุรายละเอียดปัญหาที่พบหลังการฉีดพ่น <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  rows={2}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription?.(e.target.value)}
                  placeholder="ระบุอาการ ใบไหม้ ดอกร่วง หรือปัญหาที่เกิดขึ้น..."
                  className="text-xs bg-white border-rose-300 rounded-lg"
                  required
                />
              </div>
            )}
          </div>
        </div>

        {/* 4. รูปผลหลังการฉีดพ่น (Upload สูงสุด 5 รูป) */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              4. รูปผลหลังการฉีดพ่น (รูปภาพสภาพพืช)
            </label>
            <span className="text-[11px] text-slate-500">
              อัปโหลดได้สูงสุด 5 รูป ({cropImages.length}/5)
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <GalleryUpload
              initialFiles={convertToFileMetadata(cropImages)}
              onFilesChange={handleCropFilesChange}
              maxFiles={5}
            />
          </div>
        </div>

        {/* 5. อัตราการฉีดพ่น (แยกตามแต่ละตัวยา) */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              5. อัตราการฉีดพ่น (แยกตามผลิตภัณฑ์/ตัวยา) <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-emerald-700 font-medium">
              ดึงรายการยาจากแปลงสาธิตเดิม
            </span>
          </div>

          {bProductRates && bProductRates.length > 0 ? (
            <div className="space-y-2.5">
              {bProductRates.map((pr, pIdx) => (
                <div
                  key={pr.productId || pIdx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">
                      {pIdx + 1}. {pr.productName}
                    </span>
                    {pr.baselineRate && (
                      <span className="text-[11px] text-slate-500">
                        อัตราตั้งต้นเดิม (Baseline): <b className="text-slate-700">{pr.baselineRate}</b>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:w-80">
                    <label className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                      อัตราใช้จริงรอบนี้:
                    </label>
                    <Input
                      value={pr.actualRate}
                      onChange={(e) => handleProductRateChange(pr.productId, e.target.value)}
                      placeholder="เช่น 20 ซีซี / น้ำ 20 ลิตร..."
                      className="h-8 text-xs bg-white border-slate-200 rounded-lg flex-1"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              ไม่พบรายการผลิตภัณฑ์จากแปลงสาธิตเดิม
            </div>
          )}
        </div>

        {/* 6. วิธีการฉีดพ่น SINGLE vs TANK_MIXED (Reuse logic จาก actual-type7-new-demo.tsx) */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700">
            6. วิธีการฉีดพ่น <span className="text-rose-500">*</span>
          </label>
          <div className="flex flex-wrap gap-4 items-center">
            {DEMO_PLOT_SPRAY_METHODS.map((m) => (
              <label
                key={m.value}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-colors ${
                  sprayMethod === m.value
                    ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-2xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="type7b-spray-method"
                  value={m.value}
                  checked={sprayMethod === m.value}
                  onChange={() => {
                    setSprayMethod?.(m.value);
                    if (m.value === "SINGLE") {
                      setHasExternalChemicals?.(false);
                      setExternalProducts?.([]);
                    }
                  }}
                  className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span>{m.label}</span>
              </label>
            ))}
          </div>

          {/* ถ้าเลือก TANK_MIXED: แสดง Checkbox "มียาภายนอก" */}
          {sprayMethod === "TANK_MIXED" && (
            <div className="pt-2 border-t border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="type7b-external-chemicals-toggle"
                  checked={Boolean(hasExternalChemicals)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setHasExternalChemicals?.(checked);
                    if (checked && externalProducts.length === 0) {
                      handleAddExternalProduct();
                    }
                  }}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label
                  htmlFor="type7b-external-chemicals-toggle"
                  className="text-xs font-bold text-slate-800 cursor-pointer select-none"
                >
                  มียาภายนอก (External Chemicals)
                </label>
              </div>

              {hasExternalChemicals && (
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950">
                      รายการสารเคมีภายนอก (สูงสุด 4 รายการ)
                    </span>
                    {externalProducts.length < 4 && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddExternalProduct}
                        className="h-7 text-xs bg-amber-700 hover:bg-amber-800 text-white rounded-lg shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        เพิ่มสารเคมี ({externalProducts.length}/4)
                      </Button>
                    )}
                  </div>

                  {externalProducts.length === 0 ? (
                    <p className="text-xs text-amber-800">
                      กรุณากดปุ่มเพิ่มรายการสารเคมีภายนอก
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {externalProducts.map((ep, eIdx) => (
                        <div
                          key={eIdx}
                          className="p-3 bg-white border border-amber-200 rounded-xl space-y-2.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-xs font-bold text-slate-800">
                              สารเคมีภายนอก #{eIdx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveExternalProduct(eIdx)}
                              className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              ลบ
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                บริษัท (Company) *
                              </label>
                              <Input
                                value={ep.company}
                                onChange={(e) =>
                                  handleUpdateExternalProduct(
                                    eIdx,
                                    "company",
                                    e.target.value,
                                  )
                                }
                                placeholder="เช่น บริษัท ไบเออร์..."
                                className="h-9 text-xs bg-white border-slate-200 rounded-lg"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                ชื่อสินค้า / สารเคมี *
                              </label>
                              <Input
                                value={ep.productName}
                                onChange={(e) =>
                                  handleUpdateExternalProduct(
                                    eIdx,
                                    "productName",
                                    e.target.value,
                                  )
                                }
                                placeholder="เช่น คอนฟิดอร์..."
                                className="h-9 text-xs bg-white border-slate-200 rounded-lg"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                สารสำคัญ (Active Ingredient)
                              </label>
                              <Input
                                value={ep.activeIngredient || ""}
                                onChange={(e) =>
                                  handleUpdateExternalProduct(
                                    eIdx,
                                    "activeIngredient",
                                    e.target.value,
                                  )
                                }
                                placeholder="เช่น อิมิดาโคลพริด..."
                                className="h-9 text-xs bg-white border-slate-200 rounded-lg"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                สูตรยา (Formula) *
                              </label>
                              <Select
                                value={ep.formula}
                                onValueChange={(val) =>
                                  handleUpdateExternalProduct(
                                    eIdx,
                                    "formula",
                                    val,
                                  )
                                }
                              >
                                <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg">
                                  <SelectValue placeholder="เลือกสูตรยา..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {EXTERNAL_CHEMICAL_FORMULAS.map((f) => (
                                    <SelectItem key={f} value={f}>
                                      {f}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {ep.formula === "อื่นๆ" && (
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                  ระบุสูตรยา *
                                </label>
                                <Input
                                  value={ep.customFormula || ""}
                                  onChange={(e) =>
                                    handleUpdateExternalProduct(
                                      eIdx,
                                      "customFormula",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="ระบุสูตรยา..."
                                  className="h-9 text-xs bg-white border-slate-200 rounded-lg"
                                  required
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                อัตราการใช้ *
                              </label>
                              <Input
                                value={ep.applicationRate}
                                onChange={(e) =>
                                  handleUpdateExternalProduct(
                                    eIdx,
                                    "applicationRate",
                                    e.target.value,
                                  )
                                }
                                placeholder="เช่น 10 ซีซี / น้ำ 20 ลิตร"
                                className="h-9 text-xs bg-white border-slate-200 rounded-lg"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 7. อุปกรณ์ที่ใช้ฉีดพ่น */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700">
            7. อุปกรณ์ที่ใช้ฉีดพ่น <span className="text-rose-500">*</span>
          </label>
          <div className="flex flex-wrap gap-3 items-center">
            {DEMO_PLOT_SPRAY_EQUIPMENTS.map((eq) => (
              <label
                key={eq}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-colors ${
                  sprayEquipment === eq
                    ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-2xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="type7b-spray-equipment"
                  value={eq}
                  checked={sprayEquipment === eq}
                  onChange={() => {
                    setSprayEquipment?.(eq);
                    if (eq !== "อื่นๆ ระบุ..") {
                      setOtherEquipment?.("");
                    }
                  }}
                  className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span>{eq}</span>
              </label>
            ))}
          </div>

          {sprayEquipment === "อื่นๆ ระบุ.." && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 sm:w-96">
              <label className="block text-xs font-bold text-slate-700">
                ระบุอุปกรณ์ฉีดพ่นอื่นๆ <span className="text-rose-500">*</span>
              </label>
              <Input
                value={otherEquipment}
                onChange={(e) => setOtherEquipment?.(e.target.value)}
                placeholder="ระบุอุปกรณ์ที่ใช้..."
                className="h-9 text-xs bg-white border-slate-200 rounded-lg"
                required
              />
            </div>
          )}
        </div>

        {/* 8. กำหนดฉีดพ่นครั้งต่อไป (Label: "กำหนดฉีดพ่นครั้งต่อไป") */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 sm:w-80">
          <label className="block text-xs font-bold text-slate-700">
            8. กำหนดฉีดพ่นครั้งต่อไป
          </label>
          <Input
            type="date"
            value={effectiveNextDate}
            onChange={(e) => handleNextDateChange(e.target.value)}
            className="h-9 text-xs bg-white border-slate-200 rounded-lg"
          />
        </div>

        {/* 9. รูปการฉีดพ่น (Upload สูงสุด 5 รูป) */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              9. รูปการฉีดพ่น (รูปภาพแปลง / ขณะปฏิบัติงาน)
            </label>
            <span className="text-[11px] text-slate-500">
              อัปโหลดได้สูงสุด 5 รูป ({plotImages.length}/5)
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <GalleryUpload
              initialFiles={convertToFileMetadata(plotImages)}
              onFilesChange={handlePlotFilesChange}
              maxFiles={5}
            />
          </div>
        </div>

        {/* 10. ข้อมูลเพิ่มเติม */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700">
            10. ข้อมูลเพิ่มเติม
          </label>
          <Textarea
            rows={3}
            value={usageMethod}
            onChange={(e) => setUsageMethod(e.target.value)}
            placeholder="บันทึกข้อสังเกตเพิ่มเติม สภาพอากาศ หรือหมายเหตุอื่นๆ..."
            className="text-xs bg-white border-slate-200 rounded-lg"
          />
        </div>
      </div>

      {/* SECTION 3: PLOT STATUS & FINAL YIELD EVALUATION */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-700" />
            <h3 className="text-sm font-bold text-slate-800">
              สถานะแปลงสาธิต
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              สถานะแปลงหลังการตรวจรอบนี้ <span className="text-rose-500">*</span>
            </label>
            <Select
              value={plotStatus}
              onValueChange={(v: DemoPlotStatus) => setPlotStatus?.(v)}
            >
              <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg font-medium">
                <SelectValue placeholder="เลือกสถานะแปลง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN_PROGRESS">
                  🔄 อยู่ระหว่างการทดลอง (ต้องติดตามต่อ)
                </SelectItem>
                <SelectItem value="COMPLETED">
                  ✅ เก็บเกี่ยว / สิ้นสุดการทดลอง (ปิดแปลง)
                </SelectItem>
                <SelectItem value="FAILED">
                  ❌ ยุติการทดลอง (แปลงเสียหาย / ล้มเหลว)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Final Harvest Evaluation (เมื่อเลือก ปิดแปลง COMPLETED) */}
        {plotStatus === "COMPLETED" && (
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
