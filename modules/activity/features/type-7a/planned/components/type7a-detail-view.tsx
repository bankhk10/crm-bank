"use client";

import React, { useState } from "react";
import {
  Sprout,
  MapPin,
  User,
  Package,
  Calendar,
  Camera,
  Navigation,
  ExternalLink,
  Phone,
  Store,
  Droplets,
  FlaskConical,
  Beaker,
  Clock,
  Sparkles,
  CheckCircle2,
  PlusCircle,
  HelpCircle,
  FileText,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Type7aDetailViewProps } from "../types/actual.types";
import { Type7aPlanCard } from "./type7a-plan-card";
import { Type7aPlotFollowUpTimeline } from "./type7a-plot-follow-up-timeline";
import { formatPhoneNumber } from "../../shared/utils";
import {
  ImageLightboxModal,
  type LightboxImage,
} from "@/components/custom/image-lightbox-modal";

/**
 * Format ISO or Date string into Thai Buddhist Era date format (e.g., 23 ต.ค. 2569)
 */
function formatThaiDate(dateStr?: string | Date | null): string {
  if (!dateStr) return "-";
  const str =
    typeof dateStr === "string"
      ? dateStr.split("T")[0]
      : new Date(dateStr).toISOString().split("T")[0];
  const parts = str.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10) + 543;
    const monthNames = [
      "ม.ค.",
      "ก.พ.",
      "มี.ค.",
      "เม.ย.",
      "พ.ค.",
      "มิ.ย.",
      "ก.ค.",
      "ส.ค.",
      "ก.ย.",
      "ต.ค.",
      "พ.ย.",
      "ธ.ค.",
    ];
    const month = monthNames[parseInt(parts[1], 10) - 1] || parts[1];
    const day = parseInt(parts[2], 10);
    return `${day} ${month} ${year}`;
  }
  return str;
}

export function Type7aDetailView({
  isVisible = true,
  plan,
  target,
  targets = [],
  actualResult,
  attachments = [],
  className,
}: Type7aDetailViewProps) {
  const [activePlotTab, setActivePlotTab] = useState(0);

  // Lightbox Modal state
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

  if (!isVisible) return null;

  // Resolve list of plots from targets, target, or plan
  const plotList: any[] =
    targets.length > 0
      ? targets
      : target
        ? [target]
        : Array.isArray(plan?.type7aTargets) && plan.type7aTargets.length > 0
          ? plan.type7aTargets
          : Array.isArray(plan?.type7aPlots) && plan.type7aPlots.length > 0
            ? plan.type7aPlots.map((p: any) => p.demoPlot || p)
            : [];

  const openLightbox = (
    title: string,
    imgs: Array<{ url: string; name?: string }>,
    initialIndex: number = 0,
  ) => {
    if (!imgs || imgs.length === 0) return;
    setLightboxState({
      isOpen: true,
      title,
      images: imgs.map((img, idx) => ({
        id: `img-${idx}`,
        url: img.url,
        name: img.name || `รูปที่ ${idx + 1}`,
      })),
      initialIndex,
    });
  };

  const closeLightbox = () => {
    setLightboxState((prev) => ({ ...prev, isOpen: false }));
  };

  // Convert plotList for Type7aPlanCard
  const planCardTargets = plotList.map((p: any) => ({
    id: p.id,
    plotName: p.plotName || p.name || "แปลงสาธิต",
    farmerName: p.farmerName || p.ownerName,
    ownerName: p.ownerName || p.farmerName,
    cropName: p.cropName || p.customCropName,
    cropCategory: p.cropCategory,
    areaRai: p.areaRai,
    province: p.province,
    district: p.district,
    objective: p.objective,
    demoProducts: (p.demoProducts || []).map((prod: any) => ({
      productName: prod.productName || prod.product?.name || "-",
      quantity: prod.quantity ?? prod.targetQuantity ?? 1,
      unit: prod.unit || prod.product?.unit || "ชิ้น",
    })),
  }));

  return (
    <div className={cn("space-y-6", className)}>
      {/* ─────────────────────────────────────────────────────────────
          1. ข้อมูลเป้าหมายตามแผนงาน (PLAN TARGET)
      ───────────────────────────────────────────────────────────── */}
      <Type7aPlanCard targets={planCardTargets} />

      {/* ─────────────────────────────────────────────────────────────
          2. ข้อมูลผลการปฏิบัติงานจริง (ACTUAL OUTCOME)
      ───────────────────────────────────────────────────────────── */}
      {plotList.map((plot: any, idx: number) => {
        const dp = plot.demoPlot || plan?.type7aPlots?.[idx] || plot;

        // Resolve Farmer Info & Coordinates
        const farmerName =
          plot.farmerName ||
          plot.ownerName ||
          dp?.ownerName ||
          dp?.farmerCustomer?.name ||
          actualResult?.t7FarmerName ||
          "-";
        const farmerPhone =
          plot.farmerPhone ||
          dp?.ownerPhone ||
          dp?.farmerCustomer?.phone ||
          actualResult?.t7FarmerPhone ||
          "";
        const isUnregistered = Boolean(
          plot.isUnregisteredFarmer ??
          dp?.isUnregisteredFarmer ??
          actualResult?.t7IsUnregisteredFarmer,
        );
        const dealerName =
          plot.dealerName ||
          dp?.customer?.name ||
          actualResult?.t7DealerName ||
          "";
        const dealerCode =
          plot.dealerCode ||
          dp?.customer?.customerCode ||
          actualResult?.t7DealerCode ||
          "";

        const subdistrict =
          plot.subdistrict ||
          dp?.ownerSubdistrict ||
          actualResult?.t7FarmerSubdistrict ||
          "";
        const district =
          plot.district ||
          dp?.ownerDistrict ||
          dp?.district ||
          actualResult?.t7FarmerDistrict ||
          "";
        const province =
          plot.province ||
          dp?.ownerProvince ||
          dp?.province ||
          actualResult?.t7FarmerProvince ||
          "";
        const addressText = [
          subdistrict ? `ต.${subdistrict}` : "",
          district ? `อ.${district}` : "",
          province ? `จ.${province}` : "",
        ]
          .filter(Boolean)
          .join(" ");

        const lat =
          plot.latitude != null
            ? Number(plot.latitude)
            : dp?.latitude != null
              ? Number(dp.latitude)
              : actualResult?.t7Latitude != null
                ? Number(actualResult.t7Latitude)
                : null;
        const lng =
          plot.longitude != null
            ? Number(plot.longitude)
            : dp?.longitude != null
              ? Number(dp.longitude)
              : actualResult?.t7Longitude != null
                ? Number(actualResult.t7Longitude)
                : null;
        const hasCoords =
          lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
        const googleMapsUrl = hasCoords
          ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
          : null;

        // Resolve Initial Condition & Observations
        const mainCropInfo =
          plot.mainCropInfo ||
          dp?.mainCropInfo ||
          actualResult?.t7MainCropInfo ||
          "";
        const experimentDetail =
          plot.experimentDetail ||
          dp?.experimentDetail ||
          actualResult?.t7ExperimentDetail ||
          "";
        const rawIrrigations =
          plot.irrigations && plot.irrigations.length > 0
            ? plot.irrigations
            : dp?.irrigations && dp.irrigations.length > 0
              ? dp.irrigations
              : actualResult?.t7Irrigations &&
                  actualResult.t7Irrigations.length > 0
                ? actualResult.t7Irrigations
                : [];
        const irrigations = rawIrrigations
          .map((i: any) => (typeof i === "string" ? i : i.method))
          .filter(Boolean);

        const plantingDate =
          plot.plantingDate ||
          dp?.plantingDate ||
          dp?.startDate ||
          actualResult?.t7PlantingDate;
        const initialSprayDate =
          plot.initialSprayDate ||
          dp?.initialSprayDate ||
          actualResult?.t7InitialSprayDate;
        const nextSprayDate =
          plot.nextSprayDate ||
          dp?.nextSprayDate ||
          actualResult?.t7NextSprayDate;

        const cropAgeValue =
          plot.cropAgeValue ??
          dp?.visits?.[0]?.cropAgeValue ??
          actualResult?.t7CropAgeValue ??
          null;
        const cropAgeUnit =
          plot.cropAgeUnit ||
          dp?.visits?.[0]?.cropAgeUnit ||
          actualResult?.t7CropAgeUnit ||
          "วัน";
        const growthStage =
          plot.growthStage ||
          dp?.visits?.[0]?.growthStage ||
          actualResult?.t7GrowthStage ||
          "";
        const notes =
          plot.notes ||
          dp?.notes ||
          dp?.visits?.[0]?.notes ||
          actualResult?.t7Notes ||
          "";

        // Resolve Spray Method & External Products
        const sprayMethod =
          plot.sprayMethod ||
          dp?.sprayMethod ||
          dp?.visits?.[0]?.sprayMethod ||
          actualResult?.t7SprayMethod ||
          "SINGLE";
        const isTankMixed =
          sprayMethod === "TANK_MIXED" ||
          sprayMethod === "ผสมถัง" ||
          Boolean(
            plot.hasExternalChemicals ||
            dp?.hasExternalChemicals ||
            actualResult?.t7HasExternalChemicals,
          );

        const rawExternals =
          plot.externalProducts && plot.externalProducts.length > 0
            ? plot.externalProducts
            : dp?.externalProducts && dp.externalProducts.length > 0
              ? dp.externalProducts
              : actualResult?.t7ExternalProducts || [];
        const externalProducts = Array.isArray(rawExternals)
          ? rawExternals
          : [];

        // Resolve Spray Equipment
        const sprayEquipment =
          plot.sprayEquipment ||
          dp?.sprayEquipment ||
          dp?.visits?.[0]?.sprayEquipment ||
          actualResult?.t7SprayEquipment ||
          "";
        const otherEquipment =
          plot.otherEquipment ||
          dp?.otherEquipment ||
          dp?.visits?.[0]?.otherEquipment ||
          actualResult?.t7OtherEquipment ||
          "";

        // Resolve Products (Planned vs Actual & Additional)
        const allProds =
          plot.demoProducts && plot.demoProducts.length > 0
            ? plot.demoProducts
            : dp?.demoProducts && dp.demoProducts.length > 0
              ? dp.demoProducts
              : [];

        const plannedProds = allProds
          .filter((p: any) => !p.isAdditional)
          .map((p: any) => ({
            productId: p.productId || p.product?.id || "",
            productName: p.productName || p.product?.name || "-",
            withdrawnQuantity:
              p.withdrawnQuantity != null
                ? Number(p.withdrawnQuantity)
                : p.quantity != null
                  ? Number(p.quantity)
                  : 1,
            actualQuantity:
              p.actualQuantity != null
                ? Number(p.actualQuantity)
                : p.quantity != null
                  ? Number(p.quantity)
                  : 1,
            extraQuantity:
              p.extraQuantity != null ? String(p.extraQuantity) : "",
            extraUnit:
              p.extraUnit ||
              (p.product?.unit?.includes("ซอง") ? "กรัม" : "ซีซี"),
            applicationRate: p.applicationRate || "",
          }));

        const effectivePlannedProds =
          plannedProds.length > 0
            ? plannedProds
            : actualResult?.t7PlannedProducts || [];

        const additionalProds = allProds
          .filter((p: any) => p.isAdditional)
          .map((p: any) => ({
            productId: p.productId || p.product?.id || "",
            productName: p.productName || p.product?.name || "-",
            actualQuantity: p.quantity != null ? Number(p.quantity) : 1,
            extraQuantity:
              p.extraQuantity != null ? String(p.extraQuantity) : "",
            extraUnit:
              p.extraUnit ||
              (p.product?.unit?.includes("ซอง") ? "กรัม" : "ซีซี"),
            applicationRate: p.applicationRate || "",
          }));

        const effectiveAdditionalProds =
          additionalProds.length > 0
            ? additionalProds
            : actualResult?.t7AdditionalProducts || [];

        // Resolve Photos
        const plotPhotos: Array<{ id?: string; url: string; name?: string }> =
          [];

        // 1. props.attachments
        if (Array.isArray(attachments)) {
          for (const att of attachments) {
            const url = att.url || att.fileUrl;
            if (url && !plotPhotos.some((p) => p.url === url)) {
              plotPhotos.push({
                id: att.id,
                url,
                name: att.name || att.fileName || "รูปถ่ายแปลงสาธิต",
              });
            }
          }
        }

        // 2. plot.attachments / dp.attachments
        const dpAtts = plot.attachments || dp?.attachments;
        if (Array.isArray(dpAtts)) {
          for (const att of dpAtts) {
            const url = att.url || att.fileUrl;
            if (url && !plotPhotos.some((p) => p.url === url)) {
              plotPhotos.push({
                id: att.id,
                url,
                name: att.name || att.fileName || "รูปถ่ายแปลงสาธิต",
              });
            }
          }
        }

        // 3. visit plotImageUrls / imageUrls
        const visitPhotos =
          dp?.visits?.[0]?.plotImageUrls || dp?.visits?.[0]?.imageUrls;
        if (Array.isArray(visitPhotos)) {
          for (const url of visitPhotos) {
            if (url && !plotPhotos.some((p) => p.url === url)) {
              plotPhotos.push({ url, name: "รูปถ่ายแปลงสาธิต" });
            }
          }
        }

        // 4. actualResult.t7InitialPhotos
        if (Array.isArray(actualResult?.t7InitialPhotos)) {
          for (const att of actualResult.t7InitialPhotos) {
            const url = att.url || att.fileUrl;
            if (url && !plotPhotos.some((p) => p.url === url)) {
              plotPhotos.push({
                id: att.id,
                url,
                name: att.name || att.fileName || "รูปถ่ายแปลงสาธิต",
              });
            }
          }
        }

        // Check whether actual outcome data or follow-up visits exist
        const hasFollowUps = Boolean(
          (dp?.visits && dp.visits.length > 0) ||
          (dp?.type7bPlots && dp.type7bPlots.length > 0) ||
          (dp?.sprayRounds && dp.sprayRounds.length > 0),
        );

        const hasActualData = Boolean(
          hasFollowUps ||
          plantingDate ||
          initialSprayDate ||
          nextSprayDate ||
          mainCropInfo ||
          experimentDetail ||
          irrigations.length > 0 ||
          sprayEquipment ||
          otherEquipment ||
          externalProducts.length > 0 ||
          effectiveAdditionalProds.length > 0 ||
          effectivePlannedProds.some(
            (p: any) =>
              p.applicationRate ||
              (p.extraQuantity && p.extraQuantity !== "") ||
              p.actualQuantity !== p.withdrawnQuantity,
          ) ||
          hasCoords ||
          plotPhotos.length > 0 ||
          notes ||
          growthStage ||
          cropAgeValue != null ||
          plan?.result ||
          actualResult?.activityResultStatus,
        );

        if (!hasActualData) {
          return null;
        }

        return (
          <div
            key={plot.id || idx}
            className="border-2 border-emerald-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 bg-white shadow-xs space-y-6"
          >
            {/* Header Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-emerald-100 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {idx + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                      {plot.plotName || plot.name || "แปลงสาธิต"}
                    </h3>
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold text-xs px-2.5 py-0.5"
                    >
                      ผลการปฏิบัติงานจริง (Actual)
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    บันทึกผลการจัดทำแปลงสาธิตหน้างานจริง (Trip Plan Actual)
                  </p>
                </div>
              </div>

              {plot.areaRai != null && (
                <span className="self-start sm:self-auto text-xs font-bold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-lg border border-emerald-200">
                  พื้นที่สาธิต {String(plot.areaRai)} ไร่
                  {plot.treeCount != null ? ` (${plot.treeCount} ต้น)` : ""}
                </span>
              )}
            </div>

            {/* ─── หมวดที่ 1: ข้อมูลเกษตรกรและพิกัดแปลง ─── */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-2">
                <User className="w-4 h-4 text-emerald-600" />
                <span>1. ข้อมูลเกษตรกรเจ้าของแปลงและพิกัดแปลง</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 bg-slate-50/70 p-4 rounded-xl border border-slate-150 text-xs">
                {/* Farmer Status & Name */}
                <div className="space-y-1">
                  <span className="text-slate-500 font-medium">
                    ชื่อเกษตรกร:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {farmerName}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.2",
                        isUnregistered
                          ? "bg-amber-50 text-amber-800 border-amber-300"
                          : "bg-blue-50 text-blue-800 border-blue-300",
                      )}
                    >
                      {isUnregistered ? "นอกระบบ" : "ในระบบ"}
                    </Badge>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <span className="text-slate-500 font-medium">
                    เบอร์โทรศัพท์:
                  </span>
                  {farmerPhone ? (
                    <a
                      href={`tel:${farmerPhone.replace(/\D/g, "")}`}
                      className="flex items-center gap-1.5 font-semibold text-emerald-700 hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{formatPhoneNumber(farmerPhone)}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 font-medium">-</span>
                  )}
                </div>

                {/* Dealer */}
                <div className="space-y-1">
                  <span className="text-slate-500 font-medium">
                    ร้านค้า Dealer:
                  </span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{dealerName || "-"}</span>
                    {dealerCode && (
                      <span className="text-[11px] text-slate-500 font-normal">
                        ({dealerCode})
                      </span>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-slate-500 font-medium">
                    ที่ตั้งแปลงสาธิต:
                  </span>
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{addressText || "-"}</span>
                  </div>
                </div>

                {/* Coordinates (GPS) */}
                <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                  <span className="text-slate-500 font-medium">
                    พิกัด GPS หน้างาน:
                  </span>
                  {hasCoords ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px]">
                        {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
                      </span>
                      {googleMapsUrl && (
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded-md transition-colors shadow-2xs"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Google Maps</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 font-medium">-</span>
                  )}
                </div>
              </div>
            </section>

            {/* ─── หมวดที่ 2: สภาพแปลงเริ่มต้น ─── */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-2">
                <Sprout className="w-4 h-4 text-emerald-600" />
                <span>
                  2. สภาพแปลงเริ่มต้น (Initial Plot Condition & Observations)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 bg-slate-50/70 p-4 rounded-xl border border-slate-150 text-xs">
                {/* Main Crop */}
                <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                  <span className="text-slate-500 font-medium">
                    ข้อมูลพืชประธาน:
                  </span>
                  <p className="font-medium text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200/80">
                    {mainCropInfo || "-"}
                  </p>
                </div>

                {/* Experiment detail */}
                {experimentDetail && (
                  <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                    <span className="text-slate-500 font-medium">
                      วิธีการทดลอง:
                    </span>
                    <p className="font-medium text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200/80">
                      {experimentDetail}
                    </p>
                  </div>
                )}

                {/* Irrigations */}
                <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-sky-600" />
                    <span>ระบบน้ำที่ใช้ในแปลง:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {irrigations.length > 0 ? (
                      irrigations.map((irr: string, iIdx: number) => (
                        <Badge
                          key={iIdx}
                          variant="outline"
                          className="bg-sky-50 text-sky-800 border-sky-300 font-semibold text-xs px-2.5 py-0.5"
                        >
                          💧 {irr}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-slate-400 font-medium">-</span>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200/80">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    วันที่เริ่มปลูกจริง:
                  </span>
                  <span className="font-bold text-slate-900 block text-sm">
                    {formatThaiDate(plantingDate)}
                  </span>
                </div>

                <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200/80">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    วันที่ฉีดพ่นครั้งแรก:
                  </span>
                  <span className="font-bold text-slate-900 block text-sm">
                    {formatThaiDate(initialSprayDate)}
                  </span>
                </div>

                <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200/80">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    กำหนดฉีดพ่นครั้งถัดไป:
                  </span>
                  <span className="font-bold text-slate-900 block text-sm">
                    {formatThaiDate(nextSprayDate)}
                  </span>
                </div>

                {/* Crop Age */}
                <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200/80">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    อายุพืช (หลังปลูก):
                  </span>
                  <span className="font-bold text-slate-900 block text-sm">
                    {cropAgeValue != null
                      ? `${cropAgeValue} ${cropAgeUnit}`
                      : "-"}
                  </span>
                </div>

                {/* Growth Stage */}
                <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200/80 sm:col-span-2">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    ระยะการเจริญเติบโต:
                  </span>
                  <span className="font-bold text-slate-900 block text-sm">
                    {growthStage || "-"}
                  </span>
                </div>

                {/* Notes */}
                {notes && (
                  <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                    <span className="text-slate-500 font-medium">
                      หมายเหตุ / ข้อมูลเพิ่มเติม:
                    </span>
                    <p className="font-medium text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/80">
                      {notes}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* ─── หมวดที่ 3: วิธีการฉีดพ่นและยาภายนอก ─── */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-2">
                <FlaskConical className="w-4 h-4 text-emerald-600" />
                <span>
                  3. วิธีการฉีดพ่นและยาภายนอก (Spray Method & Chemicals)
                </span>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-150 space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-medium">
                    วิธีการฉีดพ่น:
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-bold text-xs px-3 py-1",
                      isTankMixed
                        ? "bg-purple-50 text-purple-800 border-purple-300"
                        : "bg-emerald-50 text-emerald-800 border-emerald-300",
                    )}
                  >
                    {isTankMixed
                      ? "ผสมถัง (Tank-mixed) มียาภายนอก"
                      : "ฉีดพ่นเดี่ยว (Single)"}
                  </Badge>
                </div>

                {/* External Products Table (if any) */}
                {externalProducts.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200/60">
                    <span className="font-bold text-slate-800 block text-xs">
                      รายการยาภายนอก / สารเคมีอื่นที่ผสมร่วม (
                      {externalProducts.length} รายการ):
                    </span>
                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3 text-center w-10">
                              ลำดับ
                            </th>
                            <th className="py-2 px-3">บริษัทผู้ผลิต</th>
                            <th className="py-2 px-3">ชื่อการค้า</th>
                            <th className="py-2 px-3">สารออกฤทธิ์</th>
                            <th className="py-2 px-3 text-center">สูตร</th>
                            <th className="py-2 px-3 text-right">
                              อัตราการใช้
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                          {externalProducts.map((ext: any, extIdx: number) => (
                            <tr
                              key={ext.id || extIdx}
                              className="hover:bg-slate-50/50"
                            >
                              <td className="py-2 px-3 text-center font-medium text-slate-500">
                                {extIdx + 1}
                              </td>
                              <td className="py-2 px-3">
                                {ext.company || "-"}
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-900">
                                {ext.productName || "-"}
                              </td>
                              <td className="py-2 px-3 text-slate-600">
                                {ext.activeIngredient || "-"}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className="bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded text-[11px] font-semibold">
                                  {ext.formula || "SL"}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-semibold text-emerald-700">
                                {ext.applicationRate || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ─── หมวดที่ 4: อุปกรณ์ที่ใช้ฉีดพ่น ─── */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-2">
                <Beaker className="w-4 h-4 text-emerald-600" />
                <span>4. อุปกรณ์ที่ใช้ฉีดพ่น (Spray Equipment)</span>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-150 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-500 font-medium">
                    อุปกรณ์หลัก:
                  </span>
                  <div className="font-bold text-slate-900 bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>
                      {sprayEquipment ||
                        "เครื่องพ่นสะพายหลัง (เครื่องยนต์ / แบตเตอรี่)"}
                    </span>
                  </div>
                </div>

                {otherEquipment && (
                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium">
                      อุปกรณ์อื่นๆ เพิ่มเติม:
                    </span>
                    <div className="font-medium text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200/80">
                      {otherEquipment}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ─── หมวดที่ 5: สินค้าที่เบิกตามแผน ─── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>5. สินค้าที่เบิกตามแผนและการใช้จริง</span>
                </div>
                <span className="text-xs text-slate-500">
                  {effectivePlannedProds.length} รายการ
                </span>
              </div>

              {effectivePlannedProds.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10">ลำดับ</th>
                        <th className="py-2.5 px-3">ชื่อสินค้า</th>
                        <th className="py-2.5 px-3 text-center">เบิกตามแผน</th>
                        <th className="py-2.5 px-3 text-center">ใช้จริง</th>
                        <th className="py-2.5 px-3 text-center">ปริมาณเพิ่ม</th>
                        <th className="py-2.5 px-3 text-right">อัตราการใช้</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {effectivePlannedProds.map((prod: any, pIdx: number) => {
                        const hasDiff =
                          prod.withdrawnQuantity != null &&
                          prod.actualQuantity != null &&
                          Number(prod.withdrawnQuantity) !==
                            Number(prod.actualQuantity);

                        return (
                          <tr
                            key={prod.productId || pIdx}
                            className="hover:bg-slate-50/50"
                          >
                            <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                              {pIdx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {prod.productName || "-"}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                {prod.withdrawnQuantity ?? 1}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={cn(
                                  "font-bold px-2 py-0.5 rounded",
                                  hasDiff
                                    ? "bg-amber-100 text-amber-900"
                                    : "bg-emerald-100 text-emerald-900",
                                )}
                              >
                                {prod.actualQuantity ??
                                  prod.withdrawnQuantity ??
                                  1}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {prod.extraQuantity ? (
                                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  {prod.extraQuantity}{" "}
                                  {prod.extraUnit || "ซีซี"}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                              {prod.applicationRate || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-4 text-center text-xs text-slate-500 border border-slate-150">
                  ไม่มีรายการสินค้าที่เบิกตามแผน
                </div>
              )}
            </section>

            {/* ─── หมวดที่ 6: สินค้าเพิ่มเติมในการปฏิบัติงาน ─── */}
            {effectiveAdditionalProds.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <PlusCircle className="w-4 h-4 text-amber-600" />
                    <span>
                      6. สินค้าเพิ่มเติมในการปฏิบัติงาน (นอกเหนือจากแผน)
                    </span>
                  </div>
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px]">
                    {effectiveAdditionalProds.length} รายการ
                  </Badge>
                </div>

                <div className="overflow-x-auto rounded-xl border border-amber-200 bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-amber-50/70 text-amber-900 font-semibold border-b border-amber-200">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10">ลำดับ</th>
                        <th className="py-2.5 px-3">ชื่อสินค้า</th>
                        <th className="py-2.5 px-3 text-center">
                          จำนวนที่ใช้จริง
                        </th>
                        <th className="py-2.5 px-3 text-center">ปริมาณเพิ่ม</th>
                        <th className="py-2.5 px-3 text-right">อัตราการใช้</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 text-slate-800">
                      {effectiveAdditionalProds.map(
                        (prod: any, aIdx: number) => (
                          <tr
                            key={prod.id || prod.productId || aIdx}
                            className="hover:bg-amber-50/30"
                          >
                            <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                              {aIdx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {prod.productName || "-"}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-amber-900">
                              {prod.actualQuantity ?? 1}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {prod.extraQuantity ? (
                                <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  {prod.extraQuantity}{" "}
                                  {prod.extraUnit || "ซีซี"}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                              {prod.applicationRate || "-"}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ─── หมวดที่ 7: ภาพถ่ายสภาพแปลงเริ่มต้น ─── */}
            {plotPhotos.length > 0 && (
              <section className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>
                      7. ภาพถ่ายสภาพแปลงเริ่มต้น (Initial Plot Photos)
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {plotPhotos.length} รูป
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {plotPhotos.map((photo, pIdx) => (
                    <button
                      type="button"
                      key={photo.id || pIdx}
                      onClick={() =>
                        openLightbox("ภาพถ่ายสภาพแปลงสาธิต", plotPhotos, pIdx)
                      }
                      className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all hover:shadow-md cursor-pointer"
                    >
                      <img
                        src={photo.url}
                        alt={photo.name || `รูปแปลงสาธิตที่ ${pIdx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-semibold bg-black/60 px-2 py-1 rounded-md">
                          ดูรูปขนาดเต็ม
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* ─── หมวดที่ 8: ประวัติการลงพื้นที่ติดตามแปลงสาธิต (Follow-Up Timeline) ─── */}
            <section className="space-y-3 pt-4 border-t border-slate-200">
              <Type7aPlotFollowUpTimeline demoPlot={dp || plot} />
            </section>
          </div>
        );
      })}

      {/* Lightbox Modal */}
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

// Backward-compatible alias
export const DetailType7NewDemo = Type7aDetailView;
