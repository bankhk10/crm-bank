"use client";

import React, { useState } from "react";
import {
  MapPin,
  ExternalLink,
  Camera,
  Eye,
  X,
  PackageCheck,
} from "lucide-react";
import type { Type13PlotItem } from "../../shared/types";
import type {
  Type13DetailData,
  Type13DetailProps,
  Type13DetailViewProps,
  DetailType13AttackProps,
} from "../types/actual.types";

export type {
  DetailType13AttackProps,
  Type13DetailProps,
  Type13DetailViewProps,
};

export function Type13DetailView({
  isVisible = true,
  plots = [],
  actualData,
  planSummary,
}: Type13DetailViewProps) {
  const [activePlotIdx, setActivePlotIdx] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!isVisible) return null;

  const hasAnyData =
    (plots && plots.length > 0) ||
    (actualData?.type13PlotsActual &&
      actualData.type13PlotsActual.length > 0) ||
    (actualData?.attachments && actualData.attachments.length > 0) ||
    Boolean((actualData as any)?.plots && (actualData as any).plots.length > 0);

  if (!hasAnyData) {
    return null;
  }

  const effectivePlots: Type13PlotItem[] =
    plots.length > 0
      ? plots
      : [
          {
            id: "plot-1",
            name: "แปลงที่ 1",
            storeId: "",
            ownerName: "",
            province: "",
            district: "",
            products: [],
          },
        ];

  const currentPlot = effectivePlots[activePlotIdx] || effectivePlots[0];
  const currentPlotId = currentPlot.id || currentPlot.demoPlotId;

  // Extract all available Type 13 actual results
  const rawResults: any[] =
    (actualData as any)?.plots ||
    (planSummary as any)?.type13Results ||
    (planSummary as any)?.results?.filter?.(
      (r: any) => r.type13ResultId || r.workTypeCode === "TYPE_13",
    ) ||
    [];

  // Find the specific result matching current plot
  const currentPlotResult =
    rawResults.find(
      (r: any) =>
        (currentPlotId &&
          (r.targetId === currentPlotId ||
            r.targetId === currentPlot.id ||
            r.targetId === currentPlot.demoPlotId)) ||
        (currentPlot.result && r.id === currentPlot.result.id) ||
        ((currentPlot as any).resultId &&
          r.id === (currentPlot as any).resultId),
    ) ||
    rawResults[activePlotIdx] ||
    currentPlot.result ||
    null;

  const currentPlotResultId =
    currentPlotResult?.id ||
    currentPlot.result?.id ||
    (currentPlot as any).resultId;

  // Coordinates & actual plots count for current plot
  const plotCoord =
    actualData?.type13PlotsActual?.find(
      (c) =>
        c.demoPlotId === currentPlot.id ||
        (currentPlot.demoPlotId && c.demoPlotId === currentPlot.demoPlotId),
    ) ||
    (currentPlotResult?.actualLatitude && currentPlotResult?.actualLongitude
      ? {
          latitude: currentPlotResult.actualLatitude,
          longitude: currentPlotResult.actualLongitude,
          actualPlotsCount: currentPlotResult.actualPlotsCount,
        }
      : null) ||
    (currentPlot.latitude && currentPlot.longitude
      ? {
          latitude: currentPlot.latitude,
          longitude: currentPlot.longitude,
          actualPlotsCount: currentPlot.actualPlotsCount,
        }
      : null);

  const actualPlotsCount =
    (plotCoord as any)?.actualPlotsCount ??
    currentPlotResult?.actualPlotsCount ??
    currentPlot.actualPlotsCount;

  // Resolve planned demo products for current plot
  const currentPlotTargetProds: any[] = (() => {
    // 1. From currentPlot object directly
    if (
      Array.isArray(currentPlot.withdrawnProducts) &&
      currentPlot.withdrawnProducts.length > 0
    ) {
      return currentPlot.withdrawnProducts;
    }
    if (
      Array.isArray(currentPlot.products) &&
      currentPlot.products.length > 0
    ) {
      return currentPlot.products;
    }
    if (
      Array.isArray((currentPlot as any).demoProducts) &&
      (currentPlot as any).demoProducts.length > 0
    ) {
      return (currentPlot as any).demoProducts;
    }

    // 2. From planSummary.type13Products matching targetId
    const planT13Products = (planSummary as any)?.type13Products;
    if (Array.isArray(planT13Products) && planT13Products.length > 0) {
      const matched = planT13Products.filter(
        (p: any) =>
          p.targetId &&
          (p.targetId === currentPlotId ||
            p.targetId === currentPlot.id ||
            p.targetId === currentPlot.demoPlotId),
      );
      if (matched.length > 0) return matched;
      if (effectivePlots.length <= 1) return planT13Products;
    }

    // 3. From planSummary.type13Targets matching targetId
    const planT13Targets = (planSummary as any)?.type13Targets;
    if (Array.isArray(planT13Targets) && planT13Targets.length > 0) {
      const matchedTarget = planT13Targets.find(
        (t: any) =>
          (currentPlotId &&
            (t.id === currentPlotId || t.demoPlotId === currentPlotId)) ||
          t.id === currentPlot.id,
      );
      if (matchedTarget) {
        if (
          Array.isArray(matchedTarget.withdrawnProducts) &&
          matchedTarget.withdrawnProducts.length > 0
        ) {
          return matchedTarget.withdrawnProducts;
        }
        if (
          Array.isArray(matchedTarget.products) &&
          matchedTarget.products.length > 0
        ) {
          return matchedTarget.products;
        }
      }
    }

    return [];
  })();

  // Resolve spray/actual products for current plot
  const currentPlotSprayProds: any[] = (() => {
    // 1. From currentPlotResult
    if (currentPlotResult) {
      const rProds =
        currentPlotResult.sprayRounds?.[0]?.sprayProducts ||
        currentPlotResult.sprayRounds?.[0]?.products ||
        currentPlotResult.sprayProducts ||
        currentPlotResult.products;
      if (Array.isArray(rProds) && rProds.length > 0) {
        return rProds;
      }
    }

    // 2. From actualData.sprayRounds
    const allRounds = actualData?.sprayRounds || [];
    const matchedRound =
      allRounds.find(
        (r: any) =>
          (currentPlotId &&
            (r.demoPlotId === currentPlotId ||
              r.targetId === currentPlotId ||
              (r as any).result?.targetId === currentPlotId)) ||
          (currentPlotResultId && r.resultId === currentPlotResultId),
      ) ||
      (effectivePlots.length <= 1 ? allRounds[0] : allRounds[activePlotIdx]);

    if (matchedRound) {
      const rProds =
        (matchedRound as any).sprayProducts || (matchedRound as any).products;
      if (Array.isArray(rProds) && rProds.length > 0) {
        return rProds;
      }
    }

    return [];
  })();

  // Merge into effective planned demo products list
  const effectiveDemoProducts = (() => {
    if (currentPlotTargetProds.length > 0) {
      return currentPlotTargetProds.map((tp: any, idx: number) => {
        const pId = tp.productId || tp.product?.id || tp.id;
        const pName =
          tp.productName || tp.product?.name || tp.name || "สินค้าตามแผน";
        const unit = tp.unit || tp.product?.unit || "ขวด";
        const withdrawnQty =
          tp.quantity ?? tp.withdrawnQuantity ?? tp.targetQuantity ?? 1;

        // Try to find matching actual record
        const matchedActual =
          currentPlotSprayProds.find(
            (sp: any) => (sp.productId || sp.product?.id) === pId,
          ) || currentPlotSprayProds[idx];

        const actualQty =
          matchedActual?.quantityUsed != null
            ? Number(matchedActual.quantityUsed)
            : matchedActual?.actualQuantity != null
              ? Number(matchedActual.actualQuantity)
              : null;

        const actualRate =
          matchedActual?.actualRate ||
          tp.actualRate ||
          tp.applicationRate ||
          null;

        const extraDisplay =
          matchedActual?.extraQuantity != null &&
          String(matchedActual.extraQuantity).trim() !== ""
            ? `${matchedActual.extraQuantity} ${matchedActual.extraUnit || "ซีซี"}`
            : matchedActual?.detail ||
              (tp.extraQuantity
                ? `${tp.extraQuantity} ${tp.extraUnit || "ซีซี"}`
                : null);

        return {
          productId: pId,
          productName: pName,
          unit,
          withdrawnQuantity: withdrawnQty,
          actualQuantity: actualQty,
          extraQuantity:
            matchedActual?.extraQuantity ?? tp.extraQuantity ?? null,
          extraUnit: matchedActual?.extraUnit ?? tp.extraUnit ?? "ซีซี",
          extraDisplay,
          actualRate,
        };
      });
    }

    // Fallback: If no target products were specified in plan, but actual spray products exist
    if (currentPlotSprayProds.length > 0) {
      return currentPlotSprayProds.map((sp: any) => {
        const pId = sp.productId || sp.product?.id || "";
        const pName = sp.productName || sp.product?.name || "สินค้าตัวอย่าง";
        const unit = sp.unit || sp.product?.unit || "ขวด";
        const actualQty =
          sp.quantityUsed != null
            ? Number(sp.quantityUsed)
            : sp.actualQuantity != null
              ? Number(sp.actualQuantity)
              : 1;
        const withdrawnQty =
          sp.withdrawnQuantity != null
            ? Number(sp.withdrawnQuantity)
            : actualQty;

        const extraDisplay =
          sp.extraQuantity != null && String(sp.extraQuantity).trim() !== ""
            ? `${sp.extraQuantity} ${sp.extraUnit || "ซีซี"}`
            : sp.detail || null;

        return {
          productId: pId,
          productName: pName,
          unit,
          withdrawnQuantity: withdrawnQty,
          actualQuantity: actualQty,
          extraQuantity: sp.extraQuantity ?? null,
          extraUnit: sp.extraUnit ?? "ซีซี",
          extraDisplay,
          actualRate: sp.actualRate || null,
        };
      });
    }

    return [];
  })();

  // Build sets of identifiers that belong to OTHER plots to prevent photo leakage
  const otherPlotResultIds = new Set<string>();
  const otherPlotTargetIds = new Set<string>();

  effectivePlots.forEach((p, idx) => {
    if (idx !== activePlotIdx) {
      if (p.id) otherPlotTargetIds.add(p.id);
      if (p.demoPlotId) otherPlotTargetIds.add(p.demoPlotId);
      if (p.result?.id) otherPlotResultIds.add(p.result.id);
      if ((p as any).resultId) otherPlotResultIds.add((p as any).resultId);
      const otherRes =
        rawResults.find(
          (r: any) =>
            (p.id && r.targetId === p.id) ||
            (p.demoPlotId && r.targetId === p.demoPlotId),
        ) || rawResults[idx];
      if (otherRes?.id) otherPlotResultIds.add(otherRes.id);
    }
  });

  // Collect and deduplicate after-spray attachments for current plot
  const afterSprayAttachments: Array<{ fileUrl: string; fileName?: string }> =
    [];
  const seenUrls = new Set<string>();

  const addAttachment = (att: any) => {
    if (!att) return;
    const url = att.fileUrl || att.url;
    if (!url || typeof url !== "string" || seenUrls.has(url)) return;
    seenUrls.add(url);
    afterSprayAttachments.push({
      fileUrl: url,
      fileName:
        att.fileName || att.name || `ภาพหลังพ่นแปลงที่ ${activePlotIdx + 1}`,
    });
  };

  // 1. Direct attachments from currentPlotResult
  if (
    currentPlotResult?.attachments &&
    Array.isArray(currentPlotResult.attachments)
  ) {
    currentPlotResult.attachments.forEach(addAttachment);
  }

  // 2. Direct afterSprayImages from currentPlot object
  if (Array.isArray((currentPlot as any).afterSprayImages)) {
    (currentPlot as any).afterSprayImages.forEach(addAttachment);
  }
  if (Array.isArray((currentPlot as any).attachments)) {
    (currentPlot as any).attachments.forEach(addAttachment);
  }

  // 3. Scan attachments from actualData and planSummary
  const rawAttachmentsList: any[] = [
    ...(actualData?.attachments || []),
    ...((planSummary as any)?.attachments || []),
  ];

  rawAttachmentsList.forEach((att: any) => {
    if (!att || att.sprayRoundId) return;

    // Reject attachments explicitly assigned to another plot
    if (att.type13ResultId && otherPlotResultIds.has(att.type13ResultId))
      return;
    if (att.targetId && otherPlotTargetIds.has(att.targetId)) return;
    if (att.demoPlotId && otherPlotTargetIds.has(att.demoPlotId)) return;

    const matchesResultId =
      currentPlotResultId && att.type13ResultId === currentPlotResultId;
    const matchesTargetId =
      currentPlotId &&
      (att.targetId === currentPlotId || att.demoPlotId === currentPlotId);
    const matchesFileName =
      att.fileName &&
      (att.fileName.includes(`แปลงแฮตแทค ${activePlotIdx + 1}`) ||
        att.fileName.includes(`แปลงที่ ${activePlotIdx + 1}`) ||
        att.fileName.includes(`plot_${activePlotIdx + 1}`));

    const belongsToOtherFileName =
      effectivePlots.length > 1 &&
      att.fileName &&
      effectivePlots.some((_, idx) => {
        if (idx === activePlotIdx) return false;
        return (
          att.fileName.includes(`แปลงแฮตแทค ${idx + 1}`) ||
          att.fileName.includes(`แปลงที่ ${idx + 1}`) ||
          att.fileName.includes(`plot_${idx + 1}`)
        );
      });

    if (belongsToOtherFileName) return;

    const isGeneralT13 =
      att.workTypeCode === "TYPE_13" ||
      att.category === "PLOT" ||
      att.category === "AFTER_SPRAY" ||
      (typeof att.fileUrl === "string" &&
        (att.fileUrl.includes("/type13/") ||
          att.fileUrl.includes("after_spray")));

    if (matchesResultId || matchesTargetId || matchesFileName) {
      addAttachment(att);
    } else if (effectivePlots.length <= 1 && isGeneralT13) {
      addAttachment(att);
    }
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 space-y-5 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
            13
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <span>ผลการฉีดแปลงแฮตแทค (TYPE_13)</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                ทั้งหมด {effectivePlots.length} แปลง
              </span>
            </h4>
            <p className="text-xs text-slate-500">รูปถ่ายผลการปฏิบัติงานจริง</p>
          </div>
        </div>
      </div>

      {/* Plot Tabs (if multiple) */}
      {effectivePlots.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {effectivePlots.map((plot, pIdx) => {
            const isActive = pIdx === activePlotIdx;
            return (
              <button
                key={plot.id || pIdx}
                type="button"
                onClick={() => setActivePlotIdx(pIdx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  isActive
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>{plot.name || `แปลงที่ ${pIdx + 1}`}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Current Plot Actual Card */}
      <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-4">
        {/* Info & GPS Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200">
          <div>
            <span className="block text-[11px] text-slate-400 font-medium">
              ชื่อแปลง
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              {currentPlot.name || `แปลงที่ ${activePlotIdx + 1}`}
            </span>
          </div>

          {currentPlot.objective && (
            <div>
              <span className="block text-[11px] text-slate-400 font-medium">
                วัตถุประสงค์
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                {currentPlot.objective}
              </span>
            </div>
          )}

          <div>
            <span className="block text-[11px] text-slate-400 font-medium">
              ร้านค้า Dealer
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-700">
              {currentPlot.dealerName ||
                currentPlot.ownerName ||
                currentPlot.storeId ||
                "-"}
            </span>
            <span className="block text-[11px] text-slate-400 mt-0.5">
              {[
                currentPlot.subdistrict ? `ต.${currentPlot.subdistrict}` : null,
                currentPlot.district ? `อ.${currentPlot.district}` : null,
                currentPlot.province ? `จ.${currentPlot.province}` : null,
              ]
                .filter(Boolean)
                .join(" ") || "-"}
              {currentPlot.village ? ` (ม.${currentPlot.village})` : ""}
            </span>
          </div>

          {(currentPlot.plannedPlotsCount != null ||
            actualPlotsCount != null) && (
            <div>
              <span className="block text-[11px] text-slate-400 font-medium">
                จำนวนแปลง (แผน)
              </span>
              <span className="text-xs sm:text-sm font-semibold text-emerald-800">
                {currentPlot.plannedPlotsCount != null
                  ? `${currentPlot.plannedPlotsCount} แปลง`
                  : ""}
              </span>
            </div>
          )}

          {plotCoord && (
            <div className="sm:col-span-2 md:col-span-1">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <span> จำนวนแปลง (ฉีดจริง)</span>
              </span>
              <span className="text-xs sm:text-sm font-semibold text-emerald-800">
                {actualPlotsCount != null && (
                  <span className="text-emerald-700 ml-1.5 font-bold">
                    {actualPlotsCount} แปลง
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* 1.1 สินค้าที่เบิกตามแผน (Planned Demo Products) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <h6 className="font-bold text-xs sm:text-sm text-slate-800">
                1.1 สินค้าที่เบิกตามแผน (Planned Demo Products)
              </h6>
            </div>
            {effectiveDemoProducts.length > 0 && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {effectiveDemoProducts.length} รายการ
              </span>
            )}
          </div>

          {effectiveDemoProducts.length > 0 ? (
            <div className="space-y-2.5">
              {effectiveDemoProducts.map((prod, prodIdx) => (
                <div
                  key={prod.productId || prodIdx}
                  className="bg-white rounded-xl border border-slate-200/90 p-3.5 space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0">
                        {prodIdx + 1}
                      </span>
                      <span>{prod.productName || "สินค้าตัวอย่าง"}</span>
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/70">
                      จำนวนที่เบิก:{" "}
                      <span className="font-bold">
                        {prod.withdrawnQuantity}
                      </span>{" "}
                      {prod.unit || "ขวด"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    {/* 1. จำนวนที่ใช้จริง */}
                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      <span className="block text-[11px] text-slate-400 font-medium mb-0.5">
                        จำนวนที่ใช้จริง
                      </span>
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">
                        {prod.actualQuantity != null &&
                        String(prod.actualQuantity) !== ""
                          ? `${prod.actualQuantity} ${prod.unit || "ขวด"}`
                          : "-"}
                      </span>
                    </div>

                    {/* 2. ปริมาณที่ใช้เพิ่ม */}
                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      <span className="block text-[11px] text-slate-400 font-medium mb-0.5">
                        ปริมาณที่ใช้เพิ่ม (ครึ่งขวด)
                      </span>
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">
                        {prod.extraDisplay || "-"}
                      </span>
                    </div>

                    {/* 3. อัตราการใช้จริง */}
                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      <span className="block text-[11px] text-slate-400 font-medium mb-0.5">
                        อัตราการใช้จริง
                      </span>
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">
                        {prod.actualRate || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3.5 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
              ไม่มีรายการสินค้าตัวอย่างที่ขอเบิกไว้ในแผนงานสำหรับแปลงนี้
            </div>
          )}
        </div>

        {/* Notes (if any) */}
        {currentPlotResult?.notes && (
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <span className="block text-[11px] text-slate-400 font-medium">
              บันทึกเพิ่มเติม
            </span>
            <p className="text-xs text-slate-700 whitespace-pre-wrap">
              {currentPlotResult.notes}
            </p>
          </div>
        )}

        {/* After-Spray Photos */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-600" />
            <h6 className="font-bold text-xs sm:text-sm text-slate-800">
              รูปถ่าย ({afterSprayAttachments.length} รูป)
            </h6>
          </div>

          {afterSprayAttachments.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {afterSprayAttachments.map((att, attIdx) => (
                <div
                  key={attIdx}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-xs"
                  onClick={() => setPreviewImage(att.fileUrl)}
                >
                  <img
                    src={att.fileUrl}
                    alt={att.fileName || `after-spray-${attIdx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Eye className="w-4 h-4 text-white drop-shadow-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
              ยังไม่มีรูปถ่ายผลการปฏิบัติงานสำหรับแปลงนี้
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Full size preview"
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export {
  Type13DetailView as DetailType13Attack,
  Type13DetailView as Type13Detail,
};
