"use client";

import React, { useState, useMemo } from "react";
import {
  Sprout,
  AlertTriangle,
  ImageIcon,
  Eye,
  Package,
  MapPin,
  Calendar,
  CheckCircle2,
  FlaskConical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ActualTargetCard } from "@/modules/activity-plans/features/actual-view/components/actual-target-card";
import { ImageFile } from "@/modules/activity-plans/features/actual-view/types";
import {
  ImageLightboxModal,
  LightboxImage,
} from "@/components/custom/image-lightbox-modal";

export interface DemoResultItemData {
  id?: string;
  plannedProductId?: string | null;
  actualProductId?: string | null;
  changeReason?: string | null;
  plotObjective?: string | null;
  plannedProduct?: {
    id: string;
    name: string;
    productCode?: string | null;
    unit?: string | null;
    packageSizeUnit?: string | null;
  } | null;
  actualProduct?: {
    id: string;
    name: string;
    productCode?: string | null;
    unit?: string | null;
    packageSizeUnit?: string | null;
  } | null;
  demoPlotId?: string | null;
}

export interface DetailType7NewDemoProps {
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
    demoProducts?: Array<{
      productId: string;
      productName?: string | null;
      quantity?: number | string | null;
      unit?: string | null;
    }>;
  };
  demoResults?: DemoResultItemData[];
  plannedProductId?: string | null;
  actualProductId?: string | null;
  actualQuantity?: string | number | null;
  plannedProductName?: string | null;
  actualProductName?: string | null;
  changeReason?: string | null;
  plotObjective?: string;
  customPlotDetail?: string | null;
  demoPlotId?: string | null;
  plotName?: string;
  usageMethod?: string;
  cropAgeValue?: string | number | null;
  cropAgeUnit?: string | null;
  growthStage?: string | null;
  experimentDetail?: string | null;
  notes?: string | null;
  plantingDate?: string;
  plantingAreaCondition?: string;
  cropImages?: ImageFile[];
  plotImages?: ImageFile[];
  demoPlotData?: any;
}

export function DetailType7NewDemo({
  target,
  demoResults = [],
  plannedProductId,
  actualProductId,
  actualQuantity,
  plannedProductName,
  actualProductName,
  changeReason,
  plotObjective,
  customPlotDetail,
  demoPlotId,
  plotName,
  usageMethod,
  cropAgeValue,
  cropAgeUnit,
  growthStage,
  experimentDetail,
  notes,
  plantingDate,
  plantingAreaCondition,
  cropImages = [],
  plotImages = [],
  demoPlotData,
}: DetailType7NewDemoProps) {
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

  const effectiveDemoResults =
    demoResults && demoResults.length > 0
      ? demoResults
      : [
          {
            plannedProductId: plannedProductId || null,
            actualProductId: actualProductId || null,
            changeReason: changeReason || null,
            plotObjective: plotObjective || null,
            plannedProduct: plannedProductName
              ? { id: plannedProductId || "", name: plannedProductName }
              : null,
            actualProduct: actualProductName
              ? { id: actualProductId || "", name: actualProductName }
              : null,
          },
        ];

  const firstResult = effectiveDemoResults[0];

  // Planned Product & Unit resolution
  const effectivePlannedId =
    firstResult?.plannedProductId || plannedProductId || null;
  const rawPlannedName =
    firstResult?.plannedProduct?.name ||
    plannedProductName ||
    target.product ||
    "-";
  const plannedCode = firstResult?.plannedProduct?.productCode;
  const plannedUnit =
    firstResult?.plannedProduct?.unit ||
    firstResult?.plannedProduct?.packageSizeUnit ||
    "";
  const plannedProductDisplay = plannedCode
    ? `${rawPlannedName} (${plannedCode})`
    : rawPlannedName;

  // Actual Product & Unit resolution
  const effectiveActualId =
    firstResult?.actualProductId || actualProductId || effectivePlannedId;
  const isProductChanged = Boolean(
    effectivePlannedId &&
    effectiveActualId &&
    effectivePlannedId !== effectiveActualId,
  );

  const rawActualName =
    firstResult?.actualProduct?.name ||
    actualProductName ||
    (isProductChanged ? "-" : rawPlannedName);
  const actualCode = firstResult?.actualProduct?.productCode;
  const actualUnit =
    firstResult?.actualProduct?.unit ||
    firstResult?.actualProduct?.packageSizeUnit ||
    (isProductChanged ? "" : plannedUnit) ||
    "";
  const actualProductDisplay = actualCode
    ? `${rawActualName} (${actualCode})`
    : rawActualName;

  // Actual Quantity resolution (strictly do not fallback to planned target)
  const resolvedActualQuantity =
    actualQuantity !== undefined &&
    actualQuantity !== null &&
    actualQuantity !== ""
      ? String(actualQuantity)
      : "";
  const actualQuantityDisplay = resolvedActualQuantity
    ? actualUnit
      ? `${resolvedActualQuantity} ${actualUnit}`
      : resolvedActualQuantity
    : "-";

  const resolvedChangeReason =
    firstResult?.changeReason || (isProductChanged ? changeReason : null);

  // Crop Age & Stage Resolution
  const resolvedCropAge =
    demoPlotData?.visits?.[0]?.cropAgeValue !== null &&
    demoPlotData?.visits?.[0]?.cropAgeValue !== undefined
      ? String(demoPlotData.visits[0].cropAgeValue)
      : cropAgeValue !== null &&
          cropAgeValue !== undefined &&
          cropAgeValue !== ""
        ? String(cropAgeValue)
        : null;

  const resolvedCropAgeUnit =
    demoPlotData?.visits?.[0]?.cropAgeUnit || cropAgeUnit || "วัน";

  const resolvedGrowthStage =
    demoPlotData?.visits?.[0]?.growthStage || growthStage || null;

  // Rule: strictly experimentDetail from actual demoPlotData. NO fallback to planned target or customPlotDetail
  const resolvedExperimentDetail =
    demoPlotData?.experimentDetail || experimentDetail || null;

  // Rule: strictly notes / additional info from demoPlotData or actual notes/usageMethod prop
  const resolvedNotes =
    demoPlotData?.notes ||
    demoPlotData?.visits?.[0]?.notes ||
    notes ||
    usageMethod ||
    null;

  // Build unified product list ensuring all products from planned target and actual baseline are present
  const unifiedProducts = useMemo(() => {
    const plannedList: any[] = (target as any)?.demoProducts || [];
    const actualList: any[] = demoPlotData?.demoProducts || [];

    const rows: Array<{
      id: string;
      productName: string;
      productCode?: string;
      unit: string;
      plannedQty: number | string | null;
      actualQty: number | string | null;
      remainingQty: number | string | null;
      applicationRate: string;
    }> = [];

    const matchedActualIndices = new Set<number>();

    // 1. Process all planned products (ActivityPlanProduct)
    if (plannedList.length > 0) {
      plannedList.forEach((planned, pIdx) => {
        let actualMatchIdx = actualList.findIndex((act, aIdx) => {
          if (matchedActualIndices.has(aIdx)) return false;
          if (
            planned.productId &&
            act.productId &&
            String(planned.productId) === String(act.productId)
          ) {
            return true;
          }
          if (
            planned.productName &&
            (act.productName || act.product?.name) &&
            planned.productName.trim().toLowerCase() ===
              (act.productName || act.product?.name).trim().toLowerCase()
          ) {
            return true;
          }
          return false;
        });

        if (
          actualMatchIdx === -1 &&
          actualList.length === plannedList.length &&
          !matchedActualIndices.has(pIdx)
        ) {
          actualMatchIdx = pIdx;
        }

        const act = actualMatchIdx !== -1 ? actualList[actualMatchIdx] : null;
        if (actualMatchIdx !== -1) {
          matchedActualIndices.add(actualMatchIdx);
        }

        const pName =
          act?.product?.name || act?.productName || planned.productName || "-";
        const pCode = act?.product?.productCode || planned.productCode;
        const pUnit =
          act?.unit ||
          act?.product?.unit ||
          act?.product?.packageSizeUnit ||
          planned.unit ||
          "";

        const plannedQty =
          planned.quantity != null && planned.quantity !== ""
            ? planned.quantity
            : null;
        const actualQty =
          act?.quantity != null && act?.quantity !== "" ? act.quantity : null;

        const rawRemaining =
          act?.remainingQuantity !== null &&
          act?.remainingQuantity !== undefined &&
          act?.remainingQuantity !== ""
            ? act.remainingQuantity
            : act?.remaining_quantity !== null &&
                act?.remaining_quantity !== undefined &&
                act?.remaining_quantity !== ""
              ? act.remaining_quantity
              : null;

        let resolvedRemaining: number | string | null = rawRemaining;
        if (
          resolvedRemaining === null &&
          plannedQty != null &&
          actualQty != null
        ) {
          const pNum = Number(plannedQty);
          const uNum = Number(actualQty);
          if (!isNaN(pNum) && !isNaN(uNum)) {
            resolvedRemaining = Math.max(0, pNum - uNum);
          }
        }

        rows.push({
          id: act?.id || planned.productId || `plan-${pIdx}`,
          productName: pName,
          productCode: pCode,
          unit: pUnit,
          plannedQty,
          actualQty,
          remainingQty: resolvedRemaining,
          applicationRate: act?.applicationRate || "-",
        });
      });
    }

    // 2. Add any remaining actual products not in planned list
    actualList.forEach((act, aIdx) => {
      if (matchedActualIndices.has(aIdx)) return;

      const pName = act.product?.name || act.productName || "-";
      const pCode = act.product?.productCode;
      const pUnit =
        act.unit || act.product?.unit || act.product?.packageSizeUnit || "";

      const plannedQtyVal =
        aIdx === 0 &&
        plannedList.length === 0 &&
        (target as any)?.demoProductQuantity != null
          ? (target as any).demoProductQuantity
          : null;

      const actualQty =
        act.quantity != null && act.quantity !== "" ? act.quantity : null;

      const rawRemaining =
        act.remainingQuantity !== null &&
        act.remainingQuantity !== undefined &&
        act.remainingQuantity !== ""
          ? act.remainingQuantity
          : act.remaining_quantity !== null &&
              act.remaining_quantity !== undefined &&
              act.remaining_quantity !== ""
            ? act.remaining_quantity
            : null;

      let resolvedRemaining: number | string | null = rawRemaining;
      if (
        resolvedRemaining === null &&
        plannedQtyVal != null &&
        actualQty != null
      ) {
        const pNum = Number(plannedQtyVal);
        const uNum = Number(actualQty);
        if (!isNaN(pNum) && !isNaN(uNum)) {
          resolvedRemaining = Math.max(0, pNum - uNum);
        }
      }

      rows.push({
        id: act.id || `act-${aIdx}`,
        productName: pName,
        productCode: pCode,
        unit: pUnit,
        plannedQty: plannedQtyVal,
        actualQty,
        remainingQty: resolvedRemaining,
        applicationRate: act.applicationRate || "-",
      });
    });

    // 3. Fallback for single product plan/actual
    if (
      rows.length === 0 &&
      (rawActualName !== "-" || rawPlannedName !== "-")
    ) {
      rows.push({
        id: "single-product",
        productName: rawActualName !== "-" ? rawActualName : rawPlannedName,
        productCode: actualCode || plannedCode || undefined,
        unit: actualUnit || plannedUnit || "",
        plannedQty:
          (target as any)?.demoProductQuantity != null
            ? (target as any).demoProductQuantity
            : null,
        actualQty: resolvedActualQuantity || null,
        remainingQty: null,
        applicationRate: "-",
      });
    }

    return rows;
  }, [
    (target as any)?.demoProducts,
    (target as any)?.demoProductQuantity,
    demoPlotData?.demoProducts,
    rawActualName,
    rawPlannedName,
    actualCode,
    plannedCode,
    actualUnit,
    plannedUnit,
    resolvedActualQuantity,
  ]);

  // Planned Target Items (strictly preserved in state/memory, UI hidden per requirement)
  const plannedTargetItems = [
    { label: "ประเภทงาน:", value: "ทำแปลงสาธิต (เริ่มทำแปลงใหม่)" },
    { label: "เกษตรกร / เจ้าของแปลง:", value: target.owner || "-" },
    { label: "พืชที่ทดสอบ:", value: target.crop || "-" },
    { label: "สินค้าที่วางแผน:", value: plannedProductDisplay || "-" },
    { label: "จำนวนแปลง / พื้นที่:", value: target.plots || "-" },
    ...(target.demoProductQuantity
      ? [
          {
            label: "จำนวนสินค้าที่ใช้:",
            value: plannedUnit
              ? `${target.demoProductQuantity} ${plannedUnit}`
              : `${target.demoProductQuantity}`,
          },
        ]
      : []),
    ...(target.experimentDetail || target.detail
      ? [
          {
            label: "รายละเอียดการทดลอง:",
            value: target.experimentDetail || target.detail,
          },
        ]
      : []),
  ];

  return (
    <div className="border border-emerald-200/80 rounded-2xl p-4 sm:p-5 md:p-6 bg-white space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <Sprout className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-emerald-950 text-base md:text-lg">
              ทำแปลงสาธิต (เริ่มทำแปลงใหม่)
            </h2>
            <span className="text-xs text-emerald-700 font-medium">
              บันทึกผลการจัดทำแปลงสาธิตใหม่ สินค้าที่ใช้จริง
              และภาพถ่ายสภาพแปลงเริ่มต้น
            </span>
          </div>
        </div>

        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
        >
          NEW DEMO PLOT
        </Badge>
      </div>

      {/* SECTION 1: PLANNED TARGET CARD (Hidden per requirement - data preserved) */}

      {/* SECTION 2: READ-ONLY RESULT DISPLAY */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span>ผลการจัดทำแปลงสาธิตเริ่มต้น (Actual Baseline)</span>
        </div>

        {/* ข้อมูลแปลงสาธิตจริงจาก DemoPlot Baseline */}
        {demoPlotData && (
          <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-700" />
                ข้อมูลแปลงสาธิตจริง (Demo Plot Actual Baseline)
              </span>
              {demoPlotData.code && (
                <Badge
                  variant="outline"
                  className="bg-white text-emerald-800 border-emerald-300 font-mono text-[11px]"
                >
                  รหัสแปลง: {demoPlotData.code}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium block">
                  ร้านค้าตัวแทนจำหน่าย (Dealer):
                </span>
                <span className="font-bold text-slate-900">
                  {demoPlotData.customer?.name
                    ? `${demoPlotData.customer.name}${demoPlotData.customer.customerCode ? ` (${demoPlotData.customer.customerCode})` : ""}`
                    : "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">
                  ชื่อแปลงสาธิต:
                </span>
                <span className="font-bold text-slate-900">
                  {demoPlotData.name || plotName || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">
                  ที่ตั้งแปลง:
                </span>
                <span className="font-bold text-slate-900">
                  {demoPlotData.district ? `อ.${demoPlotData.district} ` : ""}
                  {demoPlotData.province ? `จ.${demoPlotData.province}` : "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">
                  หมวดหมู่พืช:
                </span>
                <span className="font-bold text-slate-900">
                  {demoPlotData.cropCategory || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">
                  พืชที่ทดสอบ:
                </span>
                <span className="font-bold text-slate-900">
                  {demoPlotData.cropName || "-"}
                  {demoPlotData.customCropName
                    ? ` (${demoPlotData.customCropName})`
                    : ""}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">
                  {["พืชไร่", "ผักและพืชล้มลุก"].includes(
                    demoPlotData.cropCategory,
                  )
                    ? "ขนาดพื้นที่:"
                    : "จำนวนต้น:"}
                </span>
                <span className="font-bold text-slate-900">
                  {["พืชไร่", "ผักและพืชล้มลุก"].includes(
                    demoPlotData.cropCategory,
                  )
                    ? demoPlotData.areaRai
                      ? `${demoPlotData.areaRai} ไร่`
                      : "-"
                    : demoPlotData.treeCount
                      ? `${demoPlotData.treeCount} ต้น`
                      : "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">
                  วัตถุประสงค์:
                </span>
                <span className="font-bold text-slate-900">
                  {demoPlotData.objective || plotObjective || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">
                  ข้อมูลพืชประธาน:
                </span>
                <span className="font-bold text-slate-900">
                  {demoPlotData.mainCropInfo ||
                    demoPlotData.plantingAreaCondition ||
                    "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">
                  วันที่เริ่มปลูกจริง:
                </span>
                <span className="font-bold text-slate-900">
                  {demoPlotData.plantingDate
                    ? formatThaiDate(demoPlotData.plantingDate)
                    : "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">
                  วันที่ฉีดพ่น:
                </span>
                <span className="font-bold text-slate-900">
                  {demoPlotData.initialSprayDate
                    ? formatThaiDate(demoPlotData.initialSprayDate)
                    : "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">
                  กำหนดฉีดพ่นครั้งต่อไป:
                </span>
                <span className="font-bold text-slate-900">
                  {demoPlotData.nextSprayDate
                    ? formatThaiDate(demoPlotData.nextSprayDate)
                    : "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">
                  วิธีการฉีดพ่น:
                </span>
                <span className="font-bold text-slate-900">
                  {demoPlotData.sprayMethod === "SINGLE"
                    ? "ฉีดเดี่ยว (Single)"
                    : demoPlotData.sprayMethod === "TANK_MIXED"
                      ? "ผสมถัง (Tank-mixed)"
                      : demoPlotData.sprayMethod || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">
                  ระบบน้ำ:
                </span>
                <span className="font-bold text-slate-900">
                  {demoPlotData.irrigations &&
                  demoPlotData.irrigations.length > 0
                    ? demoPlotData.irrigations
                        .map((i: any) => i.method)
                        .join(", ")
                    : "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">
                  อายุพืช:
                </span>
                <span className="font-bold text-slate-900">
                  {resolvedCropAge
                    ? `${resolvedCropAge} ${resolvedCropAgeUnit}`
                    : "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">
                  ระยะการเจริญเติบโต (Stage):
                </span>
                <span className="font-bold text-slate-900">
                  {resolvedGrowthStage || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">
                  เกษตรกรเจ้าของแปลง:
                </span>
                <span className="font-bold text-slate-900">
                  {demoPlotData.ownerName ||
                    demoPlotData.farmerName ||
                    demoPlotData.farmer?.name ||
                    demoPlotData.farmerCustomer?.name ||
                    "-"}
                  {demoPlotData.ownerPhone ||
                  demoPlotData.farmerPhone ||
                  demoPlotData.farmer?.phone ||
                  demoPlotData.farmerCustomer?.phone
                    ? ` (${demoPlotData.ownerPhone || demoPlotData.farmerPhone || demoPlotData.farmer?.phone || demoPlotData.farmerCustomer?.phone})`
                    : ""}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">
                  จังหวัดเกษตรกร:
                </span>
                <span className="font-bold text-slate-900">
                  {demoPlotData.ownerProvince ||
                    demoPlotData.farmerCustomer?.province ||
                    demoPlotData.farmer?.province ||
                    "-"}
                </span>
              </div>
              {(demoPlotData.latitude || demoPlotData.longitude) && (
                <div>
                  <span className="text-slate-500 font-medium block">
                    พิกัดแปลง (Lat, Long):
                  </span>
                  <span className="font-bold text-slate-900 font-mono text-[11px]">
                    {demoPlotData.latitude || "-"},{" "}
                    {demoPlotData.longitude || "-"}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {/* แปลงเกษตรของเกษตรกร */}
          {(() => {
            const resolvedDemoPlotId = demoPlotId || firstResult?.demoPlotId;
            const isOtherPlot =
              resolvedDemoPlotId === "OTHER" ||
              resolvedDemoPlotId?.startsWith("OTHER:") ||
              Boolean(customPlotDetail);
            const resolvedCustomDetail =
              customPlotDetail ||
              (resolvedDemoPlotId?.startsWith("OTHER:")
                ? resolvedDemoPlotId.replace("OTHER:", "")
                : "");

            return (
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5">
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  แปลงเกษตรของเกษตรกร
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                  {isOtherPlot
                    ? "แปลงอื่นๆ"
                    : demoPlotData?.name ||
                      (resolvedDemoPlotId && resolvedDemoPlotId !== "OTHER"
                        ? `แปลงรหัส ${resolvedDemoPlotId}`
                        : "-")}
                </span>
                {isOtherPlot && resolvedCustomDetail && (
                  <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200 mt-1">
                    <span className="font-semibold text-slate-700 block mb-0.5">
                      รายละเอียดแปลง:
                    </span>
                    <span className="whitespace-pre-wrap">
                      {resolvedCustomDetail}
                    </span>
                  </div>
                )}
                {!isOtherPlot && demoPlotData?.code && (
                  <span className="text-[11px] text-slate-500 font-mono block">
                    รหัสแปลง: {demoPlotData.code}
                  </span>
                )}
              </div>
            );
          })()}

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              วันที่เริ่มปลูกจริง
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {demoPlotData?.plantingDate
                ? formatThaiDate(demoPlotData.plantingDate)
                : plantingDate
                  ? formatThaiDate(plantingDate)
                  : "-"}
            </span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              ข้อมูลพืชประธาน / สภาพพื้นที่ปลูกตอนเริ่มต้น
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {demoPlotData?.mainCropInfo ||
                demoPlotData?.plantingAreaCondition ||
                plantingAreaCondition ||
                "-"}
            </span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              อายุพืช
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {resolvedCropAge
                ? `${resolvedCropAge} ${resolvedCropAgeUnit}`
                : "-"}
            </span>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
            <span className="text-xs text-slate-500 font-medium block">
              ระยะการเจริญเติบโต (Stage)
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
              {resolvedGrowthStage || "-"}
            </span>
          </div>

          {(demoPlotData?.objective ||
            firstResult?.plotObjective ||
            plotObjective) && (
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-3">
              <span className="text-xs text-slate-500 font-medium block">
                วัตถุประสงค์ของแปลง
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
                {demoPlotData?.objective ||
                  firstResult?.plotObjective ||
                  plotObjective}
              </span>
            </div>
          )}

          {/* Demonstration Products Responsive Table */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-3 sm:col-span-2 md:col-span-3">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-700" />
                สินค้าที่จะสาธิต
              </span>
              {unifiedProducts.length > 0 ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-800 border-emerald-300 font-medium text-xs"
                >
                  {unifiedProducts.length} รายการ
                </Badge>
              ) : isProductChanged ? (
                <Badge
                  variant="outline"
                  className="bg-amber-100 text-amber-900 border-amber-300 font-bold gap-1 text-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  ⚠️ มีการเปลี่ยนสินค้าหน้างาน
                </Badge>
              ) : null}
            </div>

            {unifiedProducts.length > 0 ? (
              <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                <table className="w-full min-w-[560px] text-xs divide-y divide-slate-200/70 text-left">
                  <thead className="bg-slate-50/90 text-slate-600 font-semibold">
                    <tr>
                      <th scope="col" className="py-2.5 px-3 w-12 text-center">
                        ลำดับ
                      </th>
                      <th scope="col" className="py-2.5 px-3 min-w-[170px]">
                        สินค้า
                      </th>
                      <th
                        scope="col"
                        className="py-2.5 px-3 text-right whitespace-nowrap min-w-[90px]"
                      >
                        จำนวนที่เบิก
                      </th>
                      <th scope="col" className="py-2.5 px-3 min-w-[130px]">
                        อัตราการใช้
                      </th>
                      <th
                        scope="col"
                        className="py-2.5 px-3 text-right whitespace-nowrap min-w-[90px]"
                      >
                        จำนวนที่ใช้จริง
                      </th>
                      <th
                        scope="col"
                        className="py-2.5 px-3 text-right whitespace-nowrap min-w-[90px]"
                      >
                        จำนวนคงเหลือ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {unifiedProducts.map((prod, idx) => {
                      const plannedDisplay =
                        prod.plannedQty != null && prod.plannedQty !== ""
                          ? `${prod.plannedQty} ${prod.unit}`.trim()
                          : "-";
                      const actualDisplay =
                        prod.actualQty != null && prod.actualQty !== ""
                          ? `${prod.actualQty} ${prod.unit}`.trim()
                          : "-";
                      const remainingDisplay =
                        prod.remainingQty != null && prod.remainingQty !== ""
                          ? `${prod.remainingQty} ${prod.unit}`.trim()
                          : "-";

                      return (
                        <tr
                          key={prod.id || idx}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">
                              {prod.productName}
                            </div>
                            {prod.productCode && (
                              <div className="text-[11px] text-slate-500 font-mono">
                                {prod.productCode}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-700 whitespace-nowrap">
                            {plannedDisplay}
                          </td>
                          <td className="py-2.5 px-3 text-emerald-800 font-medium">
                            {prod.applicationRate || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                            {actualDisplay}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-blue-700 whitespace-nowrap">
                            {remainingDisplay}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                ไม่มีรายการสินค้าที่บันทึก
              </div>
            )}

            {resolvedChangeReason && (
              <div className="p-3 bg-amber-50/60 border border-amber-200/90 rounded-xl space-y-1 text-xs">
                <span className="font-bold text-amber-900 block">
                  เหตุผลที่เปลี่ยนหน้างาน:
                </span>
                <p className="text-amber-900 leading-relaxed font-medium bg-white/70 p-2 rounded-lg border border-amber-200/60">
                  {resolvedChangeReason}
                </p>
              </div>
            )}
          </div>

          {/* ยาภายนอก / สารเคมีร่วม (External Products) */}
          {demoPlotData?.externalProducts &&
            demoPlotData.externalProducts.length > 0 && (
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5 sm:col-span-2 md:col-span-3">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 text-amber-700" />
                    ยาภายนอก / สารเคมีร่วม (External Products)
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-800 border-amber-300 text-[11px] font-medium"
                  >
                    {demoPlotData.externalProducts.length} รายการ
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {demoPlotData.externalProducts.map(
                    (ext: any, idx: number) => {
                      const formulaDisplay =
                        ext.formula === "OTHER"
                          ? ext.customFormula
                            ? `อื่นๆ (${ext.customFormula})`
                            : "อื่นๆ"
                          : ext.formula || "-";
                      return (
                        <div
                          key={ext.id || idx}
                          className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-sm">
                              {ext.productName || "-"}
                            </span>
                            {ext.company && (
                              <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {ext.company}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-100">
                            <div>
                              <span className="text-slate-400 block text-[11px]">
                                สารออกฤทธิ์:
                              </span>
                              <span className="font-medium text-slate-800">
                                {ext.activeIngredient || "-"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[11px]">
                                สูตร:
                              </span>
                              <span className="font-medium text-slate-800">
                                {formulaDisplay}
                              </span>
                            </div>
                          </div>
                          {ext.applicationRate && (
                            <div className="pt-1 text-slate-600">
                              <span className="text-slate-400 text-[11px]">
                                อัตราการใช้:{" "}
                              </span>
                              <span className="font-semibold text-slate-800">
                                {ext.applicationRate}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            )}

          {/* วิธีการทดลอง / แผนการทดสอบ */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-3">
            <span className="text-xs text-slate-500 font-medium block">
              วิธีการทดลอง / แผนการทดสอบ
            </span>
            <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
              {resolvedExperimentDetail || "-"}
            </p>
          </div>

          {/* ข้อมูลเพิ่มเติม */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1 sm:col-span-2 md:col-span-3">
            <span className="text-xs text-slate-500 font-medium block">
              ข้อมูลเพิ่มเติม
            </span>
            <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
              {resolvedNotes || "-"}
            </p>
          </div>
        </div>

        {/* DEMO PHOTOS (CROP & PLOT IMAGES) */}
        {(cropImages.length > 0 || plotImages.length > 0) && (
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-4">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              ภาพถ่ายสภาพแปลงเริ่มต้น (Initial Demonstration Photos)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cropImages.length > 0 && (
                <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200/70">
                  <span className="text-xs font-semibold text-slate-700 block">
                    ภาพถ่ายสภาพพืชเริ่มต้น ({cropImages.length} รูป)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {cropImages.map((img, i) => (
                      <button
                        key={img.id || i}
                        type="button"
                        onClick={() =>
                          openLightbox("ภาพถ่ายสภาพพืชเริ่มต้น", cropImages, i)
                        }
                        className="group relative aspect-video rounded-md overflow-hidden bg-slate-100 border border-slate-200 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.name || `ภาพสภาพพืชที่ ${i + 1}`}
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
                    ภาพถ่ายสภาพแปลงเริ่มต้น ({plotImages.length} รูป)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {plotImages.map((img, i) => (
                      <button
                        key={img.id || i}
                        type="button"
                        onClick={() =>
                          openLightbox("ภาพถ่ายสภาพแปลงเริ่มต้น", plotImages, i)
                        }
                        className="group relative aspect-video rounded-md overflow-hidden bg-slate-100 border border-slate-200 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
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
