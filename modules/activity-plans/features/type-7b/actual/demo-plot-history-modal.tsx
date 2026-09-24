"use client";

import React, { useState, useMemo } from "react";
import { isType7bCompletedFollowUpVisit } from "@/modules/activity-plans/features/shared/actual-view/utils";
import {
  X,
  Calendar,
  Clock,
  Sprout,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Info,
  Package,
  User,
  ExternalLink,
  FlaskConical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface DemoPlotHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  plot: {
    id?: string;
    code?: string;
    name?: string;
    ownerName?: string;
    cropCategory?: string;
    cropName?: string;
    targetCrop?: string;
    primaryProductName?: string;
    productName?: string;
    showcase?: string;
    areaRai?: number | string | null;
    treeCount?: number | string | null;
    location?: string | null;
    startDate?: string | Date;
    plantingDate?: string | Date | null;
    plantingAreaCondition?: string | null;
    usageMethod?: string | null;
    objective?: string | null;
    experimentDetail?: string | null;
    status?: string;
    visitsCount?: number;
    daysSinceStart?: number;
    totalCost?: number;
    plotName?: string;
    customer?: any;
    dealerName?: string | null;
    farmerCustomer?: any;
    farmerName?: string | null;
    farmerPhone?: string | null;
    customCropName?: string | null;
    mainCropInfo?: string | null;
    initialSprayDate?: string | Date | null;
    nextSprayDate?: string | Date | null;
    sprayMethod?: string | null;
    irrigations?: any[];
    cropAgeValue?: number | string | null;
    cropAgeUnit?: string | null;
    growthStage?: string | null;
    ownerPhone?: string | null;
    ownerProvince?: string | null;
    province?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    demoProducts?: any[];
    externalProducts?: any[];
    unifiedProducts?: any[];
    cropImages?: any[];
    plotImages?: any[];
    cropImageUrls?: string[];
    plotImageUrls?: string[];
    baselineVisit?: any;
    sprayRounds?: any[];
    notes?: string | null;
    visits?: Array<{
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
      cropImageUrls?: string[];
      plotImageUrls?: string[];
      imageUrls?: string[];
      notes?: string | null;
      activityPlan?: {
        id: string;
        code?: string;
        title?: string;
        startDate?: string | Date;
        status?: string;
        activityType?: {
          id?: string;
          code?: string;
          name?: string;
        } | null;
        workTypes?: Array<{
          activityType?: {
            id?: string;
            code?: string;
            name?: string;
          } | null;
        }>;
        result?: {
          id?: string;
          resultStatus?: string;
          resultSummary?: string;
          sprayRounds?: any[];
          [key: string]: any;
        } | null;
      } | null;
    }>;
  } | null;
}

export function DemoPlotHistoryModal({
  isOpen,
  onClose,
  plot,
}: DemoPlotHistoryModalProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [expandedVisits, setExpandedVisits] = useState<Record<string, boolean>>(
    {},
  );
  const [isInitialSetupExpanded, setIsInitialSetupExpanded] =
    useState<boolean>(false);

  const visits = useMemo(() => {
    if (!plot?.visits) return [];
    return (plot.visits as any[]).filter(isType7bCompletedFollowUpVisit);
  }, [plot?.visits]);
  const totalVisits = visits.length;

  const baselineVisit = useMemo(() => {
    if (!plot) return null;
    if (plot.baselineVisit) return plot.baselineVisit;
    const all = (plot.visits as any[]) || [];
    return (
      all.find(
        (v: any) =>
          v.workTypeCode === "TYPE_7A" ||
          v.activityPlan?.workTypes?.some(
            (wt: any) =>
              wt.activityType?.code === "TYPE_7A" ||
              wt.workTypeCode === "TYPE_7A",
          ) ||
          v.activityPlan?.activityType?.code === "TYPE_7A",
      ) ||
      all.find((v: any) => !isType7bCompletedFollowUpVisit(v)) ||
      all[0] ||
      null
    );
  }, [plot]);

  const productRows = useMemo(() => {
    if (!plot) return [];
    if (plot.unifiedProducts && plot.unifiedProducts.length > 0) {
      return plot.unifiedProducts;
    }
    const demoProds = (plot.demoProducts as any[]) || [];
    if (demoProds.length > 0) {
      return demoProds.map((dp: any, idx: number) => ({
        id: dp.id || `prod-${idx}`,
        productName: dp.product?.name || dp.productName || "-",
        productCode: dp.product?.productCode || dp.productCode,
        unit: dp.unit || dp.product?.unit || dp.product?.packageSizeUnit || "",
        plannedQty: dp.plannedQuantity ?? dp.plannedQty ?? null,
        actualQty: dp.actualQuantity ?? dp.quantity ?? dp.actualQty ?? null,
        remainingQty: dp.remainingQuantity ?? dp.remainingQty ?? null,
        applicationRate: dp.applicationRate || "-",
      }));
    }
    if (plot.primaryProductName || plot.productName || plot.showcase) {
      return [
        {
          id: "single-product",
          productName:
            plot.primaryProductName || plot.productName || plot.showcase || "-",
          productCode: undefined,
          unit: "",
          plannedQty: null,
          actualQty: null,
          remainingQty: null,
          applicationRate: "-",
        },
      ];
    }
    return [];
  }, [plot]);

  const externalProductsList = useMemo(() => {
    return (plot?.externalProducts as any[]) || [];
  }, [plot?.externalProducts]);

  const initialCropPhotos: string[] = useMemo(() => {
    if (!plot) return [];
    if (plot.cropImages && plot.cropImages.length > 0) {
      return plot.cropImages.map((img: any) => img.url || img.fileUrl || img);
    }
    if (plot.cropImageUrls && plot.cropImageUrls.length > 0) {
      return plot.cropImageUrls;
    }
    if (
      baselineVisit?.cropImageUrls &&
      baselineVisit.cropImageUrls.length > 0
    ) {
      return baselineVisit.cropImageUrls;
    }
    return [];
  }, [plot, baselineVisit]);

  const initialPlotPhotos: string[] = useMemo(() => {
    if (!plot) return [];
    if (plot.plotImages && plot.plotImages.length > 0) {
      return plot.plotImages.map((img: any) => img.url || img.fileUrl || img);
    }
    if (plot.plotImageUrls && plot.plotImageUrls.length > 0) {
      return plot.plotImageUrls;
    }
    if (
      baselineVisit?.plotImageUrls &&
      baselineVisit.plotImageUrls.length > 0
    ) {
      return baselineVisit.plotImageUrls;
    }
    if (baselineVisit?.imageUrls && baselineVisit.imageUrls.length > 0) {
      return baselineVisit.imageUrls;
    }
    return [];
  }, [plot, baselineVisit]);

  const resolvedCropAge =
    plot?.cropAgeValue !== null &&
    plot?.cropAgeValue !== undefined &&
    plot?.cropAgeValue !== ""
      ? String(plot.cropAgeValue)
      : baselineVisit?.cropAgeValue !== null &&
          baselineVisit?.cropAgeValue !== undefined
        ? String(baselineVisit.cropAgeValue)
        : null;

  const resolvedCropAgeUnit =
    plot?.cropAgeUnit || baselineVisit?.cropAgeUnit || "วัน";

  const resolvedGrowthStage =
    plot?.growthStage || baselineVisit?.growthStage || null;

  const resolvedExperimentDetail =
    plot?.experimentDetail || baselineVisit?.experimentDetail || null;

  const resolvedNotes =
    plot?.notes || baselineVisit?.notes || plot?.usageMethod || null;

  if (!plot) return null;

  const toggleVisit = (id: string) => {
    setExpandedVisits((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  const formatDate = (d?: string | Date | null) => {
    if (!d) return "-";
    try {
      const date = new Date(d);
      return date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return String(d);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50 rounded-2xl border-slate-200">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs",
                    plot.status === "COMPLETED"
                      ? "bg-emerald-700 text-emerald-100 border-emerald-400/40"
                      : plot.status === "FAILED"
                        ? "bg-red-700 text-red-100 border-red-400/40"
                        : "bg-sky-700 text-sky-100 border-sky-400/35",
                  )}
                >
                  {plot.status === "COMPLETED"
                    ? "ปิดแปลงสมบูรณ์"
                    : plot.status === "FAILED"
                      ? "ยุติการทดลอง"
                      : "กำลังทดลอง"}
                </span>
                <span className="text-xs text-emerald-200 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  บันทึกแล้ว {totalVisits} ครั้ง
                </span>
              </div>
              <DialogTitle className="text-lg font-bold tracking-tight text-white">
                ชื่อแปลง : {plot.name || ""}
              </DialogTitle>
              <DialogDescription className="sr-only">
                ประวัติการติดตามแปลงสาธิตและผลการตรวจแปลง
              </DialogDescription>
            </div>
          </div>

          {/* Master Plot Reference Strip */}
          <div className="bg-white border-b border-slate-200 px-5 py-3 text-xs grid grid-cols-2 sm:grid-cols-2 gap-3 text-slate-700 shadow-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">
                  เจ้าของแปลง
                </span>
                <span className="font-bold text-slate-800">
                  {plot.ownerName || "-"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">พืช</span>
                <span className="font-bold text-slate-800">
                  {plot.targetCrop || plot.cropName || "-"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">
                  สินค้าสาธิตหลัก
                </span>
                <span className="font-bold text-emerald-700">
                  {plot.showcase ||
                    plot.primaryProductName ||
                    plot.productName ||
                    "-"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">
                  วันเริ่มแปลง / วันปลูก
                </span>
                <span className="font-bold text-slate-800">
                  {formatDate(plot.plantingDate || plot.startDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Timeline Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Master Initial Setup Card (Actual Baseline) */}
            <div className="bg-white rounded-2xl border border-emerald-200/90 shadow-xs overflow-hidden">
              {/* Card Header with Collapse Toggle */}
              <div
                onClick={() =>
                  setIsInitialSetupExpanded(!isInitialSetupExpanded)
                }
                className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between cursor-pointer hover:bg-emerald-100/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2 flex-wrap">
                      <span>ข้อมูลตั้งต้นตอนเริ่มทำแปลง (Initial Setup)</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-850 text-[10px] font-bold border border-emerald-300">
                        วันเริ่มแปลง{" "}
                        {formatDate(plot.plantingDate || plot.startDate)}
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-200/50 transition-colors"
                  >
                    {isInitialSetupExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsible Content */}
              {isInitialSetupExpanded && (
                <div className="p-4 sm:p-5 space-y-4">
                  {/* ข้อมูลแปลงสาธิตจริง (Demo Plot Actual Baseline) */}
                  <div className="bg-emerald-50/40 border border-emerald-200/70 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <Sprout className="w-4 h-4 text-emerald-700" />
                        ข้อมูลแปลงสาธิตจริง (Demo Plot Actual Baseline)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 font-medium block">
                          ชื่อแปลงสาธิต:
                        </span>
                        <span className="font-bold text-slate-900">
                          {plot.name || plot.plotName || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">
                          ร้านค้าตัวแทนจำหน่าย (Dealer):
                        </span>
                        <span className="font-bold text-slate-900">
                          {plot.customer?.name || plot.dealerName || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">
                          หมวดหมู่พืช:
                        </span>
                        <span className="font-bold text-slate-900">
                          {plot.cropCategory || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">
                          พืชที่ทดสอบ:
                        </span>
                        <span className="font-bold text-slate-900">
                          {plot.cropName || plot.targetCrop || "-"}
                          {plot.customCropName
                            ? ` (${plot.customCropName})`
                            : ""}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">
                          {["พืชไร่", "ผักและพืชล้มลุก"].includes(
                            plot.cropCategory || "",
                          )
                            ? "ขนาดพื้นที่:"
                            : "จำนวนต้น:"}
                        </span>
                        <span className="font-bold text-slate-900">
                          {["พืชไร่", "ผักและพืชล้มลุก"].includes(
                            plot.cropCategory || "",
                          )
                            ? plot.areaRai
                              ? `${plot.areaRai} ไร่`
                              : "-"
                            : plot.treeCount
                              ? `${plot.treeCount} ต้น`
                              : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">
                          ข้อมูลพืชประธาน:
                        </span>
                        <span className="font-bold text-slate-900">
                          {plot.mainCropInfo ||
                            plot.plantingAreaCondition ||
                            "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">
                          วันที่เริ่มปลูกจริง:
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatDate(plot.plantingDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">
                          วันที่ฉีดพ่น:
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatDate(
                            plot.initialSprayDate || baselineVisit?.visitDate,
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">
                          กำหนดฉีดพ่นครั้งต่อไป:
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatDate(plot.nextSprayDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">
                          วิธีการฉีดพ่น:
                        </span>
                        <span className="font-bold text-slate-900">
                          {plot.sprayMethod === "SINGLE"
                            ? "ฉีดเดี่ยว (Single)"
                            : plot.sprayMethod === "TANK_MIXED"
                              ? "ผสมถัง (Tank-mixed)"
                              : plot.sprayMethod || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">
                          ระบบน้ำ:
                        </span>
                        <span className="font-bold text-slate-900">
                          {plot.irrigations && plot.irrigations.length > 0
                            ? plot.irrigations
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
                          {plot.ownerName ||
                            plot.farmerCustomer?.name ||
                            plot.farmerName ||
                            "-"}
                          {plot.ownerPhone ||
                          plot.farmerCustomer?.phone ||
                          plot.farmerPhone
                            ? ` (${plot.ownerPhone || plot.farmerCustomer?.phone || plot.farmerPhone})`
                            : ""}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">
                          จังหวัดเกษตรกร:
                        </span>
                        <span className="font-bold text-slate-900">
                          {plot.ownerProvince ||
                            plot.farmerCustomer?.province ||
                            plot.province ||
                            "-"}
                        </span>
                      </div>
                      {(plot.latitude || plot.longitude) && (
                        <div>
                          <span className="text-slate-500 font-medium block">
                            พิกัดแปลง (Lat, Long):
                          </span>
                          <span className="font-bold text-slate-900 font-mono text-[11px]">
                            {plot.latitude || "-"}, {plot.longitude || "-"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* สินค้าที่จะสาธิต (Demonstration Products) */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-emerald-700" />
                        สินค้าที่จะสาธิต
                      </span>
                      {productRows.length > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-800 border-emerald-300 font-medium text-xs"
                        >
                          {productRows.length} รายการ
                        </Badge>
                      )}
                    </div>

                    {productRows.length > 0 ? (
                      <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                        <table className="w-full min-w-[560px] text-xs divide-y divide-slate-200/70 text-left">
                          <thead className="bg-slate-50/90 text-slate-600 font-semibold">
                            <tr>
                              <th
                                scope="col"
                                className="py-2.5 px-3 w-12 text-center"
                              >
                                ลำดับ
                              </th>
                              <th
                                scope="col"
                                className="py-2.5 px-3 min-w-[170px]"
                              >
                                สินค้า
                              </th>
                              <th
                                scope="col"
                                className="py-2.5 px-3 text-right whitespace-nowrap min-w-[90px]"
                              >
                                จำนวนที่เบิก
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
                              <th
                                scope="col"
                                className="py-2.5 px-3 min-w-[130px]"
                              >
                                อัตราการใช้
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-800">
                            {productRows.map((prod: any, idx: number) => {
                              const plannedDisplay =
                                prod.plannedQty != null &&
                                prod.plannedQty !== ""
                                  ? `${prod.plannedQty} ${prod.unit || ""}`.trim()
                                  : "-";
                              const actualDisplay =
                                prod.actualQty != null && prod.actualQty !== ""
                                  ? `${prod.actualQty} ${prod.unit || ""}`.trim()
                                  : "-";
                              const remainingDisplay =
                                prod.remainingQty != null &&
                                prod.remainingQty !== ""
                                  ? `${prod.remainingQty} ${prod.unit || ""}`.trim()
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
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        {prod.productCode}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-semibold text-slate-700 whitespace-nowrap">
                                    {plannedDisplay}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                                    {actualDisplay}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-blue-700 whitespace-nowrap">
                                    {remainingDisplay}
                                  </td>
                                  <td className="py-2.5 px-3 text-emerald-800 font-medium">
                                    {prod.applicationRate || "-"}
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
                  </div>

                  {/* ยาภายนอก / สารเคมีร่วม (External Products) */}
                  {externalProductsList.length > 0 && (
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <FlaskConical className="w-4 h-4 text-amber-700" />
                          ยาภายนอก / สารเคมีร่วม (External Products)
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-800 border-amber-300 text-[11px] font-medium"
                        >
                          {externalProductsList.length} รายการ
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {externalProductsList.map((ext: any, idx: number) => {
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
                        })}
                      </div>
                    </div>
                  )}

                  {/* วิธีการทดลอง & ข้อมูลเพิ่มเติม */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
                      <span className="text-xs text-slate-500 font-medium block">
                        วิธีการทดลอง
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {resolvedExperimentDetail || "-"}
                      </p>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
                      <span className="text-xs text-slate-500 font-medium block">
                        ข้อมูลเพิ่มเติม
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {resolvedNotes || "-"}
                      </p>
                    </div>
                  </div>

                  {/* ภาพถ่ายสภาพแปลงเริ่มต้น (Initial Demonstration Photos) */}
                  {(initialCropPhotos.length > 0 ||
                    initialPlotPhotos.length > 0) && (
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-3">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                        ภาพถ่ายสภาพแปลงเริ่มต้น (Initial Demonstration Photos)
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {initialCropPhotos.length > 0 && (
                          <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200/70">
                            <span className="text-xs font-semibold text-slate-700 block">
                              🌿 ภาพถ่ายสภาพพืชเริ่มต้น (
                              {initialCropPhotos.length} รูป)
                            </span>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {initialCropPhotos.map(
                                (url: string, pIdx: number) => (
                                  <div
                                    key={pIdx}
                                    onClick={() => setSelectedPhoto(url)}
                                    className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:ring-2 hover:ring-emerald-500"
                                  >
                                    <img
                                      src={url}
                                      alt={`Initial Crop Photo ${pIdx + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <Maximize2 className="w-4 h-4 text-white" />
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                        {initialPlotPhotos.length > 0 && (
                          <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200/70">
                            <span className="text-xs font-semibold text-slate-700 block">
                              📷 ภาพถ่ายสภาพแปลงเริ่มต้น (
                              {initialPlotPhotos.length} รูป)
                            </span>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {initialPlotPhotos.map(
                                (url: string, pIdx: number) => (
                                  <div
                                    key={pIdx}
                                    onClick={() => setSelectedPhoto(url)}
                                    className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:ring-2 hover:ring-emerald-500"
                                  >
                                    <img
                                      src={url}
                                      alt={`Initial Plot Photo ${pIdx + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <Maximize2 className="w-4 h-4 text-white" />
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Visits Timeline */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  ลำดับประวัติการติดตาม (Timeline)
                </h3>
                <span className="text-xs text-slate-500">
                  ทั้งหมด {totalVisits} ครั้ง
                </span>
              </div>

              {visits.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">
                    ยังไม่มีบันทึกประวัติการติดตาม
                  </p>
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                  {visits.map((v, idx) => {
                    const isExpanded = expandedVisits[v.id] !== false; // Default expanded
                    const cropPhotos: string[] = v.cropImageUrls || [];
                    const plotPhotos: string[] =
                      v.plotImageUrls ||
                      (v.imageUrls && v.imageUrls.length > 0
                        ? v.imageUrls
                        : []);
                    const totalPhotos = cropPhotos.length + plotPhotos.length;

                    // 1. จำนวนวันหลังฉีดพ่น
                    const summaryText =
                      v.activityPlan?.result?.resultSummary || "";
                    const daysMatch = summaryText.match(
                      /จำนวนวันหลังฉีดพ่น:\s*(\d+)/,
                    );
                    const daysAfterSprayDisplay =
                      (v as any).daysAfterSpray != null &&
                      (v as any).daysAfterSpray !== ""
                        ? `${(v as any).daysAfterSpray} วัน`
                        : daysMatch && daysMatch[1]
                          ? `${daysMatch[1]} วัน`
                          : v.daysSinceStart !== null &&
                              v.daysSinceStart !== undefined &&
                              v.daysSinceStart !== ""
                            ? `${v.daysSinceStart} วัน`
                            : "-";

                    // 2. กำหนดฉีดพ่น / ติดตามครั้งต่อไป
                    const nextDateMatch = summaryText.match(
                      /(?:กำหนดฉีดพ่นครั้งต่อไป|กำหนดติดตามครั้งต่อไป|กำหนดฉีดพ่น \/ ติดตามครั้งต่อไป):\s*([^\n\r]+)/,
                    );
                    const nextSprayOrFollowUpDateDisplay = (v as any)
                      .nextSprayDate
                      ? formatDate((v as any).nextSprayDate)
                      : (v as any).nextFollowUpDate
                        ? formatDate((v as any).nextFollowUpDate)
                        : nextDateMatch && nextDateMatch[1]
                          ? formatDate(nextDateMatch[1].trim())
                          : plot.nextSprayDate
                            ? formatDate(plot.nextSprayDate)
                            : "-";

                    // 3. จำนวนรอบการฉีดพ่น
                    const roundsInPlan =
                      v.activityPlan?.result?.sprayRounds || [];
                    const matchedRoundsInPlot =
                      plot.sprayRounds && v.activityPlan?.result?.id
                        ? plot.sprayRounds.filter(
                            (sr: any) =>
                              sr.activityResultId ===
                              v.activityPlan?.result?.id,
                          )
                        : [];
                    const roundsMatch = summaryText.match(
                      /(?:การฉีดพ่น \(|จำนวนรอบการฉีดพ่น:\s*|ฉีดพ่น\s*)(\d+)\s*รอบ/,
                    );
                    const sprayRoundsCountDisplay =
                      roundsInPlan.length > 0
                        ? `${roundsInPlan.length} รอบ`
                        : matchedRoundsInPlot.length > 0
                          ? `${matchedRoundsInPlot.length} รอบ`
                          : roundsMatch && roundsMatch[1]
                            ? `${roundsMatch[1]} รอบ`
                            : (v as any).sprayRounds &&
                                Array.isArray((v as any).sprayRounds) &&
                                (v as any).sprayRounds.length > 0
                              ? `${(v as any).sprayRounds.length} รอบ`
                              : "1 รอบ";

                    // ผลการใช้ผลิตภัณฑ์
                    const responseMatch = summaryText.match(
                      /ผล:\s*(พืชตอบสนองดี|พบปัญหา|ยังไม่เห็นผลชัดเจน)/,
                    );
                    const resolvedResponse =
                      v.productResponse ||
                      (roundsInPlan.length > 0 &&
                        roundsInPlan[0].productResponse) ||
                      (responseMatch && responseMatch[1]) ||
                      "พืชตอบสนองดี";

                    return (
                      <div
                        key={v.id || idx}
                        className="relative pl-8 transition-all"
                      >
                        {/* Timeline Node Icon */}
                        <div className="absolute left-3.5 top-3 -translate-x-1/2 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-extrabold shadow-xs z-10 ring-4 ring-slate-50">
                          {idx + 1}
                        </div>

                        {/* Visit Card */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-emerald-300">
                          {/* Card Header */}
                          <div
                            onClick={() => toggleVisit(v.id)}
                            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="font-bold text-xs text-emerald-950">
                                การติดตามครั้งที่ {idx + 1}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                📅 {formatDate(v.visitDate)}
                              </span>
                              {v.activityPlan?.code &&
                                (v.activityPlan?.id ? (
                                  <a
                                    href={`/activity-plans/${v.activityPlan.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    title="คลิกเพื่อเปิดดูรายละเอียด Trip Plan ในแท็บใหม่"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-300 transition-colors"
                                  >
                                    <span>{v.activityPlan.code}</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono font-medium">
                                    {v.activityPlan.code}
                                  </span>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                              {totalPhotos > 0 && (
                                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                                  {totalPhotos} รูป
                                </span>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {/* Card Body */}
                          {isExpanded && (
                            <div className="p-4 pt-0 border-t border-slate-100 space-y-3.5 text-xs text-slate-700">
                              {/* Observation Status Badges */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
                                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                  <span className="text-slate-400 block text-[10px] font-semibold">
                                    จำนวนวันหลังฉีดพ่น
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {daysAfterSprayDisplay}
                                  </span>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                  <span className="text-slate-400 block text-[10px] font-semibold">
                                    กำหนดฉีดพ่น / ติดตามครั้งต่อไป
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {nextSprayOrFollowUpDateDisplay}
                                  </span>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                  <span className="text-slate-400 block text-[10px] font-semibold">
                                    จำนวนรอบการฉีดพ่น
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {sprayRoundsCountDisplay}
                                  </span>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                  <span className="text-slate-400 block text-[10px] font-semibold">
                                    ผลการใช้ผลิตภัณฑ์
                                  </span>
                                  <span
                                    className={cn(
                                      "font-bold flex items-center gap-1",
                                      resolvedResponse === "พืชตอบสนองดี"
                                        ? "text-emerald-700"
                                        : "text-amber-700",
                                    )}
                                  >
                                    {resolvedResponse === "พืชตอบสนองดี" ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                    ) : (
                                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    )}
                                    {resolvedResponse}
                                  </span>
                                </div>
                              </div>

                              {/* Problem Details */}
                              {v.productProblemDesc && (
                                <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 text-xs text-amber-900">
                                  <span className="font-semibold">
                                    ปัญหาการใช้ผลิตภัณฑ์:{" "}
                                  </span>
                                  <span>{v.productProblemDesc}</span>
                                </div>
                              )}

                              {/* Photo Galleries */}
                              {/* 1. Crop Images */}
                              {cropPhotos.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                    🌿 รูปสภาพพืช ({cropPhotos.length} รูป)
                                  </span>
                                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                    {cropPhotos.map(
                                      (url: string, pIdx: number) => (
                                        <div
                                          key={pIdx}
                                          onClick={() => setSelectedPhoto(url)}
                                          className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:ring-2 hover:ring-emerald-500"
                                        >
                                          <img
                                            src={url}
                                            alt={`Crop Photo ${pIdx + 1}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                          />
                                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Maximize2 className="w-4 h-4 text-white" />
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* 2. Plot Images */}
                              {plotPhotos.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                    📷 รูปภาพสภาพแปลง ({plotPhotos.length} รูป)
                                  </span>
                                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                    {plotPhotos.map(
                                      (url: string, pIdx: number) => (
                                        <div
                                          key={pIdx}
                                          onClick={() => setSelectedPhoto(url)}
                                          className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:ring-2 hover:ring-emerald-500"
                                        >
                                          <img
                                            src={url}
                                            alt={`Plot Photo ${pIdx + 1}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                          />
                                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Maximize2 className="w-4 h-4 text-white" />
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Link to Trip Plan Details */}
                              {v.activityPlan?.id && (
                                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                                  <span className="text-[11px] text-slate-500">
                                    บันทึกผลผ่านแผนงาน:{" "}
                                    <strong className="font-semibold text-slate-700">
                                      {v.activityPlan.code || "-"}
                                    </strong>
                                  </span>
                                  <a
                                    href={`/activity-plans/${v.activityPlan.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>ดูรายละเอียด</span>
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedPhoto}
              alt="Expanded Preview"
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain mx-auto"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
