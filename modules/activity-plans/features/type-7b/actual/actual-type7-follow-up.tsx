"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sprout,
  Clock,
  History,
  Droplets,
  Layers,
  Plus,
  Trash2,
  MapPin,
  Sparkles,
  TrendingUp,
  Star,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
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
import type {
  ImageFile,
  DemoPlotExternalProductItem,
  Type7bProductRateItem,
  Type7bSprayingRoundItem,
  Type7bSprayProductRateItem,
} from "@/modules/activity-plans/features/actual-view/types";
import {
  DEMO_PLOT_SPRAY_METHODS,
  EXTERNAL_CHEMICAL_FORMULAS,
  DEMO_PLOT_SPRAY_EQUIPMENTS,
} from "@/modules/activity-plans/constants";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";
import { DemoPlotHistoryModal } from "@/modules/activity-plans/features/actual-view/components/work-types/demo-plot-history-modal";
import GalleryUpload from "@/components/custom/gallery-upload";
import DatePicker from "@/components/custom/DatePicker";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import {
  convertToFileMetadata,
  filesWithPreviewToImageFiles,
  isImageFilesEqual,
} from "@/modules/activity-plans/features/actual-view/utils";
import { isType7bCompletedFollowUpVisit } from "@/modules/activity-plans/features/shared/actual-view/utils";

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
    followUpObjective?: string;
    demoProducts?: Array<{
      productId: string;
      productName: string;
      quantity?: number | string | null;
      unit?: string | null;
    }>;
  };
  plotName: string;
  usageMethod: string;
  setUsageMethod: (v: string) => void;

  // Section A: Tracking
  actualStartDate?: string;
  setActualStartDate?: (v: string) => void;
  daysAfterSpray?: string | number;
  setDaysAfterSpray?: (v: string) => void;
  cropImages?: ImageFile[];
  setCropImages?: (imgs: ImageFile[]) => void;

  // Section B: Multiple Spraying Rounds
  t7bSprayingRounds?: Type7bSprayingRoundItem[];
  setT7bSprayingRounds?: (rounds: Type7bSprayingRoundItem[]) => void;

  // Backward compatibility / shared props
  productResponse?: string;
  setProductResponse?: (v: any) => void;
  problemDescription?: string;
  setProblemDescription?: (v: string) => void;
  bProductRates?: Type7bProductRateItem[];
  setBProductRates?: (items: Type7bProductRateItem[]) => void;
  sprayMethod?: "SINGLE" | "TANK_MIXED";
  setSprayMethod?: (v: "SINGLE" | "TANK_MIXED") => void;
  hasExternalChemicals?: boolean;
  setHasExternalChemicals?: (v: boolean) => void;
  externalProducts?: DemoPlotExternalProductItem[];
  setExternalProducts?: (items: DemoPlotExternalProductItem[]) => void;
  sprayEquipment?: string;
  setSprayEquipment?: (v: string) => void;
  otherEquipment?: string;
  setOtherEquipment?: (v: string) => void;
  nextSprayDate?: string;
  setNextSprayDate?: (v: string) => void;
  nextFollowUpDate?: string;
  setNextFollowUpDate?: (v: string) => void;
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

  // Final evaluation
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
  cropImages = [],
  setCropImages,
  t7bSprayingRounds = [],
  setT7bSprayingRounds,
  nextSprayDate = "",
  setNextSprayDate,
  nextFollowUpDate = "",
  setNextFollowUpDate,
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
  sprayMethod,
  setSprayMethod,
  sprayEquipment,
  setSprayEquipment,
  otherEquipment,
  setOtherEquipment,
  hasExternalChemicals,
  setHasExternalChemicals,
  externalProducts,
  setExternalProducts,
}: ActualType7FollowUpProps) {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Helper to resolve round products by merging demo plot baseline and withdrawn products
  const resolveRoundProducts = useCallback((): Type7bSprayProductRateItem[] => {
    const baselineProducts = demoPlotData?.demoProducts || [];
    const withdrawnProducts = target?.demoProducts || [];

    const productMap = new Map<string, Type7bSprayProductRateItem>();

    // 1. Add Demo Plot baseline products first (preserving original baseline order)
    baselineProducts.forEach((dp: any) => {
      const pId = dp.productId;
      if (!pId) return;

      const pName = dp.product?.name || dp.productName || "สินค้าสาธิต";
      const bRate = dp.applicationRate || "";
      const pUnit =
        dp.product?.unit || dp.product?.packageSizeUnit || dp.unit || "";

      productMap.set(pId, {
        productId: pId,
        productName: pName,
        baselineRate: bRate,
        withdrawnQuantity: null,
        actualRate: "",
        quantityUsed: 1,
        unit: pUnit,
      });
    });

    // 2. Merge TYPE_7B withdrawn products
    withdrawnProducts.forEach((wp: any) => {
      const pId = wp.productId;
      if (!pId) return;

      const wQty = wp.quantity != null ? wp.quantity : null;
      const existing = productMap.get(pId);

      if (existing) {
        // If product already exists in baseline: attach withdrawnQuantity (Read-only reference)
        existing.withdrawnQuantity = wQty;
        if (!existing.unit && wp.unit) {
          existing.unit = wp.unit;
        }
      } else {
        // If withdrawn product is not in baseline: append as new item
        productMap.set(pId, {
          productId: pId,
          productName: wp.productName || "สินค้าสาธิต",
          baselineRate: "",
          withdrawnQuantity: wQty,
          actualRate: "",
          quantityUsed: 0,
          unit: wp.unit || "",
        });
      }
    });

    return Array.from(productMap.values());
  }, [target?.demoProducts, demoPlotData?.demoProducts]);

  // Auto-initialize first spraying round if empty and demoPlotData loaded
  useEffect(() => {
    if (
      (!t7bSprayingRounds || t7bSprayingRounds.length === 0) &&
      demoPlotData
    ) {
      const existingRounds = demoPlotData.sprayRounds || [];
      const maxExisting =
        existingRounds.length > 0
          ? Math.max(
              ...existingRounds.map((r: any) => Number(r.roundNumber) || 0),
            )
          : 0;
      const nextRoundNum = maxExisting + 1;

      const defaultProducts = resolveRoundProducts();

      const initialRound: Type7bSprayingRoundItem = {
        roundNumber: nextRoundNum,
        sprayDate: actualStartDate || "",
        sprayMethod: (demoPlotData.sprayMethod as any) || "SINGLE",
        hasExternalChemicals: false,
        externalProducts: [],
        sprayEquipment: "เป้สะพายหลัง",
        otherEquipment: "",
        productResponse: "พืชตอบสนองดี",
        problemDetail: "",
        productRates: defaultProducts,
        plotImages: [],
      };

      setT7bSprayingRounds?.([initialRound]);
    }
  }, [
    demoPlotData,
    t7bSprayingRounds,
    setT7bSprayingRounds,
    actualStartDate,
    resolveRoundProducts,
  ]);

  // Handler for adding a new spraying round
  const handleAddSprayingRound = () => {
    const currentRounds = t7bSprayingRounds || [];
    const existingRounds = demoPlotData?.sprayRounds || [];
    const maxExisting =
      existingRounds.length > 0
        ? Math.max(
            ...existingRounds.map((r: any) => Number(r.roundNumber) || 0),
          )
        : 0;
    const maxCurrent =
      currentRounds.length > 0
        ? Math.max(...currentRounds.map((r) => r.roundNumber))
        : maxExisting;
    const nextRoundNum = maxCurrent + 1;

    const defaultProducts = resolveRoundProducts();

    const newRound: Type7bSprayingRoundItem = {
      roundNumber: nextRoundNum,
      sprayDate: actualStartDate || "",
      sprayMethod: (demoPlotData?.sprayMethod as any) || "SINGLE",
      hasExternalChemicals: false,
      externalProducts: [],
      sprayEquipment: "โดรน",
      otherEquipment: "",
      productResponse: "พืชตอบสนองดี",
      problemDetail: "",
      productRates: defaultProducts,
      plotImages: [],
    };

    setT7bSprayingRounds?.([...currentRounds, newRound]);
  };

  const handleRemoveSprayingRound = (idx: number) => {
    const currentRounds = t7bSprayingRounds || [];
    const updated = currentRounds.filter((_, i) => i !== idx);
    setT7bSprayingRounds?.(updated);
  };

  const handleUpdateRound = (
    idx: number,
    fieldOrUpdates:
      | keyof Type7bSprayingRoundItem
      | Partial<Type7bSprayingRoundItem>,
    value?: any,
  ) => {
    const currentRounds = [...(t7bSprayingRounds || [])];
    if (currentRounds[idx]) {
      if (typeof fieldOrUpdates === "object" && fieldOrUpdates !== null) {
        currentRounds[idx] = {
          ...currentRounds[idx],
          ...fieldOrUpdates,
        };
      } else {
        currentRounds[idx] = {
          ...currentRounds[idx],
          [fieldOrUpdates]: value,
        };
      }
      setT7bSprayingRounds?.(currentRounds);
    }

    // Sync round 0 to visit-level props
    if (idx === 0) {
      if (typeof fieldOrUpdates === "object" && fieldOrUpdates !== null) {
        if (fieldOrUpdates.sprayMethod) {
          setSprayMethod?.(fieldOrUpdates.sprayMethod as any);
        }
        if (fieldOrUpdates.sprayEquipment) {
          setSprayEquipment?.(fieldOrUpdates.sprayEquipment);
        }
        if (fieldOrUpdates.otherEquipment !== undefined) {
          setOtherEquipment?.(fieldOrUpdates.otherEquipment);
        }
        if (fieldOrUpdates.hasExternalChemicals !== undefined) {
          setHasExternalChemicals?.(fieldOrUpdates.hasExternalChemicals);
        }
        if (fieldOrUpdates.externalProducts !== undefined) {
          setExternalProducts?.(fieldOrUpdates.externalProducts as any);
        }
      } else {
        if (fieldOrUpdates === "sprayMethod") setSprayMethod?.(value);
        if (fieldOrUpdates === "sprayEquipment") setSprayEquipment?.(value);
        if (fieldOrUpdates === "otherEquipment") setOtherEquipment?.(value);
        if (fieldOrUpdates === "hasExternalChemicals")
          setHasExternalChemicals?.(value);
        if (fieldOrUpdates === "externalProducts") setExternalProducts?.(value);
      }
    }
  };

  const handleUpdateRoundProduct = (
    roundIdx: number,
    productIdx: number,
    field: keyof Type7bSprayProductRateItem,
    value: any,
  ) => {
    const currentRounds = [...(t7bSprayingRounds || [])];
    if (currentRounds[roundIdx]) {
      const products = [...currentRounds[roundIdx].productRates];
      if (products[productIdx]) {
        products[productIdx] = {
          ...products[productIdx],
          [field]: value,
        };
        currentRounds[roundIdx].productRates = products;
        setT7bSprayingRounds?.(currentRounds);
      }
    }
  };

  const handleAddExternalProductToRound = (roundIdx: number) => {
    const currentRounds = [...(t7bSprayingRounds || [])];
    if (currentRounds[roundIdx]) {
      const externals = currentRounds[roundIdx].externalProducts || [];
      if (externals.length >= 4) return;
      currentRounds[roundIdx].externalProducts = [
        ...externals,
        {
          company: "",
          productName: "",
          activeIngredient: "",
          formula: "SL",
          customFormula: "",
          applicationRate: "",
        },
      ];
      currentRounds[roundIdx].hasExternalChemicals = true;
      setT7bSprayingRounds?.(currentRounds);
    }
  };

  const handleUpdateRoundExternalProduct = (
    roundIdx: number,
    extIdx: number,
    field: keyof DemoPlotExternalProductItem,
    value: any,
  ) => {
    const currentRounds = [...(t7bSprayingRounds || [])];
    if (currentRounds[roundIdx]) {
      const externals = [...(currentRounds[roundIdx].externalProducts || [])];
      if (externals[extIdx]) {
        externals[extIdx] = {
          ...externals[extIdx],
          [field]: value,
        };
        currentRounds[roundIdx].externalProducts = externals;
        setT7bSprayingRounds?.(currentRounds);
      }
    }
  };

  const handleRemoveRoundExternalProduct = (
    roundIdx: number,
    extIdx: number,
  ) => {
    const currentRounds = [...(t7bSprayingRounds || [])];
    if (currentRounds[roundIdx]) {
      const externals = (currentRounds[roundIdx].externalProducts || []).filter(
        (_, i) => i !== extIdx,
      );
      currentRounds[roundIdx].externalProducts = externals;
      if (externals.length === 0) {
        currentRounds[roundIdx].hasExternalChemicals = false;
      }
      setT7bSprayingRounds?.(currentRounds);
    }
  };

  const handleRoundPlotFilesChange = (
    roundIdx: number,
    files: FileWithPreview[],
  ) => {
    const newFiles = filesWithPreviewToImageFiles(files);
    const currentRounds = [...(t7bSprayingRounds || [])];
    if (currentRounds[roundIdx]) {
      if (!isImageFilesEqual(currentRounds[roundIdx].plotImages, newFiles)) {
        currentRounds[roundIdx] = {
          ...currentRounds[roundIdx],
          plotImages: newFiles.slice(0, 5),
        };
        setT7bSprayingRounds?.(currentRounds);
      }
    }
  };

  const handleCropFilesChange = (files: FileWithPreview[]) => {
    const newFiles = filesWithPreviewToImageFiles(files);
    if (!isImageFilesEqual(cropImages, newFiles)) {
      setCropImages?.(newFiles.slice(0, 5));
    }
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

  // Past follow-up visits count:
  // Only count completed TYPE_7B follow-up visits
  const completedVisits = (demoPlotData?.visits || visitHistory || []).filter(
    isType7bCompletedFollowUpVisit,
  );
  const completedVisitsCount = completedVisits.length;

  const modalPlotData = demoPlotData
    ? {
        ...demoPlotData,
        visits: completedVisits,
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
      </div>

      {/* SECTION 1: PLANNED TARGET CARD (Problem 3.2 Fix: Selected Plot + Planned Detail only) */}
      <ActualTargetCard
        iconColorClass="text-blue-700"
        badgeColorClass="bg-blue-50 text-blue-800 border border-blue-200"
        gridColsClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-1"
        items={[
          {
            label: "สิ่งที่ตั้งใจไปติดตาม:",
            value: target.followUpObjective || target.detail || "-",
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
                ข้อมูลตั้งต้นของแปลงสาธิต (Initial Plot Data)
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-slate-700">
            <div>
              <span className="text-slate-400 block text-[11px]">
                ชื่อแปลงสาธิต
              </span>
              <span className="font-semibold text-slate-900">
                {demoPlotData.plotName || demoPlotData.name || "-"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                เกษตรกรเจ้าของแปลง
              </span>
              <span className="font-semibold text-slate-900">
                {demoPlotData.ownerName ||
                  demoPlotData.farmerName ||
                  demoPlotData.farmer?.name ||
                  demoPlotData.farmerCustomer?.name ||
                  target.owner ||
                  "-"}{" "}
                {demoPlotData.ownerPhone ||
                demoPlotData.farmerPhone ||
                demoPlotData.farmer?.phone ||
                demoPlotData.farmerCustomer?.phone
                  ? `(${demoPlotData.ownerPhone || demoPlotData.farmerPhone || demoPlotData.farmer?.phone || demoPlotData.farmerCustomer?.phone})`
                  : ""}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                จังหวัด / อำเภอ ของเกษตรกร
              </span>
              <span className="font-semibold text-slate-900">
                {demoPlotData.ownerProvince ||
                  demoPlotData.farmerCustomer?.province ||
                  demoPlotData.farmer?.province ||
                  "-"}
                {demoPlotData.ownerDistrict ||
                demoPlotData.farmerCustomer?.district ||
                demoPlotData.farmer?.district ||
                demoPlotData.district
                  ? ` / ${demoPlotData.ownerDistrict || demoPlotData.farmerCustomer?.district || demoPlotData.farmer?.district || demoPlotData.district}`
                  : ""}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                ร้านค้าตัวแทนจำหน่าย
              </span>
              <span className="font-semibold text-slate-900">
                {demoPlotData.customer?.name || demoPlotData.dealerName || "-"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                พิกัดแปลง (Lat, Lng)
              </span>
              <span className="font-semibold text-slate-900 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                {demoPlotData.latitude && demoPlotData.longitude
                  ? `${demoPlotData.latitude}, ${demoPlotData.longitude}`
                  : "-"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                พืช / หมวดหมู่
              </span>
              <span className="font-semibold text-slate-900">
                {demoPlotData.cropName ||
                  demoPlotData.targetCrop ||
                  target.crop ||
                  "-"}{" "}
                {demoPlotData.cropCategory
                  ? `(${demoPlotData.cropCategory})`
                  : ""}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                ขนาดพื้นที่
              </span>
              <span className="font-semibold text-slate-900">
                {demoPlotData.areaRai ? `${demoPlotData.areaRai} ไร่` : "-"}{" "}
                {demoPlotData.treeCount
                  ? `(${demoPlotData.treeCount} ต้น)`
                  : ""}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                วัตถุประสงค์แปลงสาธิต
              </span>
              <span className="font-semibold text-slate-900">
                {demoPlotData.objective || "-"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                รายละเอียดการทดสอบ
              </span>
              <span className="font-semibold text-slate-900">
                {demoPlotData.experimentDetail || "-"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                ข้อมูลพืชประธาน
              </span>
              <span className="font-semibold text-slate-900">
                {demoPlotData.mainCropInfo ||
                  demoPlotData.plantingAreaCondition ||
                  "-"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                แหล่งน้ำ / ระบบการให้น้ำ
              </span>
              <span className="font-semibold text-slate-900">
                {demoPlotData.irrigations && demoPlotData.irrigations.length > 0
                  ? demoPlotData.irrigations
                      .map((i: any) => i.method || i.methodName)
                      .join(", ")
                  : "-"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                วันที่เริ่มฉีดพ่นครั้งแรก
              </span>
              <span className="font-semibold text-slate-900">
                {demoPlotData.initialSprayDate
                  ? new Date(demoPlotData.initialSprayDate).toLocaleDateString(
                      "th-TH",
                    )
                  : "-"}
              </span>
            </div>
          </div>

          {/* Baseline Demo Products Table */}
          {demoPlotData.demoProducts &&
            demoPlotData.demoProducts.length > 0 && (
              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <span className="text-xs font-bold text-slate-800 block mt-2">
                  รายการยาที่ใช้สาธิตของแปลง
                </span>
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="p-2.5 w-12 text-center">ลำดับ</th>
                        <th className="p-2.5">ชื่อสินค้าสาธิต</th>
                        <th className="p-2.5 text-center">จำนวนที่ใช้</th>
                        <th className="p-2.5">หน่วย</th>
                        <th className="p-2.5">อัตราการใช้</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {demoPlotData.demoProducts.map((p: any, pIdx: number) => (
                        <tr key={p.id || pIdx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 text-center text-slate-700">
                            {pIdx + 1}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900">
                            {p.product?.name || p.productName || "-"}
                          </td>
                          <td className="p-2.5 text-center font-semibold text-slate-800">
                            {p.quantity ?? "-"}
                          </td>
                          <td className="p-2.5 text-slate-600">
                            {p.product?.unit || p.unit || ""}
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {/* Baseline External Chemicals Table */}
          {demoPlotData.externalProducts &&
            demoPlotData.externalProducts.length > 0 && (
              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  ตารางสารเคมีภายนอกตั้งต้น (Baseline External Chemicals)
                </span>
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="p-2.5 w-12 text-center">ลำดับ</th>
                        <th className="p-2.5">บริษัท</th>
                        <th className="p-2.5">ชื่อสินค้า</th>
                        <th className="p-2.5">สารออกฤทธิ์</th>
                        <th className="p-2.5">สูตร</th>
                        <th className="p-2.5">อัตราการใช้</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {demoPlotData.externalProducts.map(
                        (ep: any, epIdx: number) => (
                          <tr
                            key={ep.id || epIdx}
                            className="hover:bg-slate-50/50"
                          >
                            <td className="p-2.5 text-center text-slate-700">
                              {epIdx + 1}
                            </td>
                            <td className="p-2.5 text-slate-800 font-medium">
                              {ep.company || "-"}
                            </td>
                            <td className="p-2.5 text-slate-900 font-bold">
                              {ep.productName || "-"}
                            </td>
                            <td className="p-2.5 text-slate-600">
                              {ep.activeIngredient || "-"}
                            </td>
                            <td className="p-2.5 text-slate-700">
                              {ep.formula === "อื่นๆ"
                                ? ep.customFormula
                                : ep.formula}
                            </td>
                            <td className="p-2.5 font-medium text-slate-800">
                              {ep.applicationRate || "-"}
                            </td>
                          </tr>
                        ),
                      )}
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
                  <a
                    key={att.id || attIdx}
                    href={att.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity shadow-xs"
                  >
                    <img
                      src={att.fileUrl}
                      alt={att.fileName || "Baseline Photo"}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION A: ข้อมูลการติดตามแปลง (Tracking) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            ส่วนที่ 1: ข้อมูลการติดตามแปลง (Tracking Details)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            บันทึกวันที่เข้าติดตาม จำนวนวันหลังฉีดพ่น และภาพถ่ายสภาพพืชรอบนี้
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              วันที่ติดตามจริง <span className="text-rose-500">*</span>
            </label>
            <DatePicker
              value={actualStartDate}
              onChange={(v) => setActualStartDate?.(v || "")}
              placeholder="เลือกวันที่ติดตามจริง"
              className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              จำนวนวันหลังฉีดพ่น (วัน) <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min={0}
                value={daysAfterSpray}
                onChange={(e) => setDaysAfterSpray?.(e.target.value)}
                placeholder="เช่น 7, 14..."
                className="h-10 text-xs sm:text-sm bg-white border-slate-200 rounded-xl flex-1"
                required
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">
                วัน
              </span>
            </div>
          </div>
        </div>

        {/* รูปสภาพพืชรอบนี้ (Upload สูงสุด 5 รูป) */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              รูปภาพสภาพพืชในการติดตามรอบนี้
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
      </div>

      {/* SECTION B: ข้อมูลการฉีดพ่นรอบต่างๆ (Multiple Spraying Rounds) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-emerald-600" />
              ส่วนที่ 2: ข้อมูลการฉีดพ่นรอบต่างๆ (Multiple Spraying Rounds)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              บันทึกรอบการฉีดพ่นยา อัตราการใช้จริง วิธีผสม และรูปถ่ายการฉีดพ่น
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleAddSprayingRound}
            className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs font-semibold self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ เพิ่มรอบการฉีดพ่น</span>
          </Button>
        </div>

        {!t7bSprayingRounds || t7bSprayingRounds.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2 bg-slate-50/50">
            <Droplets className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">
              ยังไม่มีการบันทึกรอบการฉีดพ่นในครั้งนี้
            </p>
            <p className="text-[11px] text-slate-400">
              หากมีการฉีดพ่นในรอบการเข้าแปลงนี้
              สามารถกดปุ่มเพิ่มรอบการฉีดพ่นด้านบน
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSprayingRound}
              className="mt-2 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              เพิ่มรอบการฉีดพ่น
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {t7bSprayingRounds.map((round, rIdx) => (
              <div
                key={round.id || rIdx}
                className="p-4 sm:p-5 border border-emerald-200 rounded-2xl space-y-5 bg-emerald-50/20 relative"
              >
                {/* Round Header */}
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      {round.roundNumber}
                    </span>
                    <h4 className="text-sm font-bold text-emerald-950">
                      รอบการฉีดพ่นที่ {round.roundNumber}
                    </h4>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSprayingRound(rIdx)}
                    className="h-7 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    ลบรอบนี้
                  </Button>
                </div>

                {/* 1. ตารางสินค้าสาธิตและอัตราการใช้ในรอบนี้ */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      1. รายการสินค้าสาธิตและอัตราการใช้จริงในรอบนี้{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                  </div>

                  <div className="space-y-2.5">
                    {round.productRates.map((pr, pIdx) => (
                      <div
                        key={pr.productId || pIdx}
                        className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4 shadow-2xs"
                      >
                        <div className="sm:w-1/3 space-y-1">
                          <span className="text-xs font-bold text-slate-900 block">
                            {pIdx + 1}. {pr.productName}
                          </span>
                          {pr.withdrawnQuantity != null && (
                            <div className="text-[11px] text-slate-600 flex items-center gap-1">
                              <span className="font-semibold text-slate-500">
                                จำนวนที่เบิก:
                              </span>
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 font-bold rounded border border-emerald-200 text-[11px]">
                                {pr.withdrawnQuantity} {pr.unit || ""}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="sm:w-1/4 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600 block">
                            จำนวนที่ใช้ในรอบนี้
                          </label>
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              min={0}
                              value={pr.quantityUsed}
                              onChange={(e) =>
                                handleUpdateRoundProduct(
                                  rIdx,
                                  pIdx,
                                  "quantityUsed",
                                  e.target.value,
                                )
                              }
                              placeholder="เช่น 1"
                              className="h-8 text-xs bg-white border-slate-200 rounded-lg flex-1"
                            />
                            <span className="text-xs text-slate-500 whitespace-nowrap">
                              {pr.unit || ""}
                            </span>
                          </div>
                        </div>

                        <div className="sm:w-1/3 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-600 block">
                            อัตราการใช้รอบนี้ *
                          </label>
                          <Input
                            value={pr.actualRate}
                            onChange={(e) =>
                              handleUpdateRoundProduct(
                                rIdx,
                                pIdx,
                                "actualRate",
                                e.target.value,
                              )
                            }
                            placeholder="เช่น 20 ซีซี / น้ำ 20 ลิตร..."
                            className="h-8 text-xs bg-white border-slate-200 rounded-lg"
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. วิธีการฉีดพ่น (SINGLE vs TANK_MIXED) */}
                <div className="space-y-2 pt-2 border-t border-emerald-100">
                  <label className="block text-xs font-bold text-slate-700">
                    2. วิธีการฉีดพ่น <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-3 items-center">
                    {DEMO_PLOT_SPRAY_METHODS.map((m) => (
                      <label
                        key={m.value}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-colors ${
                          round.sprayMethod === m.value
                            ? "bg-emerald-100/70 border-emerald-500 text-emerald-950 font-bold shadow-2xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`round-${round.roundNumber}-sprayMethod`}
                          value={m.value}
                          checked={round.sprayMethod === m.value}
                          onChange={() => {
                            if (m.value === "SINGLE") {
                              handleUpdateRound(rIdx, {
                                sprayMethod: "SINGLE",
                                hasExternalChemicals: false,
                                externalProducts: [],
                              });
                            } else {
                              handleUpdateRound(rIdx, {
                                sprayMethod: "TANK_MIXED",
                              });
                            }
                          }}
                          className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>{m.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* สารเคมีภายนอกเมื่อเลือก TANK_MIXED */}
                  {round.sprayMethod === "TANK_MIXED" && (
                    <div className="mt-3 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`round-${round.roundNumber}-external-toggle`}
                            checked={Boolean(round.hasExternalChemicals)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              handleUpdateRound(
                                rIdx,
                                "hasExternalChemicals",
                                checked,
                              );
                              if (
                                checked &&
                                (!round.externalProducts ||
                                  round.externalProducts.length === 0)
                              ) {
                                handleAddExternalProductToRound(rIdx);
                              }
                            }}
                            className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                          />
                          <label
                            htmlFor={`round-${round.roundNumber}-external-toggle`}
                            className="text-xs font-bold text-amber-950 cursor-pointer select-none"
                          >
                            มีสารเคมีภายนอกร่วมด้วย (External Chemicals)
                          </label>
                        </div>

                        {round.hasExternalChemicals &&
                          (round.externalProducts?.length || 0) < 4 && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() =>
                                handleAddExternalProductToRound(rIdx)
                              }
                              className="h-7 text-xs bg-amber-700 hover:bg-amber-800 text-white rounded-lg shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              เพิ่มสารเคมี (
                              {round.externalProducts?.length || 0}/4)
                            </Button>
                          )}
                      </div>

                      {round.hasExternalChemicals && (
                        <div className="space-y-2.5">
                          {(round.externalProducts || []).map((ep, eIdx) => (
                            <div
                              key={eIdx}
                              className="p-3 bg-white border border-amber-200 rounded-xl space-y-2 shadow-2xs"
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                                <span className="text-xs font-bold text-slate-800">
                                  สารเคมีภายนอก #{eIdx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveRoundExternalProduct(rIdx, eIdx)
                                  }
                                  className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  ลบ
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                    บริษัท *
                                  </label>
                                  <Input
                                    value={ep.company}
                                    onChange={(e) =>
                                      handleUpdateRoundExternalProduct(
                                        rIdx,
                                        eIdx,
                                        "company",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="เช่น บริษัท ไบเออร์..."
                                    className="h-8 text-xs bg-white border-slate-200 rounded-lg"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                    ชื่อสินค้า *
                                  </label>
                                  <Input
                                    value={ep.productName}
                                    onChange={(e) =>
                                      handleUpdateRoundExternalProduct(
                                        rIdx,
                                        eIdx,
                                        "productName",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="เช่น คอนฟิดอร์..."
                                    className="h-8 text-xs bg-white border-slate-200 rounded-lg"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                    สารออกฤทธิ์
                                  </label>
                                  <Input
                                    value={ep.activeIngredient || ""}
                                    onChange={(e) =>
                                      handleUpdateRoundExternalProduct(
                                        rIdx,
                                        eIdx,
                                        "activeIngredient",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="เช่น อิมิดาโคลพริด..."
                                    className="h-8 text-xs bg-white border-slate-200 rounded-lg"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                                    สูตร *
                                  </label>
                                  <Select
                                    value={ep.formula}
                                    onValueChange={(val) =>
                                      handleUpdateRoundExternalProduct(
                                        rIdx,
                                        eIdx,
                                        "formula",
                                        val,
                                      )
                                    }
                                  >
                                    <SelectTrigger className="!h-8 text-xs bg-white border-slate-200 rounded-lg w-full">
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
                                        handleUpdateRoundExternalProduct(
                                          rIdx,
                                          eIdx,
                                          "customFormula",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="ระบุสูตรยา..."
                                      className="h-8 text-xs bg-white border-slate-200 rounded-lg"
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
                                      handleUpdateRoundExternalProduct(
                                        rIdx,
                                        eIdx,
                                        "applicationRate",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="เช่น 10 ซีซี / น้ำ 20 ลิตร"
                                    className="h-8 text-xs bg-white border-slate-200 rounded-lg"
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

                {/* 3. อุปกรณ์ที่ใช้ฉีดพ่น */}
                <div className="space-y-2 pt-2 border-t border-emerald-100">
                  <label className="block text-xs font-bold text-slate-700">
                    3. อุปกรณ์ที่ใช้ฉีดพ่น{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2.5 items-center">
                    {DEMO_PLOT_SPRAY_EQUIPMENTS.map((eq) => (
                      <label
                        key={eq}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-colors ${
                          round.sprayEquipment === eq
                            ? "bg-emerald-100/80 border-emerald-500 text-emerald-950 font-bold shadow-2xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`round-${round.roundNumber}-equipment`}
                          value={eq}
                          checked={round.sprayEquipment === eq}
                          onChange={() => {
                            handleUpdateRound(rIdx, {
                              sprayEquipment: eq,
                              ...(eq !== "อื่นๆ ระบุ.."
                                ? { otherEquipment: "" }
                                : {}),
                            });
                          }}
                          className="w-3.5 h-3.5 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>{eq}</span>
                      </label>
                    ))}
                  </div>

                  {round.sprayEquipment === "อื่นๆ ระบุ.." && (
                    <div className="pt-2 sm:w-80">
                      <Input
                        value={round.otherEquipment || ""}
                        onChange={(e) =>
                          handleUpdateRound(
                            rIdx,
                            "otherEquipment",
                            e.target.value,
                          )
                        }
                        placeholder="ระบุอุปกรณ์ที่ใช้..."
                        className="h-8 text-xs bg-white border-slate-200 rounded-lg"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* 4. ผลหลังการฉีดพ่น */}
                <div className="space-y-2 pt-2 border-t border-emerald-100">
                  <label className="block text-xs font-bold text-slate-700">
                    4. ผลหลังการฉีดพ่นรอบนี้{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      value={round.productResponse}
                      onValueChange={(v) =>
                        handleUpdateRound(rIdx, "productResponse", v)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-white border-slate-200 rounded-lg font-medium">
                        <SelectValue placeholder="เลือกผลการฉีดพ่น" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="พืชตอบสนองดี">
                          ✨ พืชตอบสนองดี (เห็นผลตามเป้าหมาย)
                        </SelectItem>
                        <SelectItem value="พบปัญหา">
                          ❌ พบปัญหาหลังการฉีดพ่น (เช่น ใบไหม้ ยาตกตะกอน)
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {round.productResponse === "พบปัญหา" && (
                      <div className="sm:col-span-2 space-y-1 p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
                        <label className="block text-xs font-bold text-rose-800">
                          ระบุรายละเอียดปัญหาที่พบหลังการฉีดพ่นรอบนี้{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <Textarea
                          rows={2}
                          value={round.problemDetail || ""}
                          onChange={(e) =>
                            handleUpdateRound(
                              rIdx,
                              "problemDetail",
                              e.target.value,
                            )
                          }
                          placeholder="ระบุอาการ ใบไหม้ ดอกร่วง หรือปัญหาที่เกิดขึ้น..."
                          className="text-xs bg-white border-rose-300 rounded-lg"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. รูปถ่ายการฉีดพ่นรอบนี้ (Upload สูงสุด 5 รูป) */}
                <div className="space-y-2 pt-2 border-t border-emerald-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      5. รูปถ่ายการฉีดพ่นรอบนี้ (รูปภาพแปลง / ขณะปฏิบัติงาน)
                    </label>
                    <span className="text-[11px] text-slate-500">
                      อัปโหลดได้สูงสุด 5 รูป ({round.plotImages.length}/5)
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                    <GalleryUpload
                      initialFiles={convertToFileMetadata(round.plotImages)}
                      onFilesChange={(files) =>
                        handleRoundPlotFilesChange(rIdx, files)
                      }
                      maxFiles={5}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. กำหนดฉีดพ่นครั้งต่อไป & บันทึกเพิ่มเติม */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              กำหนดฉีดพ่นครั้งต่อไป
            </label>
            <DatePicker
              value={effectiveNextDate}
              onChange={(v) => handleNextDateChange(v || "")}
              placeholder="เลือกกำหนดฉีดพ่นครั้งต่อไป"
              className="bg-white border-slate-200 rounded-xl text-xs sm:text-sm h-10"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            ข้อสังเกตหรือข้อมูลเพิ่มเติม
          </label>
          <Textarea
            rows={2}
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
            <h3 className="text-sm font-bold text-slate-800">สถานะแปลงสาธิต</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              สถานะแปลงหลังการตรวจรอบนี้{" "}
              <span className="text-rose-500">*</span>
            </label>
            <Select
              value={plotStatus}
              onValueChange={(v: DemoPlotStatus) => setPlotStatus?.(v)}
            >
              <SelectTrigger className="h-9 text-xs bg-white border-slate-200 rounded-lg font-medium w-full">
                <SelectValue placeholder="เลือกสถานะแปลง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN_PROGRESS">
                  🔄 อยู่ระหว่างการทดลอง (ต้องติดตามต่อ)
                </SelectItem>
                <SelectItem value="COMPLETED">
                  ✅ สิ้นสุดการทดลอง (ปิดแปลง)
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
                    <SelectItem value="สูงมาก">
                      🔥 สูงมาก (เกษตรกรสั่งซื้อทันที)
                    </SelectItem>
                    <SelectItem value="ปานกลาง">
                      ⚡ ปานกลาง (รอผลแปลงข้างเคียง)
                    </SelectItem>
                    <SelectItem value="ต่ำ">
                      ❄️ ต่ำ (ยังไม่เหมาะกับพื้นที่)
                    </SelectItem>
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

        {/* Plot Termination Reason (เมื่อเลือก ยุติการทดลอง FAILED) */}
        {plotStatus === "FAILED" && (
          <div className="pt-3 border-t border-rose-200/80 space-y-3 bg-rose-50/40 p-4 rounded-xl border border-rose-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                รายละเอียดการยุติการทดลอง (แปลงเสียหาย / ล้มเหลว){" "}
                <span className="text-rose-500">*</span>
              </h4>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                รายละเอียดสาเหตุที่ยุติการทดลอง{" "}
                <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={3}
                value={finalSummaryNotes}
                onChange={(e) => setFinalSummaryNotes?.(e.target.value)}
                placeholder="ระบุสาเหตุ เช่น แปลงเสียหายจากภัยธรรมชาติ/น้ำท่วม, โรคระบาดรุนแรง, เกษตรกรไถทิ้ง/ยกเลิกแปลงทดลอง..."
                className="text-xs bg-white border-rose-300 rounded-lg focus-visible:ring-rose-500 text-slate-800"
                required
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
